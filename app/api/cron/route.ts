import { NextResponse, type NextRequest } from "next/server";
import { runDailyPipeline } from "@/lib/services/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily pipeline. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`;
 * external schedulers can use `?secret=$CRON_SECRET` instead.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
  if (!secret || given !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const res = await runDailyPipeline();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
