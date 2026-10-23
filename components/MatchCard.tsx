import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { LocalTime, ProbBar, Stars, TeamLogo, WinLoss, pct, pickLabel } from "./ui";

export type Market = "1x2" | "ou" | "cs" | "btts";

const LIVE = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];
const DONE = ["FT", "AET", "PEN"];

function Status({ m }: { m: MatchRow }) {
  if (DONE.includes(m.status)) return <span className="text-xs font-semibold text-muted">FT</span>;
  if (LIVE.includes(m.status)) return <span className="text-xs font-bold text-loss animate-pulse">LIVE</span>;
  if (["PST", "CANC", "ABD"].includes(m.status)) return <span className="text-xs font-semibold text-loss">{m.status}</span>;
  return <span className="text-sm font-semibold text-slate-200"><LocalTime iso={m.kickoff} /></span>;
}

export function MatchRowCard({ m, market }: { m: MatchRow; market: Market }) {
  const played = m.home_goals != null && (DONE.includes(m.status) || LIVE.includes(m.status));
  return (
    <Link href={`/match/${m.id}`} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 border-b border-line/60 px-4 py-3 transition last:border-0 hover:bg-panel-2/60 sm:grid-cols-[3.5rem_1fr_15rem]">
      <div className="text-center"><Status m={m} /></div>
      <div className="min-w-0 space-y-1.5">
        {([["home", m.home_name, m.home_logo, m.home_goals], ["away", m.away_name, m.away_logo, m.away_goals]] as const).map(([k, name, logo, g]) => (
          <div key={k} className="flex items-center gap-2">
            <TeamLogo src={logo} name={name} size={20} />
            <span className="truncate text-sm font-medium text-slate-100">{name}</span>
            {played && <span className="ml-auto pr-2 text-sm font-bold text-white">{g}</span>}
          </div>
        ))}
      </div>
      <div className="col-span-2 sm:col-span-1">
        <MarketCell m={m} market={market} />
      </div>
    </Link>
  );
}

function MarketCell({ m, market }: { m: MatchRow; market: Market }) {
  if (m.p_home == null) return <span className="text-xs text-muted">No prediction yet</span>;
  const settled = m.won_1x2 != null;
  if (market === "1x2") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">{m.pick_1x2 === "X" ? "Draw" : `${m.pick_1x2} · ${pickLabel(m.pick_1x2, m.home_name, m.away_name).replace(" win", "")}`}</span>
          {settled ? <WinLoss won={m.won_1x2} /> : <Stars confidence={m.confidence ?? 0} />}
        </div>
        <ProbBar home={m.p_home} draw={m.p_draw!} away={m.p_away!} />
      </div>
    );
  }
  if (market === "ou") {
    const o = m.p_over!;
    return (
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{m.pick_ou === "over" ? "Over" : "Under"} 2.5</div>
          <div className="text-[11px] text-muted">O1.5 {pct(o["1.5"])} · O2.5 {pct(o["2.5"])} · O3.5 {pct(o["3.5"])}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand">{pct(m.pick_ou === "over" ? o["2.5"] : 1 - o["2.5"])}</span>
          {settled && <WinLoss won={m.won_ou} />}
        </div>
      </div>
    );
  }
  if (market === "cs") {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {m.top_scores!.slice(0, 3).map((s, i) => (
            <span key={s.score} className={`rounded-md px-2 py-1 text-xs font-bold ${i === 0 ? "bg-gold/20 text-gold" : "bg-panel-2 text-slate-300"}`}>
              {s.score} <span className="font-normal opacity-70">{pct(s.p)}</span>
            </span>
          ))}
        </div>
        {settled && <WinLoss won={m.won_score} />}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-sm font-bold text-white">BTTS: {m.pick_btts ? "Yes" : "No"}</div>
        <div className="text-[11px] text-muted">xG {m.exp_home!.toFixed(2)} – {m.exp_away!.toFixed(2)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-brand">{pct(m.pick_btts ? m.p_btts : 1 - m.p_btts!)}</span>
        {settled && <WinLoss won={m.won_btts} />}
      </div>
    </div>
  );
}

export function CompetitionGroup({ name, logo, flag, slug, children }: { name: string; logo: string | null; flag: string | null; slug: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <Link href={`/leagues/${slug}`} className="flex items-center gap-2 border-b border-line bg-panel-2/70 px-4 py-2.5 hover:text-brand">
        {flag && <TeamLogo src={flag} name={name} size={16} />}
        <TeamLogo src={logo} name={name} size={20} />
        <span className="text-sm font-bold">{name}</span>
      </Link>
      {children}
    </section>
  );
}

export function TipCard({ m }: { m: MatchRow }) {
  return (
    <Link href={`/match/${m.id}`} className="card group block p-4 transition hover:border-brand/60">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5"><TeamLogo src={m.comp_logo} name={m.comp_name} size={14} />{m.comp_name}</span>
        <LocalTime iso={m.kickoff} mode="datetime" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo src={m.home_logo} name={m.home_name} size={36} />
          <span className="w-full truncate text-sm font-semibold">{m.home_name}</span>
        </div>
        <span className="text-xs font-bold text-muted">VS</span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo src={m.away_logo} name={m.away_name} size={36} />
          <span className="w-full truncate text-sm font-semibold">{m.away_name}</span>
        </div>
      </div>
      <div className="mt-4"><ProbBar home={m.p_home!} draw={m.p_draw!} away={m.p_away!} /></div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-brand/10 p-2"><div className="text-muted">Tip</div><div className="font-bold text-brand">{pickLabel(m.pick_1x2, "Home", "Away")}</div></div>
        <div className="rounded-lg bg-panel-2 p-2"><div className="text-muted">Goals</div><div className="font-bold text-white">{m.pick_ou === "over" ? "O" : "U"} 2.5</div></div>
        <div className="rounded-lg bg-gold/10 p-2"><div className="text-muted">Score</div><div className="font-bold text-gold">{m.pick_score}</div></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <Stars confidence={m.confidence ?? 0} />
        <span className="text-muted">{m.won_1x2 != null ? <WinLoss won={m.won_1x2} /> : `${m.confidence}% confidence`}</span>
      </div>
    </Link>
  );
}

/** Groups rows by competition preserving order. */
export function groupByCompetition(rows: MatchRow[]) {
  const map = new Map<number, { comp: MatchRow; rows: MatchRow[] }>();
  for (const r of rows) {
    if (!map.has(r.comp_id)) map.set(r.comp_id, { comp: r, rows: [] });
    map.get(r.comp_id)!.rows.push(r);
  }
  return [...map.values()];
}
