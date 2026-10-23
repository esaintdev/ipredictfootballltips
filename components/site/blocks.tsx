import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORIES, categoryHref, fairOdds, tipResult, type CategoryId, type TipRow } from "@/lib/tips";
import { LocalTime, TeamLogo } from "@/components/ui";
import { DatePicker, LoadMore, Scroller } from "./client";
import { Icon, type IconName } from "./icons";

// ---------- dates (UTC days, matching the rest of the site) ----------

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const todayIso = () => isoDay(new Date());
export const addDays = (iso: string, n: number) => isoDay(new Date(new Date(iso).getTime() + n * 86_400_000));
export const validDate = (s: string | undefined) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) ? s : undefined);
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
export const longDate = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// ---------- hero & navigation strips ----------

export interface HeroStat { label: string; value: string; icon: IconName }

/** Navy hero with pitch markings, like a match-day banner. */
export function PageHero({ title, intro, eyebrow = "AI football predictions", stats, children }: { title: string; intro: string; eyebrow?: string; stats?: HeroStat[]; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-navy text-white shadow-xl shadow-navy/20">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_90%_at_100%_0%,rgba(18,209,142,0.28),transparent_60%),radial-gradient(40%_70%_at_0%_100%,rgba(247,201,72,0.12),transparent_60%)]" />
      <svg aria-hidden viewBox="0 0 520 300" fill="none" stroke="#fff" strokeOpacity=".09" strokeWidth="2"
        className="pointer-events-none absolute -right-24 top-1/2 h-[135%] -translate-y-1/2 sm:-right-10">
        <rect x="10" y="10" width="500" height="280" rx="4" />
        <path d="M260 10v280" />
        <circle cx="260" cy="150" r="52" />
        <circle cx="260" cy="150" r="3" fill="#fff" fillOpacity=".15" />
        <path d="M510 70h-80v160h80M510 112h-30v76h30M430 118a40 40 0 0 0 0 64" />
        <path d="M10 70h80v160H10M10 112h30v76H10M90 118a40 40 0 0 1 0 64" />
      </svg>
      <div className="relative px-6 py-8 sm:px-10 sm:py-11">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-brand-solid uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-solid" />{eyebrow}
        </span>
        <h1 className="mt-4 max-w-4xl font-display text-balance text-[2.6rem] leading-[0.95] font-extrabold tracking-wide uppercase sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-lg">{intro}</p>
        {stats && stats.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
            {stats.map((st) => (
              <div key={st.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur sm:px-3.5">
                <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-brand-solid/15 text-brand-solid sm:flex"><Icon name={st.icon} size={18} /></span>
                <span>
                  <span className="block font-display text-2xl leading-none font-bold">{st.value}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight font-medium tracking-wide text-white/60 uppercase sm:text-[11px]">{st.label}</span>
                </span>
              </div>
            ))}
          </div>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

const QUICK: { href: string; label: string; sub: string; icon: IconName }[] = [
  { href: "/predictions-for-today", label: "Today", sub: "All matches", icon: "ball" },
  { href: "/predictions-for-tomorrow", label: "Tomorrow", sub: "Early tips", icon: "calendarNext" },
  { href: "/predictions-for-the-weekend", label: "Weekend", sub: "Sat & Sun", icon: "weekend" },
  { href: "/results", label: "Results", sub: "Won & lost", icon: "check" },
];

/** The row of big tabs under the hero (the reference site's sport switcher; we are football-only). */
export function QuickTabs({ active }: { active?: string }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
      {QUICK.map((q) => {
        const on = q.href === active;
        return (
          <Link key={q.href} href={q.href}
            className={`group flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left ${on ? "border-brand-solid bg-brand-solid text-[#060b16] shadow-md shadow-brand-solid/25" : "border-edge bg-surface text-fg hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${on ? "bg-[#060b16]/10" : "bg-accent-soft text-accent"}`}><Icon name={q.icon} size={20} /></span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] leading-none font-bold tracking-wide uppercase sm:text-xl">{q.label}</span>
              <span className={`hidden text-xs sm:block ${on ? "text-[#060b16]/70" : "text-subtle"}`}>{q.sub}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function TopLeagues({ comps }: { comps: { slug: string; name: string; logo: string | null }[] }) {
  if (!comps.length) return null;
  return (
    <section className="mt-6 flex items-center gap-3">
      <h2 className="hidden shrink-0 font-display text-lg font-bold tracking-wide text-fg uppercase sm:block">Top Leagues</h2>
      <Scroller className="min-w-0 flex-1 py-1">
        {comps.map((c) => (
          <Link key={c.slug} href={`/leagues/${c.slug}`} className="flex shrink-0 items-center gap-2 rounded-full border border-edge bg-surface py-1 pr-4 pl-1 text-sm font-semibold text-fg transition hover:border-accent/50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1 ring-1 ring-edge"><TeamLogo src={c.logo} name={c.name} size={22} /></span>
            {c.name}
          </Link>
        ))}
      </Scroller>
      <Link href="/leagues" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline sm:flex">All<Icon name="chevronRight" size={16} /></Link>
    </section>
  );
}

// ---------- predictions board ----------

export function DatePills({ date, base }: { date: string; base: string }) {
  const today = todayIso();
  const days = [-1, 0, 1, 2].map((n) => addDays(today, n));
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {days.map((d) => <DayPill key={d} d={d} on={d === date} today={today} href={d === today ? base : `${base}${sep}date=${d}`} />)}
      <DatePicker value={date} base={`${base}${sep}`} />
    </div>
  );
}

export function DayPill({ d, on, today, href }: { d: string; on: boolean; today: string; href: string }) {
  return (
    <Link href={href} aria-current={on ? "date" : undefined} data-active={on}
      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-center leading-none transition ${on ? "border-brand-solid bg-brand-solid text-[#060b16] shadow-md shadow-brand-solid/25" : "border-edge bg-surface text-subtle hover:border-accent/50 hover:text-fg"}`}>
      <span className="text-[10px] font-bold tracking-wider uppercase">{d === today ? "Today" : fmt(d, { weekday: "short" })}</span>
      <span className="mt-1 font-display text-2xl font-bold">{fmt(d, { day: "numeric" })}</span>
      <span className="text-[9px] font-semibold uppercase opacity-70">{fmt(d, { month: "short" })}</span>
    </Link>
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

/** The card holding a predictions table, as on every tips page. */
export function Board({ title, sub, controls, tabs, children, footer }: { title: ReactNode; sub?: ReactNode; controls?: ReactNode; tabs?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="s-card mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
        <div>
          <h2 className="s-h2">{title}</h2>
          {sub && <div className="mt-1.5 text-sm text-subtle">{sub}</div>}
        </div>
        {controls}
      </div>
      {tabs && <div className="mt-5 border-b border-edge px-4 pb-4 sm:px-6">{tabs}</div>}
      <div className={tabs ? "" : "mt-4 border-t border-edge"}>{children}</div>
      {footer && <div className="flex flex-wrap items-center gap-3 border-t border-edge bg-surface-2/60 px-4 py-4 sm:px-6">{footer}</div>}
    </section>
  );
}

export function ConfidenceBadge({ p }: { p: number }) {
  const v = Math.round(p * 100);
  const tone = v >= 70 ? "bg-accent-soft text-accent" : v >= 55 ? "bg-gold-soft text-[#8a6500] dark:text-gold" : "bg-surface-2 text-subtle";
  return <span className={`inline-flex min-w-12 justify-center rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${tone}`}>{v}%</span>;
}

/** Percentage with a small bar, coloured by confidence tier. */
export function ConfidenceMeter({ p }: { p: number }) {
  const v = Math.round(p * 100);
  const bar = v >= 70 ? "bg-brand-solid" : v >= 55 ? "bg-gold" : "bg-subtle/50";
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className="text-[13px] font-bold text-fg tabular-nums">{v}%</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-edge"><span className={`block h-full rounded-full ${bar}`} style={{ width: `${v}%` }} /></span>
    </span>
  );
}

export function ResultBadge({ won }: { won: boolean | null }) {
  if (won == null) return null;
  return won
    ? <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-extrabold tracking-wide text-accent"><Icon name="check" size={13} />WON</span>
    : <span className="inline-flex items-center gap-1 rounded-lg bg-loss/12 px-2 py-1 text-[11px] font-extrabold tracking-wide text-loss"><Icon name="xCircle" size={13} />LOST</span>;
}

function TipChip({ code, won }: { code: string; won: boolean | null }) {
  const tone = won == null ? "border-navy/15 bg-navy/[0.04] text-fg dark:border-white/15 dark:bg-white/5" : won ? "border-accent/40 bg-accent-soft text-accent" : "border-loss/30 bg-loss/10 text-loss";
  return <span className={`inline-flex min-w-11 justify-center rounded-md border px-2 py-1 text-xs font-extrabold whitespace-nowrap ${tone}`}>{code}</span>;
}

const COLS = "md:grid-cols-[4.5rem_minmax(0,11rem)_minmax(0,1fr)_6rem_4rem_5rem]";
const MCOLS = "grid-cols-[minmax(0,1fr)_4.6rem_2.6rem_3.4rem]";

/**
 * Time | League | Home VS Away | Tip | Odds | Confidence.
 * Finished matches show the score and WON/LOST instead of the kick-off time and confidence.
 * Odds are fair odds (1 / model probability), with no bookmaker margin.
 */
export function TipsTable({ rows, empty = "No predictions available for this date yet.", pageSize = 25 }: { rows: TipRow[]; empty?: ReactNode; pageSize?: number }) {
  const allDone = rows.length > 0 && rows.every((r) => tipResult(r) != null);
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-subtle"><Icon name="ball" size={28} /></span>
        <p className="max-w-sm text-sm text-subtle">{empty}</p>
      </div>
    );
  }
  const head = "bg-surface-2 text-[11px] font-bold tracking-wider text-subtle uppercase";
  return (
    <div className="text-sm">
      <div className={`hidden gap-3 px-6 py-2.5 md:grid ${COLS} ${head}`}>
        <span>Time</span><span>League</span><span className="text-center">Match</span><span className="text-center">Tip</span>
        <span className="text-center" title="Fair odds = 1 / model probability (no bookmaker margin)">Odds</span><span className="text-center">{allDone ? "Result" : "Confidence"}</span>
      </div>
      <div className={`grid gap-1.5 px-3 py-2.5 md:hidden ${MCOLS} ${head}`}>
        <span>Match</span><span className="text-center">Tip</span><span className="text-center">Odds</span><span className="text-center">{allDone ? "Result" : "Prob."}</span>
      </div>
      <div className="divide-y divide-edge/80">
        <LoadMore step={pageSize}>
          {rows.map((r) => <TipLine key={`${r.m.id}-${r.tip.code}`} r={r} />)}
        </LoadMore>
      </div>
    </div>
  );
}

function TipLine({ r }: { r: TipRow }) {
  const { m, tip } = r;
  const won = tipResult(r);
  const done = won != null;
  const outcome = done ? <ResultBadge won={won} /> : <ConfidenceMeter p={tip.p} />;
  const accent = won == null ? "before:bg-transparent" : won ? "before:bg-brand-solid" : "before:bg-loss";
  return (
    <Link href={`/match/${m.id}`} className={`group relative block transition before:absolute before:inset-y-0 before:left-0 before:w-[3px] hover:bg-accent-soft/40 ${accent}`}>
      {/* desktop */}
      <div className={`hidden items-center gap-3 px-6 py-3 md:grid ${COLS}`}>
        <span className="font-display text-lg font-bold text-fg tabular-nums">{done ? <span className="text-xs font-sans font-bold tracking-wide text-subtle">FT</span> : <LocalTime iso={m.kickoff} />}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-edge"><TeamLogo src={m.comp_logo} name={m.comp_name} size={18} /></span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-fg">{m.comp_name}</span>
            <span className="block truncate text-[11px] text-subtle">{m.comp_country}</span>
          </span>
        </span>
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] items-center gap-2.5">
          <span className="flex min-w-0 items-center justify-end gap-2 font-semibold text-fg"><span className="truncate">{m.home_name}</span><TeamLogo src={m.home_logo} name={m.home_name} size={24} /></span>
          {done
            ? <span className="rounded-md bg-navy py-1 text-center font-display text-base leading-none font-bold text-white tabular-nums">{m.home_goals}-{m.away_goals}</span>
            : <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[10px] font-extrabold text-subtle">VS</span>}
          <span className="flex min-w-0 items-center gap-2 font-semibold text-fg"><TeamLogo src={m.away_logo} name={m.away_name} size={24} /><span className="truncate">{m.away_name}</span></span>
        </span>
        <span className="text-center"><TipChip code={tip.code} won={won} /></span>
        <span className="text-center font-display text-lg font-bold text-accent tabular-nums">{fairOdds(tip.p).toFixed(2)}</span>
        <span className="text-center">{outcome}</span>
      </div>
      {/* mobile */}
      <div className={`grid items-center gap-1.5 px-3 py-3 md:hidden ${MCOLS}`}>
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-subtle">
            <b className="font-bold text-fg">{done ? "FT" : <LocalTime iso={m.kickoff} />}</b>
            <TeamLogo src={m.comp_logo} name={m.comp_name} size={12} /><span className="truncate">{m.comp_name}</span>
          </span>
          <span className="mt-1.5 flex items-center gap-2 font-semibold text-fg"><TeamLogo src={m.home_logo} name={m.home_name} size={18} /><span className="truncate">{m.home_name}</span>{done && <b className="ml-auto font-display text-base">{m.home_goals}</b>}</span>
          <span className="mt-1 flex items-center gap-2 font-semibold text-fg"><TeamLogo src={m.away_logo} name={m.away_name} size={18} /><span className="truncate">{m.away_name}</span>{done && <b className="ml-auto font-display text-base">{m.away_goals}</b>}</span>
        </span>
        <span className="text-center"><TipChip code={tip.code} won={won} /></span>
        <span className="text-center font-display text-base font-bold text-accent tabular-nums">{fairOdds(tip.p).toFixed(2)}</span>
        <span className="text-center">{outcome}</span>
      </div>
    </Link>
  );
}
