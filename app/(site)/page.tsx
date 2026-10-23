import Link from "next/link";
import offline from "@/data/offline-backtest.json";
import { featuredTips, predictionsForDay, trackRecord, upcomingTop } from "@/lib/queries";
import { siteSettings } from "@/lib/settings";
import { CompetitionGroup, MatchRowCard, TipCard, groupByCompetition } from "@/components/MatchCard";
import { Empty, SectionTitle, pct } from "@/components/ui";
import type { BacktestReport } from "@/lib/model/backtest";

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [site, featured, todays, record, top] = await Promise.all([
    siteSettings(), featuredTips(6), predictionsForDay(today), trackRecord(30), upcomingTop(6),
  ]);
  const tips = featured.length ? featured : top;
  const bt = (offline as { report: BacktestReport }).report;
  const groups = groupByCompetition(todays).slice(0, 6);
  const live = record.overall;

  return (
    <div className="space-y-14">
      {site.announcement && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{site.announcement}</div>
      )}

      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="chip chip-active">⚡ AI model · updated daily</span>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Smarter football predictions,<br /><span className="bg-gradient-to-r from-brand to-gold bg-clip-text text-transparent">backed by data.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{site.tagline}. Match winner, over/under goals, BTTS and correct score for the top 15 leagues, every UEFA competition and FIFA national-team football.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/predictions" className="btn btn-primary px-6 py-3 text-base">See today&apos;s predictions</Link>
            <Link href="/accuracy" className="btn btn-ghost px-6 py-3 text-base">View our accuracy</Link>
          </div>
        </div>
        <div className="card relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
          <div className="label">Backtested on {bt.overall.n.toLocaleString()} matches (2024-25 & 2025-26)</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[
              ["Match winner", bt.overall.acc1x2, `vs ${pct(bt.overall.baselineHome, 1)} always picking home`],
              ["Tips ≥ 60% confidence", bt.confidence1x2.find((c) => c.minProb === 0.6)?.accuracy ?? 0, "strike rate"],
              ["Over 1.5 / Under 1.5", bt.overall.accOu15, "hit rate"],
              ["Correct score in top 3", bt.overall.accScoreTop3, "of matches"],
            ].map(([label, v, sub]) => (
              <div key={label as string} className="rounded-xl bg-panel-2/70 p-4">
                <div className="text-3xl font-black text-brand">{pct(v as number, 1)}</div>
                <div className="mt-1 text-sm font-semibold text-white">{label as string}</div>
                <div className="text-xs text-muted">{sub as string}</div>
              </div>
            ))}
          </div>
          {live.n > 0 && (
            <div className="mt-4 rounded-xl border border-line p-3 text-sm">
              <span className="text-muted">Live record, last 30 days:</span>{" "}
              <b className="text-white">{pct(live.w1x2 / live.n, 1)}</b> 1X2 · <b className="text-white">{pct(live.wou / live.n, 1)}</b> O/U 2.5 over {live.n} graded tips
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionTitle href="/predictions" action="All predictions">🔥 Top tips</SectionTitle>
        {tips.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tips.map((m) => <TipCard key={m.id} m={m} />)}</div>
        ) : (
          <Empty title="No tips published yet">Predictions appear here once fixtures are synced. Admins can run a sync from the control panel.</Empty>
        )}
      </section>

      <section>
        <SectionTitle href="/predictions">Today&apos;s matches</SectionTitle>
        {groups.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((g) => (
              <CompetitionGroup key={g.comp.comp_id} name={g.comp.comp_name} logo={g.comp.comp_logo} flag={g.comp.comp_flag} slug={g.comp.comp_slug}>
                {g.rows.slice(0, 6).map((m) => <MatchRowCard key={m.id} m={m} market="1x2" />)}
              </CompetitionGroup>
            ))}
          </div>
        ) : (
          <Empty title="No matches today in our competitions">Check the <Link className="text-brand" href="/predictions">upcoming days</Link>.</Empty>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["📊", "Dixon-Coles Poisson model", "Every team gets attack & defence ratings, weighted towards recent form and adjusted for home advantage."],
          ["🧪", "Honestly backtested", "Walk-forward tests on past seasons: the model only ever sees data from before each match."],
          ["✅", "Graded in public", "Every published tip is frozen at kick-off and graded automatically. No deleted losers."],
        ].map(([icon, title, text]) => (
          <div key={title} className="card p-5">
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-2 font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
