import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { competitionBySlug, competitionFixtures, standings } from "@/lib/queries";
import { CATEGORIES, tipsFor, type CategoryId } from "@/lib/tips";
import { Board, PageHero, TipsTable } from "@/components/site/blocks";
import { Scroller } from "@/components/site/client";
import { TeamLogo } from "@/components/ui";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tips?: string }> };

const TABS: CategoryId[] = ["all", "double-chance", "over-1-5", "over-2-5", "btts", "home-win", "away-win", "correct-score"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await competitionBySlug((await params).slug);
  return c ? { title: `${c.name} Predictions`, description: `Free AI predictions, tips, results and table for ${c.name}.` } : {};
}

export default async function LeaguePage({ params, searchParams }: Props) {
  const c = await competitionBySlug((await params).slug);
  if (!c) notFound();
  const sp = await searchParams;
  const cat = TABS.find((t) => t === sp.tips) ?? "all";
  const [upcoming, recent, table] = await Promise.all([
    competitionFixtures(c.id, true, 30),
    competitionFixtures(c.id, false, 15),
    c.type === "league" && c.current_season ? standings(c.id, c.current_season) : Promise.resolve([]),
  ]);
  const published = (rows: typeof upcoming) => rows.filter((m) => m.p_home != null && m.is_published);

  return (
    <>
      <PageHero title={`${c.name} Predictions`} intro={`${c.country}${c.current_season ? ` · Season ${c.current_season}` : ""}. Model tips for every upcoming ${c.name} match, recent results and the table.`} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Board
            title="Upcoming Matches"
            tabs={
              <Scroller className="-mx-1 px-1 pb-1">
                {TABS.map((id) => {
                  const k = CATEGORIES.find((x) => x.id === id)!;
                  return <Link key={id} href={id === "all" ? "?" : `?tips=${id}`} data-active={id === cat} className={`s-pill ${id === cat ? "s-pill-active" : ""}`}>{k.label}</Link>;
                })}
              </Scroller>
            }
          >
            <TipsTable rows={tipsFor(cat, published(upcoming))} empty="No upcoming predictions for this competition yet." />
          </Board>
          <Board title="Recent Results">
            <TipsTable rows={tipsFor(cat, published(recent)).sort((a, b) => new Date(b.m.kickoff).getTime() - new Date(a.m.kickoff).getTime())} empty="No graded results yet." />
          </Board>
        </div>
        <aside className="min-w-0">
          <section className="s-card mt-6 overflow-hidden p-5">
            <h2 className="mb-1 text-xl font-extrabold text-fg">League Table</h2>
            <div className="mb-3 flex items-center gap-2 text-xs text-subtle"><TeamLogo src={c.logo} name={c.name} size={14} />{c.name}</div>
            {table.length ? (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-edge text-xs text-subtle"><th className="py-2 text-left font-medium">#</th><th className="text-left font-medium">Team</th><th className="font-medium">P</th><th className="font-medium">GD</th><th className="font-medium">Pts</th></tr></thead>
                <tbody>
                  {table.map((r, i) => (
                    <tr key={r.team_id} className="border-b border-edge/60">
                      <td className={`py-2 pl-1 text-subtle ${i < 4 ? "border-l-2 border-accent" : ""}`}>{i + 1}</td>
                      <td className="max-w-0"><span className="flex items-center gap-2 font-semibold text-fg"><TeamLogo src={r.logo} name={r.name} size={16} /><span className="truncate">{r.name}</span></span></td>
                      <td className="text-center text-subtle">{r.p}</td>
                      <td className="text-center text-subtle">{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</td>
                      <td className="text-center font-bold text-fg">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-subtle">Tables are shown for league competitions once results are in.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
