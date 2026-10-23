import Link from "next/link";
import { q } from "@/lib/db";
import type { MatchRow } from "@/lib/queries";
import { bulkPublish, regeneratePrediction, updatePrediction } from "../../actions";
import { Flash } from "@/components/Flash";
import { LocalTime, ProbBar, TeamLogo, pct } from "@/components/ui";

type Row = MatchRow & { raw_1x2: string; raw_ou: string; raw_score: string; override_1x2: string | null; override_ou: string | null; override_score: string | null; locked: boolean };

export default async function PredictionsAdmin({ searchParams }: { searchParams: Promise<{ date?: string; msg?: string; error?: string; filter?: string }> }) {
  const sp = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : new Date().toISOString().slice(0, 10);
  const filter = sp.filter ?? "all";
  const rows = await q<Row>(
    `SELECT f.id, f.kickoff, f.status, f.home_goals, f.away_goals, ht.name AS home_name, ht.logo AS home_logo, at.name AS away_name, at.logo AS away_logo,
       c.name AS comp_name, c.logo AS comp_logo, p.p_home, p.p_draw, p.p_away, p.exp_home, p.exp_away, p.p_over, p.p_btts, p.top_scores,
       p.pick_1x2 AS raw_1x2, p.pick_ou AS raw_ou, p.pick_score AS raw_score, p.override_1x2, p.override_ou, p.override_score,
       p.confidence, p.is_featured, p.is_published, p.admin_note, p.won_1x2, p.won_ou, p.won_score, p.locked
     FROM predictions p JOIN fixtures f ON f.id = p.fixture_id JOIN competitions c ON c.id = f.competition_id
     JOIN teams ht ON ht.id = f.home_team_id JOIN teams at ON at.id = f.away_team_id
     WHERE f.kickoff >= ($1::date)::timestamp AT TIME ZONE 'UTC' AND f.kickoff < ($1::date + 1)::timestamp AT TIME ZONE 'UTC'
       AND ($2 = 'all' OR ($2 = 'drafts' AND NOT p.is_published) OR ($2 = 'featured' AND p.is_featured))
     ORDER BY c.priority, f.kickoff`,
    [date, filter],
  );
  const shift = (d: number) => new Date(Date.parse(date) + d * 86_400_000).toISOString().slice(0, 10);
  const ret = `/admin/predictions?date=${date}&filter=${filter}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Predictions</h1>
          <p className="text-sm text-muted">Review, override, feature and publish tips. Predictions lock at kick-off.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?date=${shift(-1)}&filter=${filter}`} className="btn btn-ghost">←</Link>
          <form className="flex gap-2"><input type="date" name="date" defaultValue={date} className="input w-40" /><input type="hidden" name="filter" value={filter} /><button className="btn btn-ghost">Go</button></form>
          <Link href={`?date=${shift(1)}&filter=${filter}`} className="btn btn-ghost">→</Link>
        </div>
      </div>
      <Flash msg={sp.msg} error={sp.error} />
      <div className="flex flex-wrap items-center gap-2">
        {["all", "drafts", "featured"].map((f) => <Link key={f} href={`?date=${date}&filter=${f}`} className={`chip ${filter === f ? "chip-active" : ""}`}>{f}</Link>)}
        <span className="ml-auto text-sm text-muted">{rows.length} predictions</span>
        <form action={bulkPublish}><input type="hidden" name="date" value={date} /><input type="hidden" name="publish" value="1" /><button className="btn btn-ghost">Publish all</button></form>
        <form action={bulkPublish}><input type="hidden" name="date" value={date} /><input type="hidden" name="publish" value="0" /><button className="btn btn-ghost">Unpublish all</button></form>
      </div>

      {rows.length === 0 && <div className="card p-8 text-center text-muted">No predictions for this day.</div>}
      <div className="space-y-3">
        {rows.map((m) => {
          const locked = m.locked;
          return (
            <details key={m.id} className="card group">
              <summary className="grid cursor-pointer list-none grid-cols-[4rem_1fr_auto] items-center gap-4 p-4 sm:grid-cols-[4rem_1fr_14rem_auto]">
                <span className="text-sm font-semibold"><LocalTime iso={m.kickoff} /></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted"><TeamLogo src={m.comp_logo} name={m.comp_name} size={14} />{m.comp_name}</div>
                  <div className="truncate font-semibold text-white">{m.home_name} vs {m.away_name} {m.home_goals != null && <span className="text-gold">({m.home_goals}-{m.away_goals})</span>}</div>
                </div>
                <div className="hidden sm:block"><ProbBar home={m.p_home!} draw={m.p_draw!} away={m.p_away!} /></div>
                <div className="flex items-center gap-1.5">
                  {m.is_featured && <span className="chip border-gold text-gold">★</span>}
                  {(m.override_1x2 || m.override_ou || m.override_score) && <span className="chip border-gold text-gold">override</span>}
                  <span className={`chip ${m.is_published ? "chip-active" : ""}`}>{m.is_published ? "live" : "draft"}</span>
                  {locked && <span className="chip">🔒</span>}
                </div>
              </summary>
              <div className="border-t border-line p-4">
                <div className="mb-4 grid gap-3 text-xs text-muted sm:grid-cols-4">
                  <div>Model 1X2: <b className="text-white">{m.raw_1x2}</b> ({pct(Math.max(m.p_home!, m.p_draw!, m.p_away!), 1)})</div>
                  <div>Model O/U 2.5: <b className="text-white">{m.raw_ou}</b> (O {pct(m.p_over!["2.5"], 1)})</div>
                  <div>Model score: <b className="text-white">{m.raw_score}</b> · BTTS {pct(m.p_btts, 0)}</div>
                  <div>xG {m.exp_home!.toFixed(2)} – {m.exp_away!.toFixed(2)}</div>
                </div>
                <form action={updatePrediction} className="grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="fixture_id" value={m.id} /><input type="hidden" name="return" value={ret} />
                  <div><label className="label">Override 1X2</label>
                    <select name="override_1x2" defaultValue={m.override_1x2 ?? ""} className="input" disabled={locked}><option value="">Model ({m.raw_1x2})</option><option value="1">1 – Home</option><option value="X">X – Draw</option><option value="2">2 – Away</option></select></div>
                  <div><label className="label">Override O/U 2.5</label>
                    <select name="override_ou" defaultValue={m.override_ou ?? ""} className="input" disabled={locked}><option value="">Model ({m.raw_ou})</option><option value="over">Over</option><option value="under">Under</option></select></div>
                  <div><label className="label">Override score</label><input name="override_score" defaultValue={m.override_score ?? ""} placeholder={m.raw_score} pattern="\d{1,2}-\d{1,2}" className="input" disabled={locked} /></div>
                  <div className="flex items-end gap-4 pb-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={!!m.is_featured} disabled={locked} /> Featured</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="is_published" defaultChecked={!!m.is_published} disabled={locked} /> Published</label>
                  </div>
                  <div className="sm:col-span-4"><label className="label">Analyst note (shown on match page)</label><textarea name="admin_note" defaultValue={m.admin_note ?? ""} rows={2} className="input" disabled={locked} /></div>
                  <div className="flex gap-2 sm:col-span-4">
                    <button className="btn btn-primary" disabled={locked}>Save</button>
                    <Link href={`/match/${m.id}`} target="_blank" className="btn btn-ghost">View public page ↗</Link>
                  </div>
                </form>
                {!locked && (
                  <form action={regeneratePrediction} className="mt-2">
                    <input type="hidden" name="fixture_id" value={m.id} /><input type="hidden" name="return" value={ret} />
                    <button className="text-xs text-brand hover:underline">Regenerate this prediction with the latest model</button>
                  </form>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
