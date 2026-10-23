import Link from "next/link";
import type { Metadata } from "next";
import { settledForDay } from "@/lib/queries";
import { CompetitionGroup, MatchRowCard, groupByCompetition, type Market } from "@/components/MatchCard";
import { Empty, Stat, pct } from "@/components/ui";

export const metadata: Metadata = { title: "Prediction Results" };

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ date?: string; market?: string }> }) {
  const sp = await searchParams;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : yesterday;
  const market = (["1x2", "ou", "cs", "btts"].includes(sp.market ?? "") ? sp.market : "1x2") as Market;
  const rows = await settledForDay(date);
  const n = rows.length;
  const won = (k: "won_1x2" | "won_ou" | "won_btts" | "won_score") => rows.filter((r) => r[k]).length;
  const days = Array.from({ length: 8 }, (_, i) => new Date(Date.now() - (i + 1) * 86_400_000).toISOString().slice(0, 10)).reverse();
  days.push(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Results & graded tips</h1>
        <p className="mt-1 text-muted">Every published prediction is frozen at kick-off and graded automatically after the final whistle.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <Link key={d} href={`/results?date=${d}&market=${market}`} className={`chip shrink-0 px-4 py-2 ${d === date ? "chip-active" : ""}`}>
            {new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
          </Link>
        ))}
      </div>
      {n > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Match winner" value={`${won("won_1x2")}/${n}`} sub={pct(won("won_1x2") / n, 1)} />
          <Stat label="Over/Under 2.5" value={`${won("won_ou")}/${n}`} sub={pct(won("won_ou") / n, 1)} />
          <Stat label="BTTS" value={`${won("won_btts")}/${n}`} sub={pct(won("won_btts") / n, 1)} />
          <Stat label="Correct score" value={`${won("won_score")}/${n}`} sub={pct(won("won_score") / n, 1)} />
        </div>
      )}
      <div className="flex gap-2">
        {(["1x2", "ou", "cs", "btts"] as const).map((k) => (
          <Link key={k} href={`/results?date=${date}&market=${k}`} className={`btn ${k === market ? "btn-primary" : "btn-ghost"}`}>{{ "1x2": "Match Winner", ou: "Over/Under", cs: "Correct Score", btts: "BTTS" }[k]}</Link>
        ))}
      </div>
      {n ? (
        <div className="space-y-4">
          {groupByCompetition(rows).map((g) => (
            <CompetitionGroup key={g.comp.comp_id} name={g.comp.comp_name} logo={g.comp.comp_logo} flag={g.comp.comp_flag} slug={g.comp.comp_slug}>
              {g.rows.map((m) => <MatchRowCard key={m.id} m={m} market={market} />)}
            </CompetitionGroup>
          ))}
        </div>
      ) : (
        <Empty title="No graded predictions for this day" />
      )}
    </div>
  );
}
