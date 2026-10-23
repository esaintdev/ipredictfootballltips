import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { competitionBySlug, competitionFixtures, standings } from "@/lib/queries";
import { MatchRowCard, type Market } from "@/components/MatchCard";
import { Empty, TeamLogo } from "@/components/ui";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ market?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await competitionBySlug((await params).slug);
  return c ? { title: `${c.name} Predictions`, description: `AI predictions, tips and table for ${c.name}.` } : {};
}

export default async function LeaguePage({ params, searchParams }: Props) {
  const c = await competitionBySlug((await params).slug);
  if (!c) notFound();
  const market = (["1x2", "ou", "cs", "btts"].includes((await searchParams).market ?? "") ? (await searchParams).market : "1x2") as Market;
  const [upcoming, recent, table] = await Promise.all([
    competitionFixtures(c.id, true, 30),
    competitionFixtures(c.id, false, 15),
    c.type === "league" && c.current_season ? standings(c.id, c.current_season) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 p-2"><TeamLogo src={c.logo} name={c.name} size={48} /></span>
        <div>
          <h1 className="text-3xl font-black text-white">{c.name} predictions</h1>
          <p className="text-muted">{c.country}{c.current_season ? ` · Season ${c.current_season}` : ""}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2/70 px-4 py-3">
              <h2 className="font-bold text-white">Upcoming matches</h2>
              <div className="flex gap-1">
                {(["1x2", "ou", "cs", "btts"] as const).map((k) => (
                  <Link key={k} href={`?market=${k}`} className={`chip ${k === market ? "chip-active" : ""}`}>{{ "1x2": "1X2", ou: "O/U", cs: "Score", btts: "BTTS" }[k]}</Link>
                ))}
              </div>
            </div>
            {upcoming.length ? upcoming.filter((m) => m.p_home == null || m.is_published).map((m) => <MatchRowCard key={m.id} m={m} market={market} />) : <p className="p-6 text-sm text-muted">No upcoming fixtures scheduled.</p>}
          </section>
          <section className="card overflow-hidden">
            <h2 className="border-b border-line bg-panel-2/70 px-4 py-3 font-bold text-white">Recent results</h2>
            {recent.length ? recent.filter((m) => m.p_home == null || m.is_published).map((m) => <MatchRowCard key={m.id} m={m} market={market} />) : <p className="p-6 text-sm text-muted">No results yet.</p>}
          </section>
        </div>

        <aside>
          {table.length > 0 ? (
            <section className="card overflow-hidden">
              <h2 className="border-b border-line bg-panel-2/70 px-4 py-3 font-bold text-white">Table</h2>
              <table className="table text-xs">
                <thead><tr><th>#</th><th>Team</th><th>P</th><th>GD</th><th>Pts</th></tr></thead>
                <tbody>
                  {table.map((r, i) => (
                    <tr key={r.team_id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><span className="flex items-center gap-2"><TeamLogo src={r.logo} name={r.name} size={16} /><span className="truncate">{r.name}</span></span></td>
                      <td>{r.p}</td>
                      <td>{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</td>
                      <td className="font-bold text-white">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <Empty title="No table">Tables are shown for league competitions once results are in.</Empty>
          )}
        </aside>
      </div>
    </div>
  );
}
