import { q } from "../db";
import { FINISHED } from "../api/football";
import { makePicks, outcomeOf } from "../model/picks";
import { fitModel, predictMatch, type HistMatch, type ModelParams } from "../model/ratings";
import { modelParams, siteSettings } from "../settings";

export const MODEL_VERSION = "dc-poisson-1.0";

interface HistRow { kickoff: Date; home_team_id: number; away_team_id: number; home_goals: number; away_goals: number; neutral: boolean; competition_id: number; competition: string; season: number }

/** Every finished match in the database, oldest first. */
export async function loadHistory(maxAgeDays: number): Promise<(HistMatch & { competitionId: number; competition: string; season: number })[]> {
  const rows = await q<HistRow>(
    `SELECT f.kickoff, f.home_team_id, f.away_team_id, f.home_goals, f.away_goals, c.neutral, f.competition_id, c.name AS competition, f.season
     FROM fixtures f JOIN competitions c ON c.id = f.competition_id
     WHERE f.status = ANY($1) AND f.home_goals IS NOT NULL AND f.away_goals IS NOT NULL
       AND f.kickoff > NOW() - ($2 || ' days')::interval
     ORDER BY f.kickoff`,
    [FINISHED, String(maxAgeDays + 400)],
  );
  return rows.map((r) => ({
    date: new Date(r.kickoff).getTime(),
    home: String(r.home_team_id),
    away: String(r.away_team_id),
    hg: r.home_goals,
    ag: r.away_goals,
    neutral: r.neutral,
    competitionId: r.competition_id,
    competition: r.competition,
    season: r.season,
  }));
}

/** Freezes predictions at kickoff so the public track record can't be rewritten. */
export async function lockStarted() {
  await q(`UPDATE predictions p SET locked = TRUE FROM fixtures f WHERE f.id = p.fixture_id AND NOT p.locked AND f.kickoff <= NOW()`);
}

export async function generatePredictions(opts: { params?: ModelParams; fixtureIds?: number[] } = {}) {
  await lockStarted();
  const params = opts.params ?? (await modelParams());
  const site = await siteSettings();
  const history = await loadHistory(params.maxAgeDays);
  const model = fitModel(history, Date.now(), params);

  const games = new Map<string, number>();
  for (const m of history) { games.set(m.home, (games.get(m.home) ?? 0) + 1); games.set(m.away, (games.get(m.away) ?? 0) + 1); }

  const upcoming = await q<{ id: number; kickoff: Date; home_team_id: number; away_team_id: number; neutral: boolean }>(
    `SELECT f.id, f.kickoff, f.home_team_id, f.away_team_id, c.neutral
     FROM fixtures f JOIN competitions c ON c.id = f.competition_id
     LEFT JOIN predictions p ON p.fixture_id = f.id
     WHERE c.enabled AND f.status IN ('NS','TBD') AND f.kickoff > NOW()
       AND f.kickoff < NOW() + ($1 || ' days')::interval
       AND (p.fixture_id IS NULL OR NOT p.locked)
       AND ($2::int[] IS NULL OR f.id = ANY($2))`,
    [String(site.horizonDays), opts.fixtureIds?.length ? opts.fixtureIds : null],
  );

  let created = 0;
  for (const f of upcoming) {
    const h = String(f.home_team_id), a = String(f.away_team_id);
    const mk = predictMatch(model, h, a, f.neutral);
    const pk = makePicks(mk);
    // Too little data on either side → keep it as a draft for an admin to review.
    const enoughData = (games.get(h) ?? 0) >= 5 && (games.get(a) ?? 0) >= 5;
    const publish = site.autoPublish && enoughData;
    await q(
      `INSERT INTO predictions(fixture_id, model_version, p_home, p_draw, p_away, exp_home, exp_away, rho, p_over, p_btts, top_scores,
         pick_1x2, pick_ou, pick_score, pick_btts, confidence, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$17,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (fixture_id) DO UPDATE SET model_version=EXCLUDED.model_version, p_home=EXCLUDED.p_home, p_draw=EXCLUDED.p_draw,
         p_away=EXCLUDED.p_away, exp_home=EXCLUDED.exp_home, exp_away=EXCLUDED.exp_away, rho=EXCLUDED.rho, p_over=EXCLUDED.p_over, p_btts=EXCLUDED.p_btts,
         top_scores=EXCLUDED.top_scores, pick_1x2=EXCLUDED.pick_1x2, pick_ou=EXCLUDED.pick_ou, pick_score=EXCLUDED.pick_score,
         pick_btts=EXCLUDED.pick_btts, confidence=EXCLUDED.confidence, updated_at=NOW()
       WHERE NOT predictions.locked`,
      [f.id, MODEL_VERSION, mk.home, mk.draw, mk.away, mk.expHome, mk.expAway, JSON.stringify(mk.over), mk.btts,
        JSON.stringify(mk.topScores), pk.pick1x2, pk.pickOu, pk.pickScore, pk.pickBtts, pk.confidence, publish, model.rho],
    );
    created++;
  }
  const featured = await autoFeature(site.featuredMinProb, site.maxFeaturedPerDay);
  return { message: `Generated ${created} predictions from ${history.length} matches (home adv ${model.homeAdv.toFixed(2)}, rho ${model.rho}); ${featured} auto-featured` };
}

/** Marks the most confident published tips of each day as featured (only touches days with no manual picks). */
async function autoFeature(minProb: number, perDay: number) {
  const rows = await q<{ fixture_id: number }>(
    `WITH ranked AS (
       SELECT p.fixture_id, (f.kickoff AT TIME ZONE 'UTC')::date AS d,
              ROW_NUMBER() OVER (PARTITION BY (f.kickoff AT TIME ZONE 'UTC')::date ORDER BY GREATEST(p.p_home, p.p_draw, p.p_away) DESC) AS rn
       FROM predictions p JOIN fixtures f ON f.id = p.fixture_id
       WHERE NOT p.locked AND p.is_published AND f.kickoff > NOW() AND GREATEST(p.p_home, p.p_draw, p.p_away) >= $1
     )
     UPDATE predictions p SET is_featured = TRUE FROM ranked r
     WHERE r.fixture_id = p.fixture_id AND r.rn <= $2 AND NOT p.is_featured
       AND NOT EXISTS (SELECT 1 FROM settings s WHERE s.key = 'manual_featured_' || r.d::text)
     RETURNING p.fixture_id`,
    [minProb, perDay],
  );
  return rows.length;
}

/** Grades predictions for finished matches. Admin overrides count as the published pick. */
export async function settlePredictions() {
  const rows = await q<{ fixture_id: number; home_goals: number; away_goals: number; pick_1x2: string; pick_ou: string; pick_score: string; pick_btts: boolean; override_1x2: string | null; override_ou: string | null; override_score: string | null }>(
    `SELECT p.fixture_id, f.home_goals, f.away_goals, p.pick_1x2, p.pick_ou, p.pick_score, p.pick_btts, p.override_1x2, p.override_ou, p.override_score
     FROM predictions p JOIN fixtures f ON f.id = p.fixture_id
     WHERE p.settled_at IS NULL AND f.status = ANY($1) AND f.home_goals IS NOT NULL`,
    [FINISHED],
  );
  for (const r of rows) {
    const out = outcomeOf(r.home_goals, r.away_goals);
    const total = r.home_goals + r.away_goals;
    const ou = r.override_ou ?? r.pick_ou;
    await q(
      `UPDATE predictions SET won_1x2=$2, won_ou=$3, won_score=$4, won_btts=$5, settled_at=NOW(), locked=TRUE WHERE fixture_id=$1`,
      [r.fixture_id, (r.override_1x2 ?? r.pick_1x2) === out, ou === "over" ? total > 2.5 : total < 2.5,
        (r.override_score ?? r.pick_score) === `${r.home_goals}-${r.away_goals}`, r.pick_btts === (r.home_goals > 0 && r.away_goals > 0)],
    );
  }
  // Void predictions on cancelled / abandoned fixtures
  await q(`UPDATE predictions p SET is_published = FALSE FROM fixtures f WHERE f.id = p.fixture_id AND f.status IN ('CANC','ABD','AWD','WO') AND p.settled_at IS NULL`);
  return { message: `Settled ${rows.length} predictions` };
}
