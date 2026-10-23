import { redirect } from "next/navigation";

// Old URL: /predictions?market=1x2|ou|cs|btts&date=... now lives on the category pages.
const TARGET: Record<string, string> = { ou: "over-2-5-goals-predictions", cs: "correct-score-predictions", btts: "btts-gg-predictions" };

export default async function PredictionsRedirect({ searchParams }: { searchParams: Promise<{ market?: string; date?: string }> }) {
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? `?date=${sp.date}` : "";
  redirect(`/${TARGET[sp.market ?? ""] ?? "all-predictions"}${date}`);
}
