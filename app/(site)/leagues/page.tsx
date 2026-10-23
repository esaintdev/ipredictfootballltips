import Link from "next/link";
import type { Metadata } from "next";
import { competitions } from "@/lib/queries";
import { PageHero, QuickTabs, TopLeagues } from "@/components/site/blocks";
import { TeamLogo } from "@/components/ui";

export const metadata: Metadata = { title: "Leagues & Competitions" };

const SECTIONS = [
  { key: "domestic", title: "Top Domestic Leagues" },
  { key: "uefa", title: "UEFA Competitions" },
  { key: "fifa", title: "FIFA & International" },
];

export default async function LeaguesPage() {
  const comps = await competitions();
  return (
    <>
      <PageHero title="Leagues" intro="Predictions, tables and results for every competition we cover. Men's senior football only." />
      <QuickTabs />
      <TopLeagues comps={comps.filter((c) => c.category === "domestic").slice(0, 5)} />
      {SECTIONS.map((s) => {
        const list = comps.filter((c) => c.category === s.key);
        if (!list.length) return null;
        return (
          <section key={s.key} className="s-card mt-6 p-4 sm:p-6">
            <h2 className="s-h2 mb-5">{s.title}</h2>
            <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <Link key={c.id} href={`/leagues/${c.slug}`} className="flex items-center gap-3 border-b border-edge/70 py-3 hover:text-accent">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-sm"><TeamLogo src={c.logo} name={c.name} size={26} /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-fg">{c.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-subtle">{c.flag && <TeamLogo src={c.flag} name={c.country} size={12} />}{c.country}</span>
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-subtle">{c.upcoming} upcoming</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
