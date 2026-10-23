import { q, q1 } from "./db";
import { FINISHED } from "./api/football";
import type { CompetitionRow } from "./services/sync";

export interface MatchRow {
  id: number;
  kickoff: string;
  status: string;
  round: string | null;
  venue: string | null;
  season: number;
  home_goals: number | null;
  away_goals: number | null;
  home_id: number; home_name: string; home_logo: string | null;
  away_id: number; away_name: string; away_logo: string | null;
  comp_id: number; comp_name: string; comp_slug: string; comp_logo: string | null; comp_flag: string | null; comp_country: string; comp_priority: number;
  // prediction (null when none)
  p_home: number | null; p_draw: number | null; p_away: number | null;
  exp_home: number | null; exp_away: number | null; rho: number | null;
  p_over: Record<string, number> | null; p_btts: number | null;
  top_scores: { score: string; p: number }[] | null;
  pick_1x2: string | null; pick_ou: string | null; pick_score: string | null; pick_btts: boolean | null;
  confidence: number | null; is_featured: boolean | null; is_published: boolean | null; admin_note: string | null;
  won_1x2: boolean | null; won_ou: boolean | null; won_score: boolean | null; won_btts: boolean | null;
  has_override: boolean | null;
}

const SELECT = /* sql */ `
  SELECT f.id, f.kickoff, f.status, f.round, f.venue, f.season, f.home_goals, f.away_goals,
    ht.id AS home_id, ht.name AS home_name, ht.logo AS home_logo,
    at.id AS away_id, at.name AS away_name, at.logo AS away_logo,
    c.id AS comp_id, c.name AS comp_name, c.slug AS comp_slug, c.logo AS comp_logo, c.flag AS comp_flag, c.country AS comp_country, c.priority AS comp_priority,
    p.p_home, p.p_draw, p.p_away, p.exp_home, p.exp_away, p.rho, p.p_over, p.p_btts, p.top_scores,
    COALESCE(p.override_1x2, p.pick_1x2) AS pick_1x2, COALESCE(p.override_ou, p.pick_ou) AS pick_ou,
    COALESCE(p.override_score, p.pick_score) AS pick_score, p.pick_btts, p.confidence, p.is_featured, p.is_published, p.admin_note,
    p.won_1x2, p.won_ou, p.won_score, p.won_btts,
    (p.override_1x2 IS NOT NULL OR p.override_ou IS NOT NULL OR p.override_score IS NOT NULL) AS has_override
  FROM fixtures f
  JOIN competitions c ON c.id = f.competition_id
  JOIN teams ht ON ht.id = f.home_team_id
  JOIN teams at ON at.id = f.away_team_id
  LEFT JOIN predictions p ON p.fixture_id = f.id`;

/** Published predictions for one UTC day. */
export async function predictionsForDay(day: string, compSlug?: string) {
  return q<MatchRow>(
    `${SELECT} WHERE c.enabled AND p.is_published AND f.kickoff >= ($1::date)::timestamp AT TIME ZONE 'UTC' AND f.kickoff < ($1::date + 1)::timestamp AT TIME ZONE 'UTC'
       AND ($2::text IS NULL OR c.slug = $2)
     ORDER BY c.priority, c.name, f.kickoff`,
    [day, compSlug ?? null],
  );
}

export async function featuredTips(limit = 6) {
  return q<MatchRow>(
    `${SELECT} WHERE c.enabled AND p.is_published AND p.is_featured AND f.kickoff > NOW() - interval '2 hours'
     ORDER BY f.kickoff LIMIT $1`,
    [limit],
  );
}

export async function upcomingTop(limit = 12) {
  return q<MatchRow>(
    `${SELECT} WHERE c.enabled AND p.is_published AND f.kickoff > NOW() AND f.kickoff < NOW() + interval '3 days'
     ORDER BY GREATEST(p.p_home, p.p_draw, p.p_away) DESC LIMIT $1`,
    [limit],
  );
}

export async function matchById(id: number) {
  return q1<MatchRow>(`${SELECT} WHERE f.id = $1`, [id]);
}

export async function teamForm(teamId: number, before: string, n = 5) {
  return q<MatchRow>(
    `${SELECT} WHERE (f.home_team_id = $1 OR f.away_team_id = $1) AND f.kickoff < $2 AND f.status = ANY($3)
     ORDER BY f.kickoff DESC LIMIT $4`,
    [teamId, before, FINISHED, n],
  );
}

export async function headToHead(a: number, b: number, before: string, n = 6) {
  return q<MatchRow>(
    `${SELECT} WHERE ((f.home_team_id = $1 AND f.away_team_id = $2) OR (f.home_team_id = $2 AND f.away_team_id = $1))
       AND f.kickoff < $3 AND f.status = ANY($4) ORDER BY f.kickoff DESC LIMIT $5`,
    [a, b, before, FINISHED, n],
  );
}

export async function settledForDay(day: string) {
  return q<MatchRow>(
    `${SELECT} WHERE p.is_published AND p.settled_at IS NOT NULL AND f.kickoff >= ($1::date)::timestamp AT TIME ZONE 'UTC' AND f.kickoff < ($1::date + 1)::timestamp AT TIME ZONE 'UTC'
     ORDER BY c.priority, f.kickoff`,
    [day],
  );
}

export async function competitions(enabledOnly = true) {
  return q<CompetitionRow & { upcoming: number }>(
    `SELECT c.*, (SELECT COUNT(*)::int FROM fixtures f WHERE f.competition_id = c.id AND f.kickoff > NOW() AND f.kickoff < NOW() + interval '14 days') AS upcoming
     FROM competitions c WHERE ($1::boolean = FALSE OR c.enabled) ORDER BY c.priority, c.name`,
    [enabledOnly],
  );
}

export async function competitionBySlug(slug: string) {
  return q1<CompetitionRow>("SELECT * FROM competitions WHERE slug = $1 AND enabled", [slug]);
}

export async function competitionFixtures(compId: number, upcoming: boolean, limit = 30) {
  return q<MatchRow>(
    upcoming
      ? `${SELECT} WHERE c.id = $1 AND f.kickoff > NOW() - interval '2 hours' AND f.status IN ('NS','TBD','1H','HT','2H') ORDER BY f.kickoff LIMIT $2`
      : `${SELECT} WHERE c.id = $1 AND f.status = ANY($3) ORDER BY f.kickoff DESC LIMIT $2`,
    upcoming ? [compId, limit] : [compId, limit, FINISHED],
  );
}

export interface StandingRow { team_id: number; name: string; logo: string | null; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: string }

/** League table computed from stored results (league-format competitions only). */
export async function standings(compId: number, season: number): Promise<StandingRow[]> {
  const rows = await q<{ home_team_id: number; away_team_id: number; home_goals: number; away_goals: number; hn: string; an: string; hl: string | null; al: string | null }>(
    `SELECT f.home_team_id, f.away_team_id, f.home_goals, f.away_goals, ht.name AS hn, at.name AS an, ht.logo AS hl, at.logo AS al
     FROM fixtures f JOIN teams ht ON ht.id=f.home_team_id JOIN teams at ON at.id=f.away_team_id
     WHERE f.competition_id=$1 AND f.season=$2 AND f.status = ANY($3) AND (f.round IS NULL OR f.round ILIKE 'Regular Season%')
     ORDER BY f.kickoff`,
    [compId, season, FINISHED],
  );
  const t = new Map<number, StandingRow>();
  const get = (id: number, name: string, logo: string | null) => {
    if (!t.has(id)) t.set(id, { team_id: id, name, logo, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: "" });
    return t.get(id)!;
  };
  for (const r of rows) {
    const h = get(r.home_team_id, r.hn, r.hl), a = get(r.away_team_id, r.an, r.al);
    h.p++; a.p++; h.gf += r.home_goals; h.ga += r.away_goals; a.gf += r.away_goals; a.ga += r.home_goals;
    if (r.home_goals > r.away_goals) { h.w++; a.l++; h.pts += 3; h.form += "W"; a.form += "L"; }
    else if (r.home_goals < r.away_goals) { a.w++; h.l++; a.pts += 3; h.form += "L"; a.form += "W"; }
    else { h.d++; a.d++; h.pts++; a.pts++; h.form += "D"; a.form += "D"; }
  }
  return [...t.values()]
    .map((r) => ({ ...r, form: r.form.slice(-5) }))
    .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.name.localeCompare(y.name));
}

export interface RecordStats { n: number; w1x2: number; wou: number; wscore: number; wbtts: number }

export async function trackRecord(days?: number) {
  const where = days ? `AND f.kickoff > NOW() - ($1 || ' days')::interval` : "";
  const params = days ? [String(days)] : [];
  const overall = await q1<RecordStats>(
    `SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE won_1x2)::int AS w1x2, COUNT(*) FILTER (WHERE won_ou)::int AS wou,
            COUNT(*) FILTER (WHERE won_score)::int AS wscore, COUNT(*) FILTER (WHERE won_btts)::int AS wbtts
     FROM predictions p JOIN fixtures f ON f.id = p.fixture_id WHERE p.settled_at IS NOT NULL AND p.is_published ${where}`,
    params,
  );
  const byComp = await q<RecordStats & { name: string; slug: string }>(
    `SELECT c.name, c.slug, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE won_1x2)::int AS w1x2, COUNT(*) FILTER (WHERE won_ou)::int AS wou,
            COUNT(*) FILTER (WHERE won_score)::int AS wscore, COUNT(*) FILTER (WHERE won_btts)::int AS wbtts
     FROM predictions p JOIN fixtures f ON f.id = p.fixture_id JOIN competitions c ON c.id = f.competition_id
     WHERE p.settled_at IS NOT NULL AND p.is_published ${where}
     GROUP BY c.name, c.slug, c.priority ORDER BY c.priority`,
    params,
  );
  const featured = await q1<RecordStats>(
    `SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE won_1x2)::int AS w1x2, COUNT(*) FILTER (WHERE won_ou)::int AS wou,
            COUNT(*) FILTER (WHERE won_score)::int AS wscore, COUNT(*) FILTER (WHERE won_btts)::int AS wbtts
     FROM predictions p JOIN fixtures f ON f.id = p.fixture_id WHERE p.settled_at IS NOT NULL AND p.is_published AND p.is_featured ${where}`,
    params,
  );
  return { overall: overall!, byComp, featured: featured! };
}
