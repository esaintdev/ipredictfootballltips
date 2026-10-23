import Link from "next/link";
import type { Metadata } from "next";
import { competitions } from "@/lib/queries";
import { TeamLogo } from "@/components/ui";

export const metadata: Metadata = { title: "Leagues & Competitions" };

const SECTIONS = [
  { key: "domestic", title: "Top 15 Leagues" },
  { key: "uefa", title: "UEFA Competitions" },
  { key: "fifa", title: "FIFA & International" },
];

export default async function LeaguesPage() {
  const comps = await competitions();
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white">Leagues & competitions</h1>
        <p className="mt-1 text-muted">Men&apos;s senior football only – no women&apos;s or youth competitions.</p>
      </div>
      {SECTIONS.map((s) => {
        const list = comps.filter((c) => c.category === s.key);
        if (!list.length) return null;
        return (
          <section key={s.key}>
            <h2 className="mb-4 text-xl font-bold text-white">{s.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <Link key={c.id} href={`/leagues/${c.slug}`} className="card flex items-center gap-3 p-4 transition hover:border-brand/60">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 p-1.5"><TeamLogo src={c.logo} name={c.name} size={32} /></span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{c.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">{c.flag && <TeamLogo src={c.flag} name={c.country} size={12} />}{c.country}</div>
                  </div>
                  <span className="ml-auto chip">{c.upcoming} upcoming</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
