import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headToHead, matchById, teamForm, type MatchRow } from "@/lib/queries";
import { scoreMatrix } from "@/lib/model/poisson";
import { bestTip, candidates, fairOdds, gradeTip, isFinished, mainTip, type Tip } from "@/lib/tips";
import { ConfidenceBadge, ResultBadge } from "@/components/site/blocks";
import { LocalTime, Meter, TeamLogo, pct } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await matchById(Number((await params).id));
  if (!m) return {};
  return {
    title: `${m.home_name} vs ${m.away_name} Prediction`,
    description: `AI prediction for ${m.home_name} vs ${m.away_name} (${m.comp_name}): match winner, over/under goals, BTTS and correct score.`,
  };
}

export default async function MatchPage({ params }: Props) {
  const id = Number((await params).id);
  const m = Number.isFinite(id) ? await matchById(id) : null;
  if (!m || (m.p_home != null && !m.is_published)) notFound();
  const [homeForm, awayForm, h2h] = await Promise.all([
    teamForm(m.home_id, m.kickoff), teamForm(m.away_id, m.kickoff), headToHead(m.home_id, m.away_id, m.kickoff),
  ]);
  const hasPred = m.p_home != null;
  const finished = isFinished(m);
  const grid = hasPred ? scoreMatrix(m.exp_home!, m.exp_away!, m.rho ?? -0.05).slice(0, 6).map((r) => r.slice(0, 6)) : [];
  const gridMax = hasPred ? Math.max(...grid.flat()) : 1;
  const best = hasPred ? bestTip(m) : null;
  const main = hasPred ? mainTip(m) : null;
  const score: Tip | null = hasPred && m.pick_score ? { code: m.pick_score, label: m.pick_score, p: m.top_scores!.find((s) => s.score === m.pick_score)?.p ?? m.top_scores![0].p, market: "cs" } : null;
  const grade = (t: Tip) => (finished ? gradeTip(t, m.home_goals, m.away_goals) : null);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-subtle">
        <Link href="/" className="hover:text-accent">Home</Link> / <Link href={`/leagues/${m.comp_slug}`} className="hover:text-accent">{m.comp_name}</Link> / <span className="text-fg">{m.home_name} vs {m.away_name}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
          <TeamLogo src={m.comp_logo} name={m.comp_name} size={18} /> {m.comp_name} {m.round ? `· ${m.round}` : ""}
        </div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamHead name={m.home_name} logo={m.home_logo} />
          <div className="text-center">
            {m.home_goals != null && finished ? (
              <div className="text-4xl font-black sm:text-5xl">{m.home_goals} – {m.away_goals}</div>
            ) : (
              <div className="text-2xl font-black sm:text-3xl"><LocalTime iso={m.kickoff} /></div>
            )}
            <div className="mt-1 text-xs text-white/60"><LocalTime iso={m.kickoff} mode="date" />{m.venue ? ` · ${m.venue}` : ""}</div>
          </div>
          <TeamHead name={m.away_name} logo={m.away_logo} />
        </div>
        {hasPred && (
          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="bg-brand-solid" style={{ width: `${m.p_home! * 100}%` }} />
              <div className="bg-white/40" style={{ width: `${m.p_draw! * 100}%` }} />
              <div className="bg-gold" style={{ width: `${m.p_away! * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/70">
              <span>Home <b className="text-brand-solid">{pct(m.p_home)}</b></span>
              <span>Draw <b className="text-white">{pct(m.p_draw)}</b></span>
              <span>Away <b className="text-gold">{pct(m.p_away)}</b></span>
            </div>
            <div className="mt-2 text-center text-xs text-white/60">Expected goals <b className="text-white">{m.exp_home!.toFixed(2)} – {m.exp_away!.toFixed(2)}</b></div>
          </div>
        )}
      </section>

      {!hasPred ? (
        <div className="s-card p-6 text-center text-subtle">The prediction for this match hasn&apos;t been published yet.</div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {([{ k: "Best tip", t: best }, { k: "Match winner", t: main }, { k: "Correct score", t: score }] as { k: string; t: Tip | null }[]).map(({ k, t }) => t && (
              <div key={k} className="s-card p-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-subtle">{k}<ResultBadge won={grade(t)} /></div>
                <div className="mt-2 text-xl font-black text-fg">{t.label}</div>
                <div className="mt-3 flex items-center gap-3 text-sm"><ConfidenceBadge p={t.p} /><span className="text-subtle">Fair odds <b className="text-accent">{fairOdds(t.p).toFixed(2)}</b></span></div>
              </div>
            ))}
          </section>

          {m.admin_note && (
            <div className="s-card border-gold/60 p-5">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8a6500] dark:text-gold">Analyst note</div>
              <p className="whitespace-pre-line text-sm text-fg">{m.admin_note}</p>
            </div>
          )}

          <section className="s-card p-4 sm:p-6">
            <h2 className="mb-3 text-xl font-extrabold text-fg">All tips for this match</h2>
            <div className="divide-y divide-edge/70 text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_4rem_5rem] gap-2 pb-2 text-xs font-semibold text-subtle sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_4rem_5rem]">
                <span>Tip</span><span className="hidden sm:block">Probability</span><span className="text-center">Odds</span><span className="text-center">{finished ? "Result" : "Confidence"}</span>
              </div>
              {candidates(m).sort((a, b) => b.p - a.p).map((t) => (
                <div key={t.code} className="grid grid-cols-[minmax(0,1fr)_4rem_5rem] items-center gap-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_4rem_5rem]">
                  <span className="truncate font-semibold text-fg"><b className="mr-2 inline-block w-16">{t.code}</b><span className="font-normal text-subtle">{t.label}</span></span>
                  <span className="hidden sm:block"><Meter value={t.p} /></span>
                  <span className="text-center font-bold text-accent">{fairOdds(t.p).toFixed(2)}</span>
                  <span className="text-center">{finished ? <ResultBadge won={grade(t)} /> : <ConfidenceBadge p={t.p} />}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="s-card p-5">
              <h2 className="mb-4 text-xl font-extrabold text-fg">Goal lines</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-edge text-xs text-subtle"><th className="py-2 text-left font-medium">Line</th><th className="text-left font-medium">Over</th><th className="text-left font-medium">Under</th></tr></thead>
                <tbody>
                  {Object.entries(m.p_over!).map(([line, p]) => (
                    <tr key={line} className="border-b border-edge/60">
                      <td className="py-2.5 font-bold text-fg">{line}</td>
                      <td><div className="flex items-center gap-2 pr-3"><span className="w-12 text-fg">{pct(p, 1)}</span><Meter value={p} /></div></td>
                      <td><div className="flex items-center gap-2"><span className="w-12 text-fg">{pct(1 - p, 1)}</span><Meter value={1 - p} color="bg-gold" /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="s-card p-5">
              <h2 className="mb-1 text-xl font-extrabold text-fg">Correct score probabilities</h2>
              <p className="mb-4 text-xs text-subtle">Rows: {m.home_name} goals · Columns: {m.away_name} goals</p>
              <div className="overflow-x-auto">
                <table className="mx-auto text-center text-xs">
                  <thead><tr><th className="p-1" />{grid[0].map((_, a) => <th key={a} className="p-1 text-subtle">{a}</th>)}</tr></thead>
                  <tbody>
                    {grid.map((row, h) => (
                      <tr key={h}>
                        <th className="p-1 text-subtle">{h}</th>
                        {row.map((p, a) => (
                          <td key={a} className="p-0.5">
                            <div className={`flex h-10 w-12 items-center justify-center rounded-md font-semibold ${m.home_goals === h && m.away_goals === a && finished ? "ring-2 ring-gold" : ""}`}
                              style={{ background: `rgba(18,209,142,${0.08 + (p / gridMax) * 0.8})`, color: p / gridMax > 0.5 ? "#06101e" : "var(--color-fg)" }}>
                              {pct(p, 1)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <FormList title={`${m.home_name} form`} teamId={m.home_id} rows={homeForm} />
        <FormList title={`${m.away_name} form`} teamId={m.away_id} rows={awayForm} />
        <FormList title="Head to head" rows={h2h} />
      </section>
    </div>
  );
}

function TeamHead({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-3"><TeamLogo src={logo} name={name} size={56} /></span>
      <span className="text-base font-bold sm:text-lg">{name}</span>
    </div>
  );
}

function FormList({ title, rows, teamId }: { title: string; rows: MatchRow[]; teamId?: number }) {
  return (
    <div className="s-card p-5">
      <h2 className="mb-3 font-extrabold text-fg">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-subtle">No recent matches in our database.</p>}
      <ul className="space-y-2">
        {rows.map((r) => {
          let badge = "";
          if (teamId) {
            const gf = r.home_id === teamId ? r.home_goals! : r.away_goals!;
            const ga = r.home_id === teamId ? r.away_goals! : r.home_goals!;
            badge = gf > ga ? "W" : gf < ga ? "L" : "D";
          }
          return (
            <li key={r.id} className="flex items-center gap-2 text-sm text-fg">
              {badge && <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${badge === "W" ? "bg-accent-soft text-accent" : badge === "L" ? "bg-loss/15 text-loss" : "bg-surface-2 text-subtle"}`}>{badge}</span>}
              <span className="truncate">{r.home_name}</span>
              <b className="shrink-0">{r.home_goals}-{r.away_goals}</b>
              <span className="truncate">{r.away_name}</span>
              <span className="ml-auto shrink-0 text-xs text-subtle"><LocalTime iso={r.kickoff} mode="date" /></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
