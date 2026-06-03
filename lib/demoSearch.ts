
import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_API_KEY || process.env.BD_API_KEY;
const zone = process.env.BRIGHT_DATA_SERP_ZONE || process.env.BRIGHTDATA_SERP_ZONE || process.env.BD_ZONE || "serp_api1";
const dataDir = process.env.VERCEL ? "/tmp/brightdata-demo-snapshots" : path.join(process.cwd(), ".data");
fs.mkdirSync(dataDir, { recursive: true });

type SerpItem = { title: string; url: string; snippet: string; rank: number; sourceQuery: string };

function slugify(value: string) {
  return String(value || "keyword").toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "keyword";
}

export function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "unknown"; }
}

export function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/^utm_|^(fbclid|gclid|igshid|mc_cid|mc_eid)$/i.test(key)) u.searchParams.delete(key);
    }
    return u.toString().replace(/\/$/, "");
  } catch { return url; }
}

function parseMaybeJson(value: unknown): any {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function parseBrightDataResponse(data: any, sourceQuery: string): SerpItem[] {
  const parsedBody = parseMaybeJson(data?.body);
  const parsedData = parseMaybeJson(data?.data);
  const candidates = [data?.organic, data?.results, data?.search_results, parsedBody?.organic, parsedBody?.results, parsedBody?.search_results, parsedData?.organic, parsedData?.results, parsedData?.search_results];
  const arr = candidates.find(Array.isArray) || [];
  return arr.map((r: any, idx: number) => ({
    title: String(r.title || r.name || `Result ${idx + 1}`),
    url: normalizeUrl(String(r.link || r.url || r.displayed_link || "")),
    snippet: String(r.description || r.snippet || r.text || ""),
    rank: Number(r.rank || r.position || idx + 1),
    sourceQuery,
  })).filter((r: SerpItem) => r.url.startsWith("http")).slice(0, 10);
}

export async function brightDataSearch(query: string, { hl = "ko", gl = "kr" } = {}) {
  if (!apiKey) throw new Error("BRIGHT_DATA_API_KEY가 필요합니다.");
  const google = new URL("https://www.google.com/search");
  google.searchParams.set("q", query);
  google.searchParams.set("brd_json", "1");
  google.searchParams.set("hl", hl);
  google.searchParams.set("gl", gl);
  const response = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ zone, url: google.toString(), format: "json", data_format: "parsed_light" }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Bright Data SERP API 실패: ${response.status} ${(await response.text()).slice(0, 180)}`);
  return parseBrightDataResponse(await response.json(), query);
}

function tokenize(text: string) {
  return String(text).toLowerCase().replace(/[^a-z0-9가-힣\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function expandDeveloperDocQueries(query: string) {
  const base = query.trim() || "Next.js App Router에서 Stripe 웹훅 처리할 때 주의할 점 알려줘";
  const normalized = base.replace(/[?.!。！？]+$/g, "");
  const lower = normalized.toLowerCase();
  if ((lower.includes("stripe") || normalized.includes("스트라이프")) && (lower.includes("webhook") || normalized.includes("웹훅")) && lower.includes("next")) {
    return ["Next.js App Router Stripe webhook raw body official docs", "Stripe webhook signatures Next.js route handler official docs", "Next.js Route Handlers request body official docs", "Vercel environment variables Stripe webhook Next.js official docs"];
  }
  return Array.from(new Set([`${normalized} official docs`, `${normalized} 공식 문서`, `${normalized} GitHub README changelog issue`, `${normalized} implementation example latest`])).slice(0, 4);
}

function sourceType(url: string) {
  const d = domainOf(url);
  if (d.startsWith("docs.") || d.includes("developer.") || d === "developer.mozilla.org") return "공식 문서";
  if (["nextjs.org", "react.dev", "stripe.com", "vercel.com", "brightdata.com", "nodejs.org", "typescriptlang.org"].includes(d)) return "공식 사이트";
  if (d === "github.com") return "GitHub";
  if (d.includes("stackoverflow.com")) return "StackOverflow";
  if (d.includes("blog") || d.includes("medium") || d.includes("velog") || d.includes("dev.to")) return "블로그/해설";
  return "일반 웹";
}

function scoreDocsResult(item: SerpItem, originalQuery: string, allItems: SerpItem[]) {
  const type = sourceType(item.url);
  const text = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();
  const qTokens = new Set(tokenize(originalQuery));
  const tTokens = tokenize(text);
  const matched = tTokens.filter((t) => qTokens.has(t)).length;
  const bm25Lite = qTokens.size ? Math.min(1, matched / qTokens.size) : 0;
  const rrf = 1 / (60 + item.rank);
  const repeatCount = allItems.filter((x) => normalizeUrl(x.url) === normalizeUrl(item.url)).length;
  const repeatBonus = Math.min(0.18, (repeatCount - 1) * 0.06);
  const authority = type === "공식 문서" ? 0.52 : type === "공식 사이트" ? 0.46 : type === "GitHub" ? 0.28 : type === "StackOverflow" ? 0.12 : type === "블로그/해설" ? 0.04 : 0.03;
  const freshness = /2026|2025|latest|current|changelog|release|migration|upgrade|최신|변경/.test(text) ? 0.08 : 0;
  const stalePenalty = /2020|2021|old|outdated|deprecated|legacy|구버전|폐기/.test(text) ? 0.15 : 0;
  const score = authority + repeatBonus + freshness + (bm25Lite * 0.26) + (rrf * 10) - stalePenalty;
  const reasons = [] as string[];
  if (type === "공식 문서" || type === "공식 사이트") reasons.push(type);
  if (type === "GitHub") reasons.push("코드/README 근거");
  if (repeatCount > 1) reasons.push(`${repeatCount}개 쿼리에서 반복 등장`);
  if (freshness) reasons.push("최신성 신호");
  if (stalePenalty) reasons.push("오래된 정보 감점");
  if (bm25Lite > 0.25) reasons.push("질문 키워드 매칭");
  return { score: Number(Math.max(0, Math.min(1, score)).toFixed(2)), reasons: reasons.length ? reasons : ["기본 관련도"] };
}

export async function docsSearch(query: string) {
  const expandedQueries = expandDeveloperDocQueries(query);
  const startedAt = Date.now();
  const settled = await Promise.allSettled(expandedQueries.map((q) => brightDataSearch(q)));
  const batches = settled.filter((r): r is PromiseFulfilledResult<SerpItem[]> => r.status === "fulfilled").map((r) => r.value);
  const queryErrors = settled.map((r, idx) => r.status === "rejected" ? { query: expandedQueries[idx], error: r.reason instanceof Error ? r.reason.message : String(r.reason) } : null).filter(Boolean);
  const flat = batches.flat();
  if (!flat.length) throw new Error((queryErrors[0] as any)?.error || "모든 Bright Data SERP 호출이 실패했습니다.");
  const byUrl = new Map<string, SerpItem>();
  for (const item of flat) {
    const key = normalizeUrl(item.url);
    const prev = byUrl.get(key);
    if (!prev || item.rank < prev.rank) byUrl.set(key, { ...item, url: key });
  }
  const unique = [...byUrl.values()];
  const domainCounts = new Map<string, number>();
  for (const item of unique) domainCounts.set(domainOf(item.url), (domainCounts.get(domainOf(item.url)) || 0) + 1);
  const results = unique.map((item) => {
    const scored = scoreDocsResult(item, query, flat);
    return { ...item, domain: domainOf(item.url), type: sourceType(item.url), score: scored.score, reasons: scored.reasons, domainDiversity: Number((1 / (domainCounts.get(domainOf(item.url)) || 1)).toFixed(2)) };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
  return { mode: "live", demo: "official-docs-first-search-api", query, expandedQueries, elapsedMs: Date.now() - startedAt, queryErrors, successfulQueries: batches.length, rawResultCount: flat.length, resultCount: results.length, uniqueDomains: new Set(results.map((r) => r.domain)).size, results };
}

function snapshotPath(keyword: string) { return path.join(dataDir, `brand-${slugify(keyword)}.json`); }
function classifyResult(item: SerpItem) {
  const d = domainOf(item.url); const text = `${item.title} ${item.snippet} ${item.url}`.toLowerCase();
  if (d.includes("youtube")) return "영상";
  if (d.includes("reddit") || d.includes("community") || d.includes("forum")) return "커뮤니티";
  if (d.includes("news") || /뉴스|보도|press/.test(text)) return "뉴스";
  if (d.includes("blog") || d.includes("medium") || d.includes("velog") || d.includes("dev.to")) return "블로그";
  if (/review|리뷰|compare|alternative|vs|비교/.test(text)) return "리뷰/비교";
  return "웹페이지";
}
function diffSnapshots(previous: any, current: any) {
  const prevMap = new Map((previous?.results || []).map((r: any) => [normalizeUrl(r.url), r]));
  const curMap = new Map(current.results.map((r: any) => [normalizeUrl(r.url), r]));
  const newlyFound: any[] = [], disappeared: any[] = [], movedUp: any[] = [], movedDown: any[] = [];
  for (const [url, curUnknown] of curMap) {
    const cur: any = curUnknown;
    const prev: any = prevMap.get(url);
    if (!prev) newlyFound.push(cur);
    else if (prev.rank !== cur.rank) {
      const item = { ...cur, previousRank: prev.rank, currentRank: cur.rank, delta: prev.rank - cur.rank };
      if (cur.rank < prev.rank) movedUp.push(item); else movedDown.push(item);
    }
  }
  for (const [url, prev] of prevMap) if (!curMap.has(url)) disappeared.push(prev);
  return { newlyFound, disappeared, movedUp, movedDown };
}

export async function brandMonitor(keyword: string, action = "compare") {
  const startedAt = Date.now();
  const raw = await brightDataSearch(keyword || "ZeroChoTV AI coding tools");
  const results = raw.map((r) => ({ ...r, url: normalizeUrl(r.url), domain: domainOf(r.url), category: classifyResult(r) }));
  const current = { keyword, capturedAt: new Date().toISOString(), results };
  const file = snapshotPath(keyword);
  const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const diff = diffSnapshots(previous, current);
  if (action === "save" || action === "compare") fs.writeFileSync(file, JSON.stringify(current, null, 2), "utf8");
  const domains = new Map<string, number>(), categories = new Map<string, number>();
  for (const r of results) { domains.set(r.domain, (domains.get(r.domain) || 0) + 1); categories.set(r.category, (categories.get(r.category) || 0) + 1); }
  return { mode: "live", demo: "brand-competitor-monitoring", keyword, action, elapsedMs: Date.now() - startedAt, previousSnapshotAt: previous?.capturedAt || null, currentSnapshotAt: current.capturedAt, snapshotSaved: action === "save" || action === "compare", resultCount: results.length, uniqueDomains: domains.size, domainDistribution: [...domains.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count), categoryDistribution: [...categories.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count), diff, topResults: results.slice(0, 10) };
}
