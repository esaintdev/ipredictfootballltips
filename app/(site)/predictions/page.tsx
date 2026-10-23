import Link from "next/link";
import type { Metadata } from "next";
import { competitions, predictionsForDay } from "@/lib/queries";
import { CompetitionGroup, MatchRowCard, groupByCompetition, type Market } from "@/components/MatchCard";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Football Predictions" };

const MARKETS: { id: Market; label: string; title: string }[] = [
  { id: "1x2", label: "Match Winner", title: "1X2 Match Winner Predictions" },
  { id: "ou", label: "Over/Under 2.5", title: "Over/Under Goals Predictions" },
  { id: "cs", label: "Correct Score", title: "Correct Score Predictions" },
  { id: "btts", label: "BTTS", title: "Both Teams To Score Predictions" },
];

function dayLabel(d: Date, offset: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" });
}

export default async function PredictionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : today.toISOString().slice(0, 10);
  const market = (MARKETS.find((m) => m.id === sp.market)?.id ?? "1x2") as Market;
  const league = sp.league || undefined;
  const [rows, comps] = await Promise.all([predictionsForDay(date, league), competitions()]);
  const groups = groupByCompetition(rows);
  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const all = { date, market, league, ...p };
    for (const [k, v] of Object.entries(all)) if (v && !(k === "market" && v === "1x2")) u.set(k, v);
    return `/predictions?${u}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">{MARKETS.find((m) => m.id === market)!.title}</h1>
        <p className="mt-1 text-muted">AI probabilities for every match in our {comps.length} covered competitions. Kick-off times are shown in your local time.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 9 }, (_, i) => i - 2).map((off) => {
          const d = new Date(today.getTime() + off * 86_400_000);
          const iso = d.toISOString().slice(0, 10);
          return (
            <Link key={iso} href={href({ date: iso })} className={`chip shrink-0 px-4 py-2 ${iso === date ? "chip-active" : ""}`}>
              {dayLabel(d, off)}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MARKETS.map((m) => (
          <Link key={m.id} href={href({ market: m.id })} className={`btn ${m.id === market ? "btn-primary" : "btn-ghost"}`}>{m.label}</Link>
        ))}
        <form className="ml-auto" action="/predictions">
          <input type="hidden" name="date" value={date} />
          {market !== "1x2" && <input type="hidden" name="market" value={market} />}
          <select name="league" defaultValue={league ?? ""} className="input w-56" aria-label="Filter by competition">
            <option value="">All competitions</option>
            {comps.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button className="btn btn-ghost ml-2">Filter</button>
        </form>
      </div>

      {groups.length ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <CompetitionGroup key={g.comp.comp_id} name={g.comp.comp_name} logo={g.comp.comp_logo} flag={g.comp.comp_flag} slug={g.comp.comp_slug}>
              {g.rows.map((m) => <MatchRowCard key={m.id} m={m} market={market} />)}
            </CompetitionGroup>
          ))}
        </div>
      ) : (
        <Empty title="No predictions for this day">Try another date or competition. New fixtures are added automatically every day.</Empty>
      )}
    </div>
  );
}
