import Link from "next/link";
import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import { CATEGORIES, categoryHref, fairOdds, tipResult, type CategoryId, type TipRow } from "@/lib/tips";
import { LocalTime, TeamLogo } from "@/components/ui";
import { DatePicker, LoadMore, Scroller } from "./client";

// ---------- dates (UTC days, matching the rest of the site) ----------

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const todayIso = () => isoDay(new Date());
export const addDays = (iso: string, n: number) => isoDay(new Date(new Date(iso).getTime() + n * 86_400_000));
export const validDate = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) ? s : undefined);
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
export const longDate = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// ---------- hero & navigation strips ----------

export function PageHero({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e5f6ef] via-[#eef2f7] to-[#dfe6ef] px-6 py-8 sm:px-10 sm:py-12 dark:from-[#0f2a22] dark:via-[#0d1526] dark:to-[#121d33]">
      <svg aria-hidden className="pointer-events-none absolute -right-8 -top-10 hidden h-72 w-[28rem] opacity-60 sm:block" viewBox="0 0 440 280" fill="none">
        <path d="M120 20l70 40v80l-70 40-70-40V60z" stroke="#12d18e" strokeOpacity=".35" strokeWidth="4" />
        <path d="M300 10l80 46v92l-80 46-80-46V56z" stroke="#0a1120" strokeOpacity=".12" strokeWidth="4" />
        <path d="M230 170l70 40v80l-70 40-70-40v-80z" stroke="#f7c948" strokeOpacity=".5" strokeWidth="4" />
      </svg>
      <h1 className="relative text-3xl font-black tracking-tight text-fg sm:text-5xl">{title}</h1>
      <p className="relative mt-3 max-w-2xl text-base text-subtle sm:text-lg">{intro}</p>
      {children && <div className="relative mt-5">{children}</div>}
    </section>
  );
}

const QUICK = [
  { href: "/predictions-for-today", label: "Today", icon: "⚽" },
  { href: "/predictions-for-tomorrow", label: "Tomorrow", icon: "📅" },
  { href: "/predictions-for-the-weekend", label: "Weekend", icon: "🗓️" },
  { href: "/results", label: "Results", icon: "✅" },
];

/** The row of big tabs under the hero (the reference site's sport switcher; we are football-only). */
export function QuickTabs({ active }: { active?: string }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
      {QUICK.map((q) => (
        <Link key={q.href} href={q.href}
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-semibold transition sm:flex-row sm:gap-2 sm:py-4 sm:text-base ${q.href === active ? "bg-gold text-[#060b16] shadow-sm" : "bg-gold-soft text-fg hover:brightness-95"}`}>
          <span aria-hidden>{q.icon}</span>{q.label}
        </Link>
      ))}
    </div>
  );
}

export function TopLeagues({ comps }: { comps: { slug: string; name: string; logo: string | null }[] }) {
  if (!comps.length) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold text-fg">Top Leagues</h2>
      <Scroller className="pb-1">
        {comps.map((c) => (
          <Link key={c.slug} href={`/leagues/${c.slug}`} className="flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-fg hover:bg-surface">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-1.5 shadow-sm"><TeamLogo src={c.logo} name={c.name} size={24} /></span>
            {c.name}
          </Link>
        ))}
      </Scroller>
    </section>
  );
}

// ---------- predictions board ----------

export function DatePills({ date, base }: { date: string; base: string }) {
  const today = todayIso();
  const days = [-1, 0, 1, 2].map((n) => addDays(today, n));
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="flex items-center gap-2">
      {days.map((d) => (
        <Link key={d} href={d === today ? base : `${base}${sep}date=${d}`} aria-current={d === date ? "date" : undefined}
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center leading-tight transition ${d === date ? "bg-brand-solid text-[#060b16] shadow-sm" : "bg-surface-2 text-subtle hover:text-fg"}`}>
          <span className="text-[10px] font-semibold uppercase">{fmt(d, { month: "short" })}</span>
          <span className="text-base font-extrabold">{fmt(d, { day: "numeric" })}</span>
        </Link>
      ))}
      <DatePicker value={date} base={`${base}${sep}`} />
    </div>
  );
}

export function CategoryTabs({ active, date, only }: { active: CategoryId; date?: string; only?: CategoryId[] }) {
  const cats = only ? CATEGORIES.filter((c) => only.includes(c.id)) : CATEGORIES;
  return (
    <Scroller className="-mx-1 px-1 pb-1">
      {cats.map((c) => (
        <Link key={c.id} href={categoryHref(c, date)} data-active={c.id === active} className={`s-pill ${c.id === active ? "s-pill-active" : ""}`}>{c.label}</Link>
      ))}
    </Scroller>
  );
}

/** The white card holding a predictions table, as on every tips page. */
export function Board({ title, controls, tabs, children, footer }: { title: ReactNode; controls?: ReactNode; tabs?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="s-card mt-6 px-3 py-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{title}</h2>
        {controls}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
      <div className="mt-3">{children}</div>
      {footer && <div className="mt-5 flex flex-wrap items-center gap-3">{footer}</div>}
    </section>
  );
}

const compLabel = (m: MatchRow) => (m.comp_country && !["World", "Europe"].includes(m.comp_country) ? `${m.comp_country}: ${m.comp_name}` : m.comp_name);

export function ConfidenceBadge({ p }: { p: number }) {
  const v = Math.round(p * 100);
  const tone = v >= 70 ? "bg-accent-soft text-accent" : v >= 55 ? "bg-gold-soft text-[#8a6500] dark:text-gold" : "bg-surface-2 text-subtle";
  return <span className={`inline-flex min-w-12 justify-center rounded-lg px-2 py-1 text-xs font-bold ${tone}`}>{v}%</span>;
}

export function ResultBadge({ won }: { won: boolean | null }) {
  if (won == null) return null;
  return won
    ? <span className="inline-flex rounded-lg bg-accent-soft px-2 py-1 text-xs font-extrabold text-accent">WON</span>
    : <span className="inline-flex rounded-lg bg-loss/15 px-2 py-1 text-xs font-extrabold text-loss">LOST</span>;
}

/**
 * Time | League | Home VS Away | Tip | Odds | Confidence.
 * Finished matches show the score and WON/LOST instead of the kick-off time and confidence.
 * Odds are fair odds (1 / model probability), with no bookmaker margin.
 */
export function TipsTable({ rows, empty = "No predictions available for this date yet.", pageSize = 25 }: { rows: TipRow[]; empty?: ReactNode; pageSize?: number }) {
  const allDone = rows.length > 0 && rows.every((r) => tipResult(r) != null);
  if (!rows.length) return <p className="border-t border-edge py-10 text-center text-sm text-subtle">{empty}</p>;
  return (
    <div className="text-sm">
      <div className="hidden grid-cols-[4rem_minmax(0,12rem)_minmax(0,1fr)_6rem_4rem_5.5rem] gap-3 border-b border-edge px-3 pb-2 text-xs font-semibold text-subtle md:grid">
        <span>Time</span><span>League</span><span className="text-center">Match</span><span className="text-center">Tip</span>
        <span className="text-center" title="Fair odds = 1 / model probability (no bookmaker margin)">Odds</span><span className="text-center">{allDone ? "Result" : "Confidence"}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_2.5rem_3.25rem] gap-1.5 border-b border-edge px-2 pb-2 text-xs font-semibold text-subtle md:hidden">
        <span>Match</span><span className="text-center">Tip</span><span className="text-center">Odds</span><span className="text-center">{allDone ? "Result" : "Prob."}</span>
      </div>
      <LoadMore step={pageSize}>
        {rows.map((r, i) => <TipLine key={`${r.m.id}-${r.tip.code}`} r={r} zebra={i % 2 === 1} />)}
      </LoadMore>
    </div>
  );
}

function TipLine({ r, zebra }: { r: TipRow; zebra: boolean }) {
  const { m, tip } = r;
  const won = tipResult(r);
  const done = won != null;
  const score = done ? `${m.home_goals} - ${m.away_goals}` : null;
  const outcome = done ? <ResultBadge won={won} /> : <ConfidenceBadge p={tip.p} />;
  return (
    <Link href={`/match/${m.id}`} className={`block border-b border-edge/70 transition hover:bg-accent-soft/40 ${zebra ? "bg-surface-2" : ""}`}>
      {/* desktop */}
      <div className="hidden grid-cols-[4rem_minmax(0,12rem)_minmax(0,1fr)_6rem_4rem_5.5rem] items-center gap-3 px-3 py-3.5 md:grid">
        <span className="text-subtle"><LocalTime iso={m.kickoff} /></span>
        <span className="flex min-w-0 items-center gap-1.5 text-subtle"><TeamLogo src={m.comp_logo} name={m.comp_name} size={16} /><span className="truncate">{compLabel(m)}</span></span>
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2">
          <span className="flex min-w-0 items-center justify-end gap-2 font-bold text-fg"><span className="truncate">{m.home_name}</span><TeamLogo src={m.home_logo} name={m.home_name} size={20} /></span>
          <span className={`text-center text-xs font-semibold ${score ? "rounded-md bg-navy py-1 text-white" : "text-subtle"}`}>{score ?? "VS"}</span>
          <span className="flex min-w-0 items-center gap-2 font-bold text-fg"><TeamLogo src={m.away_logo} name={m.away_name} size={20} /><span className="truncate">{m.away_name}</span></span>
        </span>
        <span className="text-center font-bold text-fg">{tip.code}</span>
        <span className="text-center font-bold text-accent">{fairOdds(tip.p).toFixed(2)}</span>
        <span className="text-center">{outcome}</span>
      </div>
      {/* mobile */}
      <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_2.5rem_3.25rem] items-center gap-1.5 px-2 py-3 md:hidden">
        <span className="min-w-0">
          <span className="block truncate text-xs text-subtle"><LocalTime iso={m.kickoff} />  {compLabel(m)}</span>
          <span className="mt-1.5 flex items-center gap-2 font-semibold text-fg"><TeamLogo src={m.home_logo} name={m.home_name} size={16} /><span className="truncate">{m.home_name}</span>{score && <b className="ml-auto">{m.home_goals}</b>}</span>
          <span className="mt-1 flex items-center gap-2 font-semibold text-fg"><TeamLogo src={m.away_logo} name={m.away_name} size={16} /><span className="truncate">{m.away_name}</span>{score && <b className="ml-auto">{m.away_goals}</b>}</span>
        </span>
        <span className="text-center text-xs font-bold text-fg">{tip.code}</span>
        <span className="text-center text-xs font-bold text-accent">{fairOdds(tip.p).toFixed(2)}</span>
        <span className="text-center">{outcome}</span>
      </div>
    </Link>
  );
}
