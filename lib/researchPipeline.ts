import { domainOf, normalizeUrl, parseBrightDataResponse, type SerpItem } from "./searchPipeline";

export type Vertical = "dev-error" | "travel" | "product";
export type ResearchParams = {
  vertical: Vertical;
  query: string;
  researchMode: boolean;
  limit: number;
  includeDomains: string[];
  excludeDomains: string[];
  engine: "google" | "bing";
  gl: string;
  hl: string;
};

export type ResearchItem = SerpItem & {
  normalizedUrl: string;
  domain: string;
  category: string;
  duplicateOf?: string;
  score: number;
  signals: { rrf: number; bm25Lite: number; domainDiversity: number; verticalBoost: number; penalty: number };
};

export type DomainCluster = { domain: string; count: number; category: string; items: ResearchItem[] };

export type ResearchResponse = {
  mode: "live" | "fixture";
  vertical: Vertical;
  query: string;
  params: ResearchParams;
  fanoutQueries: string[];
  explanation: string[];
  rawCount: number;
  dedupedCount: number;
  filteredCount: number;
  domainClusters: DomainCluster[];
  rawResults: ResearchItem[];
  dedupedResults: ResearchItem[];
  filteredResults: ResearchItem[];
  rerankedResults: ResearchItem[];
  queryErrors?: string[];
};

const apiKey = () => process.env.BRIGHT_DATA_API_KEY ?? process.env.BRIGHTDATA_API_KEY ?? process.env.BD_API_KEY;
const zone = () => process.env.BRIGHT_DATA_SERP_ZONE ?? process.env.BRIGHTDATA_SERP_ZONE ?? process.env.BD_ZONE ?? "serp_api1";

function cleanQuery(q: string) {
  return q.replace(/공식 문서 기준으로|공식문서 기준으로|정리해줘|알려줘|추천해줘|찾아줘/g, "").trim() || q.trim();
}

export function expandVerticalQueries(vertical: Vertical, query: string, researchMode: boolean): string[] {
  const q = cleanQuery(query);
  if (!researchMode) return [q];

  if (vertical === "dev-error") {
    return Array.from(new Set([
      `${q}`,
      `${q} official documentation`,
      `${q} GitHub issue fix`,
      `${q} Stack Overflow`,
      `${q} site:developer.mozilla.org OR site:react.dev OR site:nextjs.org`,
    ])).slice(0, 5);
  }

  if (vertical === "travel") {
    return Array.from(new Set([
      `${q} 호텔 후기 가격 위치`,
      `${q} hotel review price location`,
      `${q} site:booking.com OR site:agoda.com`,
      `${q} 여행 블로그 후기 단점`,
      `${q} reddit tripadvisor review`,
    ])).slice(0, 5);
  }

  return Array.from(new Set([
    `${q} 실사용 후기 단점`,
    `${q} review long term problems`,
    `${q} reddit review issue`,
    `${q} price comparison specs`,
    `${q} site:youtube.com review`,
  ])).slice(0, 5);
}

function categoryFor(domain: string, title: string, vertical: Vertical) {
  const d = domain.toLowerCase();
  const t = title.toLowerCase();
  if (/docs?|developer|react\.dev|nextjs\.org|spring\.io|rust-lang|go\.dev|stripe/.test(d)) return "공식문서";
  if (/github\.com/.test(d)) return "GitHub";
  if (/stackoverflow\.com|stackexchange\.com/.test(d)) return "Q&A";
  if (/reddit\.com|blind|clien|fmkorea|dcinside|community|forum/.test(d)) return "커뮤니티";
  if (/youtube\.com|youtu\.be/.test(d)) return "영상";
  if (/booking\.com|agoda|tripadvisor|hotels\.com|expedia/.test(d)) return "예약/리뷰";
  if (/naver|tistory|medium|velog|blog/.test(d) || /후기|review/.test(t)) return "블로그/후기";
  if (vertical === "product" && /coupang|amazon|danawa|shopping|store/.test(d)) return "쇼핑/가격";
  return "웹문서";
}

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, " ").split(/\s+/).filter((x) => x.length > 1);
}

function verticalBoost(item: ResearchItem, vertical: Vertical) {
  if (vertical === "dev-error") {
    if (["공식문서", "GitHub", "Q&A"].includes(item.category)) return 0.35;
    if (item.category === "블로그/후기") return 0.08;
  }
  if (vertical === "travel") {
    if (["예약/리뷰", "블로그/후기", "커뮤니티"].includes(item.category)) return 0.3;
    if (item.category === "영상") return 0.12;
  }
  if (vertical === "product") {
    if (["커뮤니티", "블로그/후기", "쇼핑/가격", "영상"].includes(item.category)) return 0.3;
    if (item.category === "공식문서") return 0.04;
  }
  return 0;
}

function penalties(item: ResearchItem) {
  let p = 0;
  if (/ads|sponsor|promo|utm/.test(item.url.toLowerCase())) p += 0.12;
  if (/pinterest|facebook|instagram/.test(item.domain)) p += 0.08;
  return p;
}

export function analyzeResults(items: SerpItem[], params: ResearchParams): Omit<ResearchResponse, "mode" | "vertical" | "query" | "params" | "fanoutQueries" | "explanation" | "queryErrors"> {
  const rawResults: ResearchItem[] = items.map((item) => {
    const normalizedUrl = normalizeUrl(item.url);
    const domain = domainOf(normalizedUrl);
    const category = categoryFor(domain, item.title, params.vertical);
    return { ...item, normalizedUrl, url: normalizedUrl, domain, category, score: 0, signals: { rrf: 0, bm25Lite: 0, domainDiversity: 0, verticalBoost: 0, penalty: 0 } };
  });

  const seen = new Map<string, ResearchItem>();
  const dedupedResults: ResearchItem[] = [];
  for (const item of rawResults) {
    const key = item.normalizedUrl.replace(/\/$/, "");
    if (seen.has(key)) {
      item.duplicateOf = key;
      continue;
    }
    seen.set(key, item);
    dedupedResults.push(item);
  }

  const include = params.includeDomains.map((x) => x.trim()).filter(Boolean);
  const exclude = params.excludeDomains.map((x) => x.trim()).filter(Boolean);
  const filteredResults = dedupedResults.filter((item) => {
    if (include.length && !include.some((d) => item.domain.includes(d))) return false;
    if (exclude.some((d) => item.domain.includes(d))) return false;
    return true;
  }).slice(0, Math.max(1, Math.min(params.limit, 50)));

  const domainCounts = new Map<string, number>();
  for (const item of filteredResults) domainCounts.set(item.domain, (domainCounts.get(item.domain) ?? 0) + 1);
  const qTokens = new Set(tokenize(params.query));

  const rerankedResults = filteredResults.map((item) => {
    const textTokens = tokenize(`${item.title} ${item.description ?? ""} ${item.domain}`);
    const matched = textTokens.filter((t) => qTokens.has(t)).length;
    const bm25Lite = qTokens.size ? matched / qTokens.size : 0;
    const rrf = 1 / (60 + item.rank);
    const domainDiversity = 1 / (domainCounts.get(item.domain) ?? 1);
    const vBoost = verticalBoost(item, params.vertical);
    const penalty = penalties(item);
    const score = Number(((rrf * 45) + (bm25Lite * 25) + (domainDiversity * 12) + (vBoost * 45) - (penalty * 40)).toFixed(4));
    return { ...item, score, signals: { rrf, bm25Lite, domainDiversity, verticalBoost: vBoost, penalty } };
  }).sort((a, b) => b.score - a.score);

  const clusterMap = new Map<string, DomainCluster>();
  for (const item of dedupedResults) {
    const cur = clusterMap.get(item.domain) ?? { domain: item.domain, count: 0, category: item.category, items: [] };
    cur.count += 1;
    cur.items.push(item);
    clusterMap.set(item.domain, cur);
  }
  const domainClusters = [...clusterMap.values()].sort((a, b) => b.count - a.count).slice(0, 12);

  return {
    rawCount: rawResults.length,
    dedupedCount: dedupedResults.length,
    filteredCount: filteredResults.length,
    domainClusters,
    rawResults: rawResults.slice(0, 30),
    dedupedResults: dedupedResults.slice(0, 30),
    filteredResults,
    rerankedResults,
  };
}

export async function fetchBrightDataSerp(query: string, params: ResearchParams): Promise<SerpItem[]> {
  const key = apiKey();
  if (!key) throw new Error("Bright Data API key missing");
  const searchUrl = new URL(params.engine === "bing" ? "https://www.bing.com/search" : "https://www.google.com/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("brd_json", "1");
  searchUrl.searchParams.set("hl", params.hl);
  searchUrl.searchParams.set("gl", params.gl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ zone: zone(), url: searchUrl.toString(), format: "json", data_format: "parsed_light" }),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`${query}: ${res.status} ${(await res.text()).slice(0, 160)}`);
  return parseBrightDataResponse(await res.json(), query);
}

export function fixtureFor(vertical: Vertical, query: string): SerpItem[] {
  const common = (domain: string, title: string, rank: number, sourceQuery = query, desc = "샘플 raw SERP 결과입니다."): SerpItem => ({ title, url: `https://${domain}/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"))}`, description: desc, sourceQuery, rank });
  if (vertical === "dev-error") return [
    common("react.dev", "Hydration mismatch official React docs", 1),
    common("github.com", "next.js hydration failed issue discussion", 2),
    common("stackoverflow.com", "Hydration failed because initial UI does not match", 3),
    common("velog.io", "Next.js hydration error 해결 후기", 4),
  ];
  if (vertical === "travel") return [
    common("booking.com", "Osaka family hotel Namba review", 1),
    common("tripadvisor.com", "Osaka hotel family trip reviews", 2),
    common("blog.naver.com", "오사카 3박4일 가족여행 호텔 후기", 3),
    common("agoda.com", "Osaka Namba hotel price comparison", 4),
  ];
  return [
    common("reddit.com", "MacBook Air M4 developer review long term", 1),
    common("youtube.com", "MacBook Air M4 real use review", 2),
    common("danawa.com", "맥북 에어 M4 가격 비교", 3),
    common("apple.com", "MacBook Air M4 technical specifications", 4),
  ];
}

export function buildExplanation() {
  return [
    "1. Raw: 팬아웃 쿼리별 SERP를 그대로 모읍니다.",
    "2. Cluster: 도메인 기준으로 결과를 묶어 어떤 출처가 많이 나왔는지 봅니다.",
    "3. Dedupe: URL의 query/hash를 제거해 같은 문서를 하나로 합칩니다.",
    "4. Filter: 결과 개수, 포함/제외 도메인, 엔진, 지역/언어 옵션을 적용합니다.",
    "5. Rerank: RRF(상위 노출 보정) + BM25-lite(질문 단어 매칭) + 버티컬별 출처 가중치를 합산합니다.",
  ];
}
