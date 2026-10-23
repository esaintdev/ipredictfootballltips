import Link from "next/link";
import { competitions, featuredTips, recentSettled, standings, trackRecord, upcomingTop, type MatchRow, type StandingRow } from "@/lib/queries";
import { bestTip, fairOdds, mainTip, tipResult } from "@/lib/tips";
import { LocalTime, TeamLogo, pct } from "@/components/ui";
import { ConfidenceBadge, ResultBadge } from "./blocks";
import { Carousel } from "./client";
import { Icon, type IconName } from "./icons";

/** Horizontally scrolling cards of upcoming featured picks. */
export async function UpcomingPicks() {
  const featured = await featuredTips(10);
  const rows = (featured.length ? featured : await upcomingTop(10)).filter((m) => new Date(m.kickoff).getTime() > Date.now());
  if (!rows.length) return null;
  return (
    <section className="s-card mt-6 overflow-hidden">
      <div className="flex items-end justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <div className="s-eyebrow">Featured</div>
          <h2 className="s-h2 mt-1">Upcoming Picks</h2>
        </div>
        <Link href="/free-football-tips" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Free tips<Icon name="chevronRight" size={16} /></Link>
      </div>
      <div className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-4 pb-5 sm:scroll-px-6 sm:px-6 sm:pb-6">
        {rows.map((m) => {
          const t = bestTip(m)!;
          return (
            <Link key={m.id} href={`/match/${m.id}`} className="group w-[16.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-edge bg-surface transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-edge bg-surface-2 px-3 py-2 text-[11px] font-semibold text-subtle">
                <TeamLogo src={m.comp_logo} name={m.comp_name} size={14} /><span className="truncate">{m.comp_name}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-4 text-center">
                <Team name={m.home_name} logo={m.home_logo} />
                <div>
                  <div className="font-display text-2xl leading-none font-bold text-fg"><LocalTime iso={m.kickoff} /></div>
                  <div className="mt-1 text-[10px] font-semibold text-subtle uppercase"><LocalTime iso={m.kickoff} mode="date" /></div>
                </div>
                <Team name={m.away_name} logo={m.away_logo} />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-3">
                <span className="rounded-md bg-navy px-2.5 py-1 text-xs font-bold text-white">{({ "1": "Home", X: "Draw", "2": "Away" } as Record<string, string>)[t.code] ?? t.code}</span>
                <span className="font-display text-lg font-bold text-accent">@{fairOdds(t.p).toFixed(2)}</span>
                <ConfidenceBadge p={t.p} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Team({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-1.5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-edge"><TeamLogo src={logo} name={name} size={28} /></span>
      <span className="w-full truncate text-xs font-bold text-fg">{name}</span>
    </span>
  );
}

/** Latest results, League tables, Track record. */
export async function WidgetRow() {
  const [recent, comps, record] = await Promise.all([recentSettled(6), competitions(), trackRecord(30)]);
  const leagues = comps.filter((c) => c.type === "league" && c.category === "domestic" && c.current_season).slice(0, 5);
  const tables = await Promise.all(leagues.map(async (c) => ({ c, rows: (await standings(c.id, c.current_season!)).slice(0, 7) })));
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Widget title="Latest Results" icon="check" href="/results" action="All results">
        {recent.length ? (
          <ul className="space-y-3">{recent.map((m) => <ResultItem key={m.id} m={m} />)}</ul>
        ) : (
          <p className="text-sm text-subtle">Graded results appear here once published tips have been played.</p>
        )}
      </Widget>
      <Widget title="League Table" icon="trophy" href="/leagues" action="All leagues">
        <Carousel>
          {tables.filter((t) => t.rows.length).map((t) => <MiniTable key={t.c.id} name={t.c.name} country={t.c.country} slug={t.c.slug} rows={t.rows} />)}
        </Carousel>
        {!tables.some((t) => t.rows.length) && <p className="text-sm text-subtle">Tables appear once this season&apos;s results are synced.</p>}
      </Widget>
      <Widget title="Track Record" icon="chart" href="/accuracy" action="Full accuracy report">
        <p className="mb-3 text-xs text-subtle">Published tips graded in the last 30 days{record.overall.n ? ` · ${record.overall.n} matches` : ""}</p>
        {record.overall.n ? (
          <ul className="divide-y divide-edge">
            {([["Match winner (1X2)", record.overall.w1x2], ["Over/Under 2.5", record.overall.wou], ["Both teams to score", record.overall.wbtts], ["Correct score", record.overall.wscore]] as const).map(([k, w]) => (
              <li key={k} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-fg">{k}</span>
                  <span className="font-display text-xl leading-none font-bold text-accent">{pct(w / record.overall.n, 1)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge"><span className="block h-full rounded-full bg-brand-solid" style={{ width: `${(w / record.overall.n) * 100}%` }} /></span>
                  <span className="text-[11px] text-subtle tabular-nums">{w}/{record.overall.n}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle">Live grading starts once the first published predictions are played. Meanwhile, see our out-of-sample backtest.</p>
        )}
      </Widget>
    </div>
  );
}

function Widget({ title, icon, href, action, children }: { title: string; icon: IconName; href: string; action: string; children: React.ReactNode }) {
  return (
    <section className="s-card flex flex-col p-5">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-2xl leading-none font-bold tracking-wide text-fg uppercase">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name={icon} size={18} /></span>{title}
      </h2>
      <div className="flex-1">{children}</div>
      <Link href={href} className="s-btn s-btn-outline mt-4 w-full">{action}<Icon name="chevronRight" size={16} /></Link>
    </section>
  );
}

function ResultItem({ m }: { m: MatchRow }) {
  const t = mainTip(m);
  const won = t ? tipResult({ m, tip: t }) : null;
  return (
    <li>
      <Link href={`/match/${m.id}`} className={`block border-l-[3px] pl-3 transition hover:bg-surface-2 ${won == null ? "border-edge" : won ? "border-brand-solid" : "border-loss"}`}>
        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-fg">
          <span className="truncate">{m.home_name} <span className="mx-1 rounded bg-navy px-1.5 py-0.5 font-display text-sm text-white">{m.home_goals}-{m.away_goals}</span> {m.away_name}</span>
          <ResultBadge won={won} />
        </div>
        <div className="text-xs text-subtle">{m.comp_name} · <LocalTime iso={m.kickoff} mode="date" /> · Tip {t?.code}</div>
      </Link>
    </li>
  );
}

function MiniTable({ name, country, slug, rows }: { name: string; country: string; slug: string; rows: StandingRow[] }) {
  return (
    <div>
      <Link href={`/leagues/${slug}`} className="font-bold text-fg hover:text-accent">{name}</Link>
      <div className="text-xs text-subtle">{country}</div>
      <table className="mt-3 w-full text-sm">
        <thead><tr className="border-b border-edge text-xs text-subtle"><th className="py-2 text-left font-medium">#</th><th className="text-left font-medium">Team</th><th className="font-medium">P</th><th className="font-medium">Pts</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team_id} className="border-b border-edge/60">
              <td className={`py-2 pl-1 text-subtle ${i < 4 ? "border-l-2 border-accent" : ""}`}>{i + 1}</td>
              <td><span className="flex items-center gap-2 font-semibold text-fg"><TeamLogo src={r.logo} name={r.name} size={16} /><span className="truncate">{r.name}</span></span></td>
              <td className="text-center text-subtle">{r.p}</td>
              <td className="text-center font-bold text-fg">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
