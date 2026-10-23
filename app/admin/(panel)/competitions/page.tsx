import { q } from "@/lib/db";
import type { CompetitionRow } from "@/lib/services/sync";
import { addCompetitionAction, toggleCompetition, updateCompetition } from "../../actions";
import { Flash } from "@/components/Flash";
import { TeamLogo } from "@/components/ui";

export default async function CompetitionsAdmin({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const comps = await q<CompetitionRow & { fixtures: number; finished: number }>(`
    SELECT c.*, COUNT(f.id)::int AS fixtures, COUNT(f.id) FILTER (WHERE f.status IN ('FT','AET','PEN'))::int AS finished
    FROM competitions c LEFT JOIN fixtures f ON f.competition_id = c.id
    GROUP BY c.id ORDER BY c.priority, c.name`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Competitions</h1>
        <p className="text-sm text-muted">Enable/disable coverage, set display order and neutral-venue handling. Women&apos;s and youth competitions are blocked automatically.</p>
      </div>
      <Flash msg={sp.msg} error={sp.error} />

      <div className="card p-5">
        <h2 className="font-bold text-white">Add a competition</h2>
        <form action={addCompetitionAction} className="mt-3 flex flex-wrap items-end gap-3">
          <div><label className="label">API-Football league id</label><input name="id" type="number" required className="input w-48" placeholder="e.g. 218" /></div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input w-40"><option value="domestic">Domestic</option><option value="uefa">UEFA</option><option value="fifa">FIFA / intl</option></select>
          </div>
          <button className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table min-w-[980px]">
          <thead><tr><th>Competition</th><th>Category · data · current season · order · neutral venue</th><th>Status</th></tr></thead>
          <tbody>
            {comps.map((c) => (
              <tr key={c.id} className={c.enabled ? "" : "opacity-50"}>
                <td>
                  <div className="flex items-center gap-2">
                    <TeamLogo src={c.logo} name={c.name} size={22} />
                    <div><div className="font-semibold text-white">{c.name}</div><div className="text-xs text-muted">#{c.id} · {c.country}{c.is_national ? " · national teams" : ""}</div></div>
                  </div>
                </td>
                <td>
                  <form action={updateCompetition} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <select name="category" defaultValue={c.category} className="input w-28 py-1"><option value="domestic">Domestic</option><option value="uefa">UEFA</option><option value="fifa">FIFA</option></select>
                    <span className="w-36 text-xs text-muted">{c.fixtures} fixtures<br />{c.finished} finished</span>
                    <input name="current_season" type="number" defaultValue={c.current_season ?? ""} className="input w-24 py-1" placeholder="year" />
                    <input name="priority" type="number" defaultValue={c.priority} className="input w-20 py-1" />
                    <input name="neutral" type="checkbox" defaultChecked={c.neutral} className="h-4 w-4 accent-[var(--color-brand)]" title="Matches played at neutral venues" />
                    <button className="btn btn-ghost px-3 py-1 text-xs">Save</button>
                  </form>
                </td>
                <td>
                  <form action={toggleCompetition}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={`chip ${c.enabled ? "chip-active" : ""}`}>{c.enabled ? "Enabled" : "Disabled"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
