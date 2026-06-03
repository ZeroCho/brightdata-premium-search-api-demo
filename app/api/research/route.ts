import { NextRequest, NextResponse } from "next/server";
import { analyzeResults, buildExplanation, expandVerticalQueries, fetchBrightDataSerp, fixtureFor, type ResearchParams, type Vertical } from "@/lib/researchPipeline";

export const runtime = "nodejs";

function parseList(value: string | null) {
  return (value ?? "").split(",").map((x) => x.trim()).filter(Boolean);
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
  };
  const fanoutQueries = expandVerticalQueries(vertical, query, params.researchMode);
  const allowFixture = sp.get("fixture") === "1" || process.env.DEMO_MODE === "fixture";

  try {
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
