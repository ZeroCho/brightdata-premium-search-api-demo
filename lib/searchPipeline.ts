export type SerpItem = {
  title: string;
  url: string;
  description?: string;
  sourceQuery: string;
  rank: number;
};

export type RankedItem = SerpItem & {
  domain: string;
  score: number;
  signals: {
    rrf: number;
    coverage: number;
    domainDiversity: number;
    bm25Lite: number;
  };
};

export type SearchResponse = {
  mode: "live" | "fixture";
  query: string;
  expandedQueries: string[];
  resultCount: number;
  uniqueDomains: number;
  results: RankedItem[];
  note?: string;
};

export function expandQueries(query: string): string[] {
  const base = query.trim();
  const variants = [
    base,
    `${base} benchmark pricing comparison`,
    `${base} API implementation tutorial`,
  ];
  return Array.from(new Set(variants.filter(Boolean))).slice(0, 3);
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function rankResults(items: SerpItem[], originalQuery: string): RankedItem[] {
  const byUrl = new Map<string, SerpItem>();
  for (const item of items) {
    const key = normalizeUrl(item.url);
    const prev = byUrl.get(key);
    if (!prev || item.rank < prev.rank) byUrl.set(key, { ...item, url: key });
  }

  const unique = [...byUrl.values()];
  const domainCounts = new Map<string, number>();
  for (const item of unique) {
    const d = domainOf(item.url);
    domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
  }

  const qTokens = new Set(tokenize(originalQuery));

  return unique
    .map((item) => {
      const domain = domainOf(item.url);
      const textTokens = tokenize(`${item.title} ${item.description ?? ""}`);
      const matched = textTokens.filter((t) => qTokens.has(t)).length;
      const bm25Lite = qTokens.size ? matched / qTokens.size : 0;
      const rrf = 1 / (60 + item.rank);
      const coverage = item.sourceQuery === originalQuery ? 0.9 : 0.7;
      const domainDiversity = 1 / (domainCounts.get(domain) ?? 1);
      const score = Number(((rrf * 40) + (coverage * 25) + (domainDiversity * 20) + (bm25Lite * 15)).toFixed(4));
      return { ...item, domain, score, signals: { rrf, coverage, domainDiversity, bm25Lite } };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function parseBrightDataResponse(data: unknown, sourceQuery: string): SerpItem[] {
  const root = data as Record<string, unknown>;
  const parsedBody = parseMaybeJson(root.body) as Record<string, unknown> | undefined;
  const parsedData = parseMaybeJson(root.data) as Record<string, unknown> | undefined;
  const candidates = [
    root.organic,
    root.results,
    root.search_results,
    parsedBody?.organic,
    parsedBody?.results,
    parsedBody?.search_results,
    parsedData?.organic,
    parsedData?.results,
  ];
  const arr = candidates.find(Array.isArray) as Array<Record<string, unknown>> | undefined;
  if (!arr) return [];
  return arr.map((r, idx) => ({
    title: String(r.title ?? r.name ?? `Result ${idx + 1}`),
    url: String(r.link ?? r.url ?? r.displayed_link ?? ""),
    description: String(r.description ?? r.snippet ?? r.text ?? ""),
    sourceQuery,
    rank: Number(r.rank ?? r.position ?? idx + 1),
  })).filter((r) => r.url.startsWith("http"));
}

export const fixtureItems: SerpItem[] = [
  { title: "Bright Data SERP API documentation", url: "https://docs.brightdata.com/scraping-automation/serp-api/introduction", description: "Collect structured search engine results for AI agents and SEO workflows.", sourceQuery: "fixture", rank: 1 },
  { title: "SERP API pricing and billing", url: "https://docs.brightdata.com/scraping-automation/serp-api/pricing-and-billing", description: "Successful requests are billed with parsing and unblocking included.", sourceQuery: "fixture", rank: 2 },
  { title: "Parsed JSON Results with SERP API", url: "https://docs.brightdata.com/scraping-automation/serp-api/parsed-json-results/parsing-search-results", description: "Convert raw SERP HTML into structured JSON for Google and Bing.", sourceQuery: "fixture", rank: 3 },
];
