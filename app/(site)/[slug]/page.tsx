import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { predictionsForDay, predictionsForDays } from "@/lib/queries";
import { categoryBySlug, comboOdds, fairOdds, tipsFor, type Category } from "@/lib/tips";
import { addDays, longDate, todayIso, validDate } from "@/components/site/blocks";
import { ConfidenceBadge } from "@/components/site/blocks";
import { TipsPage } from "@/components/site/TipsPage";
import { WEEKDAYS } from "@/components/site/nav";
import { LocalTime, TeamLogo } from "@/components/ui";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }> };

/** Day pages: today, tomorrow, the weekend and each weekday (its next occurrence, today included). */
function dayPage(slug: string): { title: string; from: string; to: string } | null {
  const today = todayIso();
  if (slug === "predictions-for-today") return { title: "Football Predictions for Today", from: today, to: today };
  if (slug === "predictions-for-tomorrow") return { title: "Football Predictions for Tomorrow", from: addDays(today, 1), to: addDays(today, 1) };
  const dow = new Date(today).getUTCDay(); // 0 = Sunday
  if (slug === "predictions-for-the-weekend") {
    const sat = dow === 0 ? addDays(today, -1) : addDays(today, 6 - dow);
    return { title: "Football Predictions for the Weekend", from: dow === 0 ? today : sat, to: addDays(sat, 1) };
  }
  const i = WEEKDAYS.findIndex((d) => `${d}-predictions` === slug);
  if (i < 0) return null;
  const target = (i + 1) % 7; // WEEKDAYS starts on Monday
  const day = addDays(today, (target - dow + 7) % 7);
  return { title: `${WEEKDAYS[i][0].toUpperCase()}${WEEKDAYS[i].slice(1)} Football Predictions`, from: day, to: day };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (c) return { title: c.title, description: c.intro };
  const d = dayPage(slug);
  return d ? { title: d.title, description: `Free AI football predictions for ${longDate(d.from)}: best tip, fair odds and confidence for every match.` } : {};
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (c) return <CategoryPage c={c} date={validDate((await searchParams).date)} />;
  const d = dayPage(slug);
  if (!d) notFound();
  const rows = tipsFor("all", await predictionsForDays(d.from, d.to));
  const label = d.from === d.to ? longDate(d.from) : `${longDate(d.from)} – ${longDate(d.to)}`;
  return (
    <TipsPage
      title={d.title}
      intro={`Every match we cover on ${label}, with the model's best tip, fair odds and confidence.`}
      boardTitle={<>{d.title.replace("Football ", "")}<span className="mt-1 block text-sm font-medium text-subtle">{label}</span></>}
      category="all"
      rows={rows}
      base={`/${slug}`}
      tabDate={d.from === d.to ? d.from : undefined}
      quickActive={`/${slug}`}
      copy="day"
    />
  );
}

async function CategoryPage({ c, date: picked }: { c: Category; date?: string }) {
  const date = picked ?? todayIso();
  const tips = tipsFor(c.id, await predictionsForDay(date));
  const isToday = date === todayIso();
  const banker = c.id === "banker" ? tips[0] : undefined;
  return (
    <TipsPage
      title={c.title}
      intro={c.intro}
      boardTitle={c.title}
      category={c.id}
      rows={tips}
      date={date}
      base={`/${c.slug}`}
      tabDate={isToday ? undefined : date}
      copy={c.id}
      before={banker && (
        <Link href={`/match/${banker.m.id}`} className="mt-6 block overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-lg transition hover:brightness-110 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#060b16]">Banker of the day</span>
            <span className="text-sm text-white/70"><LocalTime iso={banker.m.kickoff} mode="datetime" /></span>
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <span className="flex flex-col items-center gap-2"><TeamLogo src={banker.m.home_logo} name={banker.m.home_name} size={52} /><b className="text-sm sm:text-lg">{banker.m.home_name}</b></span>
            <span className="text-sm font-bold text-white/60">VS</span>
            <span className="flex flex-col items-center gap-2"><TeamLogo src={banker.m.away_logo} name={banker.m.away_name} size={52} /><b className="text-sm sm:text-lg">{banker.m.away_name}</b></span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="rounded-xl bg-white/10 px-4 py-2">Tip <b className="ml-1 text-brand-solid">{banker.tip.label}</b></span>
            <span className="rounded-xl bg-white/10 px-4 py-2">Fair odds <b className="ml-1">{fairOdds(banker.tip.p).toFixed(2)}</b></span>
            <ConfidenceBadge p={banker.tip.p} />
          </div>
          <div className="mt-3 text-center text-xs text-white/60">{banker.m.comp_name}</div>
        </Link>
      )}
      footer={c.id === "two-odds" && tips.length ? (
        <>
          <span className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white">{tips.length}-fold · combined fair odds <span className="text-brand-solid">{comboOdds(tips).toFixed(2)}</span></span>
          <Link href="/all-predictions" className="s-btn s-btn-outline sm:ml-auto">View all matches ›</Link>
        </>
      ) : undefined}
    />
  );
}
