import { NextRequest, NextResponse } from "next/server";
import { brandMonitor } from "@/lib/demoSearch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "ZeroChoTV AI coding tools";
    const action = req.nextUrl.searchParams.get("action") || "compare";
    return NextResponse.json(await brandMonitor(q, action));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
