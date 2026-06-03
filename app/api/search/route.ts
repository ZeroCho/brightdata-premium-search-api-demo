import { NextRequest, NextResponse } from "next/server";
import { expandQueries, fixtureItems, parseBrightDataResponse, rankResults, type SearchResponse, type SerpItem } from "@/lib/searchPipeline";

export const runtime = "nodejs";

function getBrightDataConfig() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY ?? process.env.BRIGHTDATA_API_KEY ?? process.env.BD_API_KEY;
  const zone = process.env.BRIGHT_DATA_SERP_ZONE ?? process.env.BRIGHTDATA_SERP_ZONE ?? process.env.BD_ZONE ?? "serp_api1";
  return { apiKey, zone };
}

async function fetchBrightDataSerp(query: string): Promise<SerpItem[]> {
  const { apiKey, zone } = getBrightDataConfig();
  if (!apiKey) {
    throw new Error("Bright Data API key is missing. Set BRIGHT_DATA_API_KEY, BRIGHTDATA_API_KEY, or BD_API_KEY in .env.local or Vercel Environment Variables.");
  }

  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("brd_json", "1");
  url.searchParams.set("hl", "ko");
  url.searchParams.set("gl", "kr");

  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone,
      url: url.toString(),
      format: "json",
      data_format: "parsed_light",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data SERP API failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return parseBrightDataResponse(data, query);
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "프리미엄 검색 API Bright Data";
  const expandedQueries = expandQueries(query);
  const allowFixture = process.env.DEMO_MODE === "fixture" || req.nextUrl.searchParams.get("fixture") === "1";

  try {
    const batches = await Promise.all(expandedQueries.map(fetchBrightDataSerp));
    const ranked = rankResults(batches.flat(), query);
    const response: SearchResponse = {
      mode: "live",
      query,
      expandedQueries,
      resultCount: ranked.length,
      uniqueDomains: new Set(ranked.map((r) => r.domain)).size,
      results: ranked,
    };
    return NextResponse.json(response);
  } catch (error) {
    if (!allowFixture) {
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Unknown Bright Data error",
        hint: "Production must set BRIGHT_DATA_API_KEY/BRIGHTDATA_API_KEY/BD_API_KEY and BRIGHT_DATA_SERP_ZONE/BRIGHTDATA_SERP_ZONE/BD_ZONE. Add ?fixture=1 only for offline screenshots, not for the submitted live demo.",
      }, { status: 500 });
    }

    const withQueries = fixtureItems.map((item, idx) => ({ ...item, sourceQuery: expandedQueries[idx % expandedQueries.length] }));
    const ranked = rankResults(withQueries, query);
    const response: SearchResponse = {
      mode: "fixture",
      query,
      expandedQueries,
      resultCount: ranked.length,
      uniqueDomains: new Set(ranked.map((r) => r.domain)).size,
      results: ranked,
      note: "Fixture mode is for local screenshots only. The live Vercel deployment must run with Bright Data credentials.",
    };
    return NextResponse.json(response);
  }
}
