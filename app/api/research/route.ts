import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RERANK_WEIGHTS, analyzeResults, buildExplanation, expandVerticalQueries, fetchBrightDataSerp, fixtureFor, type ResearchParams, type RerankWeights, type Vertical } from "@/lib/researchPipeline";

export const runtime = "nodejs";

function parseList(value: string | null) {
  return (value ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

function parseWeight(value: string | null, fallback: number) {
  if (value == null || value.trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(200, n));
}

function parseWeights(sp: URLSearchParams): RerankWeights {
  return {
    rrf: parseWeight(sp.get("wRrf"), DEFAULT_RERANK_WEIGHTS.rrf),
    bm25Lite: parseWeight(sp.get("wBm25Lite"), DEFAULT_RERANK_WEIGHTS.bm25Lite),
    domainDiversity: parseWeight(sp.get("wDomainDiversity"), DEFAULT_RERANK_WEIGHTS.domainDiversity),
    verticalBoost: parseWeight(sp.get("wVerticalBoost"), DEFAULT_RERANK_WEIGHTS.verticalBoost),
    penalty: parseWeight(sp.get("wPenalty"), DEFAULT_RERANK_WEIGHTS.penalty),
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const vertical = (sp.get("vertical") ?? "dev-error") as Vertical;
  const query = sp.get("q")?.trim() || "Hydration failed because the initial UI does not match";
  const params: ResearchParams = {
    vertical,
    query,
    researchMode: sp.get("research") !== "0",
    limit: Number(sp.get("limit") ?? 12),
    includeDomains: parseList(sp.get("include")),
    excludeDomains: parseList(sp.get("exclude")),
    engine: (sp.get("engine") === "bing" ? "bing" : "google"),
    gl: sp.get("gl") ?? "kr",
    hl: sp.get("hl") ?? "ko",
    weights: parseWeights(sp),
  };
  const fanoutQueries = expandVerticalQueries(vertical, query, params.researchMode);
  const allowFixture = sp.get("fixture") === "1" || process.env.DEMO_MODE === "fixture";

  try {
    if (allowFixture) {
      const analyzed = analyzeResults(fixtureFor(vertical, query), params);
      return NextResponse.json({ mode: "fixture", params, fanoutQueries, explanation: buildExplanation(), queryErrors: [], ...analyzed });
    }

    const settled = await Promise.allSettled(fanoutQueries.map((q) => fetchBrightDataSerp(q, params)));
    const ok = settled.filter((x): x is PromiseFulfilledResult<any> => x.status === "fulfilled").flatMap((x) => x.value);
    const queryErrors = settled.filter((x): x is PromiseRejectedResult => x.status === "rejected").map((x) => String(x.reason?.message ?? x.reason));
    if (!ok.length) throw new Error(queryErrors.join("\n") || "SERP 결과 없음");
    const analyzed = analyzeResults(ok, params);
    return NextResponse.json({ mode: "live", params, fanoutQueries, explanation: buildExplanation(), queryErrors, ...analyzed });
  } catch (error) {
    if (!allowFixture) return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error", fanoutQueries }, { status: 500 });
    const analyzed = analyzeResults(fixtureFor(vertical, query), params);
    return NextResponse.json({ mode: "fixture", params, fanoutQueries, explanation: buildExplanation(), queryErrors: [], ...analyzed });
  }
}
