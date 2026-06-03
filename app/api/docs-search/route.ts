import { NextRequest, NextResponse } from "next/server";
import { docsSearch } from "@/lib/demoSearch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "Next.js App Router에서 Stripe 웹훅 처리할 때 주의할 점 알려줘";
    return NextResponse.json(await docsSearch(q));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
