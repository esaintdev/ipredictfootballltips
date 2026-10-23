import { q } from "../db";
import { apiGet, type ApiFixture, type ApiLeague } from "../api/football";
import { EXCLUDED_NAME } from "../competitions";
import { siteSettings } from "../settings";

export interface CompetitionRow {
  id: number;
  slug: string;
  name: string;
  country: string;
  category: string;
  type: string;
  is_national: boolean;
  neutral: boolean;
  logo: string | null;
  flag: string | null;
  current_season: number | null;
  enabled: boolean;
  priority: number;
  last_synced_at: string | null;
}

export async function enabledCompetitions() {
  return q<CompetitionRow>("SELECT * FROM competitions WHERE enabled ORDER BY priority, name");
}

/** One API call: refreshes logos, flags and current season for every competition we track. */
export async function syncCompetitionMeta() {
  const leagues = await apiGet<ApiLeague>("/leagues");
  const byId = new Map(leagues.map((l) => [l.league.id, l]));
  const comps = await q<CompetitionRow>("SELECT * FROM competitions");
  let n = 0;
  for (const c of comps) {
    const l = byId.get(c.id);
    if (!l) continue;
    const seasons = [...l.seasons].sort((a, b) => b.year - a.year);
    const current = seasons.find((s) => s.current) ?? seasons[0];
    await q("UPDATE competitions SET logo=$2, flag=$3, current_season=$4 WHERE id=$1", [c.id, l.league.logo, l.country.flag, current?.year ?? null]);
    n++;
  }
  return { message: `Updated metadata for ${n} competitions` };
}

/** Adds a competition by API-Football id (rejects women's / youth competitions). */
export async function addCompetition(id: number, category: string) {
  const [l] = await apiGet<ApiLeague>("/leagues", { id });
  if (!l) throw new Error(`League ${id} not found on API-Football`);
  if (EXCLUDED_NAME.test(l.league.name)) throw new Error(`"${l.league.name}" looks like a women's or youth competition and is excluded.`);
  const seasons = [...l.seasons].sort((a, b) => b.year - a.year);
  const current = seasons.find((s) => s.current) ?? seasons[0];
  const slug = `${l.league.name}-${l.country.name}`.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-");
  await q(
    `INSERT INTO competitions(id, slug, name, country, category, type, is_national, logo, flag, current_season, priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,200)
     ON CONFLICT (id) DO UPDATE SET enabled = TRUE`,
    [id, slug, l.league.name, l.country.name, category, l.league.type.toLowerCase() === "cup" ? "cup" : "league",
      l.country.name === "World" && category !== "domestic", l.league.logo, l.country.flag, current?.year ?? null],
  );
  return l.league.name;
}

async function upsertFixtures(all: ApiFixture[], allowed: Set<number>) {
  const list = all.filter((f) => allowed.has(f.league.id));
  for (let i = 0; i < list.length; i += 500) {
    const chunk = list.slice(i, i + 500);
    const teams = new Map<number, { name: string; logo: string | null }>();
    for (const f of chunk) for (const t of [f.teams.home, f.teams.away]) teams.set(t.id, { name: t.name, logo: t.logo ?? null });
    await q(
      `INSERT INTO teams(id, name, logo) SELECT * FROM unnest($1::int[], $2::text[], $3::text[])
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = COALESCE(EXCLUDED.logo, teams.logo)`,
      [[...teams.keys()], [...teams.values()].map((t) => t.name), [...teams.values()].map((t) => t.logo)],
    );
    // Regular-time score is what markets settle on; API "goals" includes extra time.
    const goals = (f: ApiFixture, side: "home" | "away") => {
      const ft = f.score?.fulltime?.[side];
      return ft != null ? ft : f.goals[side];
    };
    await q(
      `INSERT INTO fixtures(id, competition_id, season, round, kickoff, status, home_team_id, away_team_id, home_goals, away_goals, venue)
       SELECT * FROM unnest($1::int[], $2::int[], $3::int[], $4::text[], $5::timestamptz[], $6::text[], $7::int[], $8::int[], $9::int[], $10::int[], $11::text[])
       ON CONFLICT (id) DO UPDATE SET round=EXCLUDED.round, kickoff=EXCLUDED.kickoff, status=EXCLUDED.status,
         home_goals=EXCLUDED.home_goals, away_goals=EXCLUDED.away_goals, venue=EXCLUDED.venue, updated_at=NOW()`,
      [
        chunk.map((f) => f.fixture.id), chunk.map((f) => f.league.id), chunk.map((f) => f.league.season),
        chunk.map((f) => f.league.round ?? null), chunk.map((f) => f.fixture.date), chunk.map((f) => f.fixture.status.short),
        chunk.map((f) => f.teams.home.id), chunk.map((f) => f.teams.away.id),
        chunk.map((f) => goals(f, "home")), chunk.map((f) => goals(f, "away")), chunk.map((f) => f.fixture.venue?.name ?? null),
      ],
    );
  }
  return list.length;
}

async function markNationalTeams() {
  await q(`UPDATE teams SET is_national = TRUE WHERE id IN (
    SELECT home_team_id FROM fixtures f JOIN competitions c ON c.id=f.competition_id WHERE c.is_national
    UNION SELECT away_team_id FROM fixtures f JOIN competitions c ON c.id=f.competition_id WHERE c.is_national)`);
}

/** Full season import for one competition (one API call). Used for history + backtests. */
export async function syncSeason(competitionId: number, season: number) {
  const list = await apiGet<ApiFixture>("/fixtures", { league: competitionId, season });
  const n = await upsertFixtures(list, new Set([competitionId]));
  await q("UPDATE competitions SET last_synced_at=NOW() WHERE id=$1", [competitionId]);
  return n;
}

/** Imports the last `seasons` seasons for each enabled competition. */
export async function importHistory(seasons: number, onlyIds?: number[]) {
  const comps = (await enabledCompetitions()).filter((c) => !onlyIds?.length || onlyIds.includes(c.id));
  let total = 0;
  const errors: string[] = [];
  for (const c of comps) {
    const cur = c.current_season ?? new Date().getUTCFullYear();
    for (let s = cur; s > cur - seasons; s--) {
      try {
        total += await syncSeason(c.id, s);
      } catch (e) {
        errors.push(`${c.name} ${s}: ${(e as Error).message}`);
      }
    }
  }
  await markNationalTeams();
  return { message: `Imported ${total} fixtures from ${comps.length} competitions${errors.length ? `; ${errors.length} errors: ${errors.slice(0, 3).join(" | ")}` : ""}` };
}

/**
 * Day-by-day sync of the rolling window (yesterday-2 … today+horizon). Costs one call
 * per day regardless of how many competitions are enabled, which keeps us inside quota.
 */
export async function syncWindow(daysBack = 2) {
  const { horizonDays } = await siteSettings();
  const allowed = new Set((await enabledCompetitions()).map((c) => c.id));
  let n = 0;
  for (let d = -daysBack; d <= horizonDays; d++) {
    const date = new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
    const list = await apiGet<ApiFixture>("/fixtures", { date });
    n += await upsertFixtures(list, allowed);
  }
  await markNationalTeams();
  return { message: `Synced ${n} fixtures for ${daysBack + horizonDays + 1} days` };
}
