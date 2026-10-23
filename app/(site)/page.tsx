import { predictionsForDay } from "@/lib/queries";
import { siteSettings } from "@/lib/settings";
import { tipsFor } from "@/lib/tips";
import { todayIso, validDate } from "@/components/site/blocks";
import { TipsPage } from "@/components/site/TipsPage";

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const date = validDate((await searchParams).date) ?? todayIso();
  const [site, rows] = await Promise.all([siteSettings(), predictionsForDay(date)]);
  return (
    <TipsPage
      title="Free Football Predictions & Tips"
      intro={`${site.siteName} gives you free, data-driven football tips, banker picks, goals and BTTS predictions and graded results for the world's top competitions.`}
      boardTitle="Football Predictions"
      category="free"
      rows={tipsFor("free", rows)}
      date={date}
      base="/"
      tabDate={date === todayIso() ? undefined : date}
      copy="home"
      empty={rows.length ? "No match passes the free-tip threshold on this date. Try All Predictions." : undefined}
    />
  );
}
