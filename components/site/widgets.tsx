import Link from "next/link";
import { competitions, featuredTips, recentSettled, standings, trackRecord, upcomingTop, type MatchRow, type StandingRow } from "@/lib/queries";
import { bestTip, mainTip, tipResult } from "@/lib/tips";
import { LocalTime, TeamLogo, pct } from "@/components/ui";
import { ConfidenceBadge, ResultBadge } from "./blocks";
import { Carousel } from "./client";

/** Horizontally scrolling cards of upcoming featured picks. */
export async function UpcomingPicks() {
  const featured = await featuredTips(10);
  const rows = (featured.length ? featured : await upcomingTop(10)).filter((m) => new Date(m.kickoff).getTime() > Date.now());
  if (!rows.length) return null;
  return (
    <section className="s-card mt-6 p-4 sm:p-6">
      <h2 className="mb-5 text-center text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">Upcoming Picks</h2>
      <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {rows.map((m) => {
          const t = bestTip(m)!;
          return (
            <Link key={m.id} href={`/match/${m.id}`} className="w-[17rem] shrink-0 snap-start rounded-2xl border border-edge p-4 transition hover:border-accent/60">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                <Team name={m.home_name} logo={m.home_logo} />
                <div>
                  <div className="text-xl font-extrabold text-fg"><LocalTime iso={m.kickoff} /></div>
                  <div className="text-[11px] text-subtle"><LocalTime iso={m.kickoff} mode="date" /></div>
                </div>
                <Team name={m.away_name} logo={m.away_logo} />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="rounded-full border border-edge px-3 py-1 text-xs font-bold text-fg">{({ "1": "Home", X: "Draw", "2": "Away" } as Record<string, string>)[t.code] ?? t.code}</span>
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
    <span className="flex min-w-0 flex-col items-center gap-1">
      <TeamLogo src={logo} name={name} size={32} />
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
      <Widget title="Latest Results" href="/results" action="All results">
        {recent.length ? (
          <ul className="space-y-3">{recent.map((m) => <ResultItem key={m.id} m={m} />)}</ul>
        ) : (
          <p className="text-sm text-subtle">Graded results appear here once published tips have been played.</p>
        )}
      </Widget>
      <Widget title="League Table" href="/leagues" action="All leagues">
        <Carousel>
          {tables.filter((t) => t.rows.length).map((t) => <MiniTable key={t.c.id} name={t.c.name} country={t.c.country} slug={t.c.slug} rows={t.rows} />)}
        </Carousel>
        {!tables.some((t) => t.rows.length) && <p className="text-sm text-subtle">Tables appear once this season&apos;s results are synced.</p>}
      </Widget>
      <Widget title="Track Record" href="/accuracy" action="Full accuracy report">
        <p className="mb-3 text-xs text-subtle">Published tips graded in the last 30 days{record.overall.n ? ` · ${record.overall.n} matches` : ""}</p>
        {record.overall.n ? (
          <ul className="divide-y divide-edge">
            {([["Match winner (1X2)", record.overall.w1x2], ["Over/Under 2.5", record.overall.wou], ["Both teams to score", record.overall.wbtts], ["Correct score", record.overall.wscore]] as const).map(([k, w]) => (
              <li key={k} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-fg">{k}</span>
                <span className="text-subtle">{w}/{record.overall.n} <b className="ml-2 text-accent">{pct(w / record.overall.n, 1)}</b></span>
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

function Widget({ title, href, action, children }: { title: string; href: string; action: string; children: React.ReactNode }) {
  return (
    <section className="s-card flex flex-col p-5">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-fg">{title}</h2>
      <div className="flex-1">{children}</div>
      <Link href={href} className="s-btn s-btn-outline mt-4 w-full">{action} ›</Link>
    </section>
  );
}

function ResultItem({ m }: { m: MatchRow }) {
  const t = mainTip(m);
  const won = t ? tipResult({ m, tip: t }) : null;
  return (
    <li>
      <Link href={`/match/${m.id}`} className="block border-l-2 border-edge pl-3 hover:border-accent">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-fg">
          <span className="truncate">{m.home_name} {m.home_goals}-{m.away_goals} {m.away_name}</span>
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
