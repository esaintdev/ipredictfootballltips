import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { predictionsForDay, predictionsForDays } from "@/lib/queries";
import { categoryBySlug, comboOdds, fairOdds, tipsFor, type Category, type TipRow } from "@/lib/tips";
import { addDays, longDate, todayIso, validDate } from "@/components/site/blocks";
import { TipsPage } from "@/components/site/TipsPage";
import { WEEKDAYS } from "@/components/site/nav";
import { LocalTime, TeamLogo, pct } from "@/components/ui";
import { Icon } from "@/components/site/icons";

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
      boardTitle={d.title.replace("Football ", "")}
      boardSub={label}
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
      boardSub={longDate(date)}
      category={c.id}
      rows={tips}
      date={date}
      base={`/${c.slug}`}
      tabDate={isToday ? undefined : date}
      copy={c.id}
      before={banker && <BankerCard r={banker} />}
      footer={c.id === "two-odds" && tips.length ? (
        <>
          <span className="inline-flex items-center gap-3 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="layers" size={18} className="text-brand-solid" />{tips.length}-fold accumulator
            <span className="font-display text-2xl leading-none font-bold text-brand-solid">{comboOdds(tips).toFixed(2)}</span>
          </span>
          <Link href="/all-predictions" className="s-btn s-btn-outline sm:ml-auto">View all matches<Icon name="chevronRight" size={16} /></Link>
        </>
      ) : undefined}
    />
  );
}

/** Feature card for the day's banker, styled like a match-day poster. */
function BankerCard({ r }: { r: TipRow }) {
  const { m, tip } = r;
  return (
    <Link href={`/match/${m.id}`} className="group relative mt-6 block overflow-hidden rounded-3xl bg-navy text-white shadow-xl shadow-navy/20">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_120%_at_50%_0%,rgba(247,201,72,0.22),transparent_60%)]" />
      <div className="relative p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] text-[#060b16] uppercase"><Icon name="target" size={14} />Banker of the day</span>
          <span className="flex items-center gap-1.5 text-xs text-white/60"><TeamLogo src={m.comp_logo} name={m.comp_name} size={16} />{m.comp_name}</span>
        </div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <BankerTeam name={m.home_name} logo={m.home_logo} />
          <div>
            <div className="font-display text-4xl leading-none font-bold sm:text-5xl"><LocalTime iso={m.kickoff} /></div>
            <div className="mt-1 text-xs text-white/60"><LocalTime iso={m.kickoff} mode="date" /></div>
          </div>
          <BankerTeam name={m.away_name} logo={m.away_logo} />
        </div>
        <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
          <BankerStat label="Tip" value={tip.code} sub={tip.label} />
          <BankerStat label="Fair odds" value={fairOdds(tip.p).toFixed(2)} />
          <BankerStat label="Confidence" value={pct(tip.p)} />
        </div>
      </div>
    </Link>
  );
}

function BankerTeam({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-2.5">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-2.5 shadow-lg sm:h-20 sm:w-20"><TeamLogo src={logo} name={name} size={52} /></span>
      <span className="w-full truncate font-display text-lg font-bold tracking-wide uppercase sm:text-2xl">{name}</span>
    </span>
  );
}

function BankerStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-2 py-3 text-center">
      <div className="text-[10px] font-bold tracking-[0.14em] text-white/50 uppercase">{label}</div>
      <div className="mt-1 font-display text-2xl leading-none font-bold text-brand-solid sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 truncate text-[11px] text-white/50">{sub}</div>}
    </div>
  );
}
