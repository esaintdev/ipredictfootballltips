import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headToHead, matchById, teamForm, type MatchRow } from "@/lib/queries";
import { scoreMatrix } from "@/lib/model/poisson";
import { LocalTime, Meter, ProbBar, Stars, TeamLogo, WinLoss, pct, pickLabel } from "@/components/ui";

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
  const finished = ["FT", "AET", "PEN"].includes(m.status);
  const grid = hasPred ? scoreMatrix(m.exp_home!, m.exp_away!, m.rho ?? -0.05).slice(0, 6).map((r) => r.slice(0, 6)) : [];
  const gridMax = hasPred ? Math.max(...grid.flat()) : 1;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/predictions" className="hover:text-brand">Predictions</Link> / <Link href={`/leagues/${m.comp_slug}`} className="hover:text-brand">{m.comp_name}</Link>
      </nav>

      <section className="card p-6">
        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <TeamLogo src={m.comp_logo} name={m.comp_name} size={18} /> {m.comp_name} {m.round ? `· ${m.round}` : ""}
        </div>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamLogo src={m.home_logo} name={m.home_name} size={72} />
            <span className="text-lg font-bold text-white">{m.home_name}</span>
          </div>
          <div className="text-center">
            {m.home_goals != null && finished ? (
              <div className="text-4xl font-black text-white">{m.home_goals} – {m.away_goals}</div>
            ) : (
              <div className="text-2xl font-black text-white"><LocalTime iso={m.kickoff} /></div>
            )}
            <div className="mt-1 text-xs text-muted"><LocalTime iso={m.kickoff} mode="date" />{m.venue ? ` · ${m.venue}` : ""}</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamLogo src={m.away_logo} name={m.away_name} size={72} />
            <span className="text-lg font-bold text-white">{m.away_name}</span>
          </div>
        </div>
        {hasPred && (
          <div className="mx-auto mt-6 max-w-xl">
            <ProbBar home={m.p_home!} draw={m.p_draw!} away={m.p_away!} />
            <div className="mt-2 text-center text-xs text-muted">Expected goals: <b className="text-white">{m.exp_home!.toFixed(2)}</b> – <b className="text-white">{m.exp_away!.toFixed(2)}</b></div>
          </div>
        )}
      </section>

      {!hasPred ? (
        <div className="card p-6 text-center text-muted">The prediction for this match hasn&apos;t been published yet.</div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PickCard title="Match winner" pick={pickLabel(m.pick_1x2, m.home_name, m.away_name)} prob={m.pick_1x2 === "1" ? m.p_home! : m.pick_1x2 === "X" ? m.p_draw! : m.p_away!} won={m.won_1x2} extra={<Stars confidence={m.confidence!} />} />
            <PickCard title="Goals" pick={`${m.pick_ou === "over" ? "Over" : "Under"} 2.5`} prob={m.pick_ou === "over" ? m.p_over!["2.5"] : 1 - m.p_over!["2.5"]} won={m.won_ou} />
            <PickCard title="Both teams to score" pick={m.pick_btts ? "Yes" : "No"} prob={m.pick_btts ? m.p_btts! : 1 - m.p_btts!} won={m.won_btts} />
            <PickCard title="Correct score" pick={m.pick_score!} prob={m.top_scores!.find((s) => s.score === m.pick_score)?.p ?? m.top_scores![0].p} won={m.won_score} gold />
          </section>

          {m.admin_note && (
            <div className="card border-gold/40 p-5">
              <div className="label text-gold">Analyst note</div>
              <p className="whitespace-pre-line text-sm text-slate-200">{m.admin_note}</p>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-4 font-bold text-white">Goal lines</h2>
              <table className="table">
                <thead><tr><th>Line</th><th>Over</th><th>Under</th></tr></thead>
                <tbody>
                  {Object.entries(m.p_over!).map(([line, p]) => (
                    <tr key={line}>
                      <td className="font-semibold">{line}</td>
                      <td><div className="flex items-center gap-2"><span className="w-12">{pct(p, 1)}</span><Meter value={p} /></div></td>
                      <td><div className="flex items-center gap-2"><span className="w-12">{pct(1 - p, 1)}</span><Meter value={1 - p} color="bg-gold" /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card p-5">
              <h2 className="mb-1 font-bold text-white">Correct score probabilities</h2>
              <p className="mb-4 text-xs text-muted">Rows: {m.home_name} goals · Columns: {m.away_name} goals</p>
              <div className="overflow-x-auto">
                <table className="mx-auto text-center text-xs">
                  <thead><tr><th className="p-1" />{grid[0].map((_, a) => <th key={a} className="p-1 text-muted">{a}</th>)}</tr></thead>
                  <tbody>
                    {grid.map((row, h) => (
                      <tr key={h}>
                        <th className="p-1 text-muted">{h}</th>
                        {row.map((p, a) => (
                          <td key={a} className="p-0.5">
                            <div className={`flex h-10 w-12 items-center justify-center rounded-md font-semibold ${m.home_goals === h && m.away_goals === a && finished ? "ring-2 ring-gold" : ""}`}
                              style={{ background: `rgba(18,209,142,${(p / gridMax) * 0.85})`, color: p / gridMax > 0.5 ? "#06101e" : "#cbd5e1" }}>
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

function PickCard({ title, pick, prob, won, extra, gold }: { title: string; pick: string; prob: number; won: boolean | null; extra?: React.ReactNode; gold?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between"><span className="label mb-0">{title}</span><WinLoss won={won} /></div>
      <div className={`mt-2 text-xl font-black ${gold ? "text-gold" : "text-white"}`}>{pick}</div>
      <div className="mt-2 flex items-center gap-2"><Meter value={prob} color={gold ? "bg-gold" : "bg-brand"} /><span className="text-sm font-semibold">{pct(prob, 1)}</span></div>
      {extra && <div className="mt-2 text-sm">{extra}</div>}
    </div>
  );
}

function FormList({ title, rows, teamId }: { title: string; rows: MatchRow[]; teamId?: number }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-bold text-white">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-muted">No recent matches in our database.</p>}
      <ul className="space-y-2">
        {rows.map((r) => {
          let badge = "";
          if (teamId) {
            const gf = r.home_id === teamId ? r.home_goals! : r.away_goals!;
            const ga = r.home_id === teamId ? r.away_goals! : r.home_goals!;
            badge = gf > ga ? "W" : gf < ga ? "L" : "D";
          }
          return (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              {badge && <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${badge === "W" ? "bg-brand/20 text-brand" : badge === "L" ? "bg-loss/20 text-loss" : "bg-slate-600/30 text-slate-300"}`}>{badge}</span>}
              <span className="truncate">{r.home_name}</span>
              <b className="shrink-0 text-white">{r.home_goals}-{r.away_goals}</b>
              <span className="truncate">{r.away_name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted"><LocalTime iso={r.kickoff} mode="date" /></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
