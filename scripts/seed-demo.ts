/**
 * Demo data loader – fills the database from public openfootball results so the site can be
 * explored without an API-Football key. Demo rows use negative ids and never clash with API data.
 *
 *   npm run seed:demo            # load demo data, predict upcoming games
 *   npm run seed:demo -- --clear # remove all demo data
 *
 * Played matches from the last 30 days also get walk-forward predictions (fitted only on
 * earlier results) and are graded, so the results/accuracy pages have something to show.
 */
import { ensureSchema, q } from "../lib/db";
import { generatePredictions, settlePredictions, MODEL_VERSION } from "../lib/services/predict";
import { fitModel, predictMatch, type HistMatch } from "../lib/model/ratings";
import { makePicks } from "../lib/model/picks";
import { modelParams } from "../lib/settings";

const FILES: Record<string, number> = {
  "en.1": 39, "es.1": 140, "de.1": 78, "it.1": 135, "fr.1": 61, "nl.1": 88, "pt.1": 94,
  "en.2": 40, "sco.1": 179, "tr.1": 203, "be.1": 144, "uefa.cl": 2,
};
const SEASONS = ["2023-24", "2024-25", "2025-26", "2026-27"];

function hashId(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return -((h >>> 0) % 2_000_000_000) - 1;
}
const clean = (n: string) => n.replace(/\s*\([A-Z]{3}\)\s*$/, "").trim();

async function main() {
  await ensureSchema();
  await q("DELETE FROM fixtures WHERE id < 0");
  await q("DELETE FROM teams WHERE id < 0");
  if (process.argv.includes("--clear")) { console.log("Demo data removed."); return; }

  const now = Date.now();
  const teams = new Map<string, number>();
  const fx: { id: number; comp: number; season: number; round: string; kickoff: string; status: string; h: number; a: number; hg: number | null; ag: number | null }[] = [];
  for (const season of SEASONS) {
    for (const [file, comp] of Object.entries(FILES)) {
      const res = await fetch(`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${file}.json`);
      if (!res.ok) continue;
      const data = (await res.json()) as { matches: Record<string, unknown>[] };
      for (const m of data.matches) {
        if (typeof m.date !== "string") continue;
        const sc = m.score as { ft?: number[] } | number[] | undefined;
        const ft = Array.isArray(sc) ? sc : sc?.ft;
        const kickoff = new Date(`${m.date}T${(m.time as string)?.slice(0, 5) ?? "15:00"}:00Z`);
        if (isNaN(kickoff.getTime())) continue;
        const played = Boolean(ft && ft.length >= 2);
        if (!played && kickoff.getTime() < now) continue; // unknown outcome
        const home = clean(m.team1 as string), away = clean(m.team2 as string);
        for (const t of [home, away]) if (!teams.has(t)) teams.set(t, hashId(`team:${t}`));
        fx.push({
          id: hashId(`fx:${comp}:${m.date}:${home}:${away}`), comp, season: Number(season.slice(0, 4)), round: String(m.round ?? ""),
          kickoff: kickoff.toISOString(), status: played ? "FT" : "NS", h: teams.get(home)!, a: teams.get(away)!,
          hg: played ? ft![0] : null, ag: played ? ft![1] : null,
        });
      }
    }
  }
  const unique = [...new Map(fx.map((f) => [f.id, f])).values()];
  await q(`INSERT INTO teams(id, name) SELECT * FROM unnest($1::int[], $2::text[])`, [[...teams.values()], [...teams.keys()]]);
  for (let i = 0; i < unique.length; i += 1000) {
    const c = unique.slice(i, i + 1000);
    await q(
      `INSERT INTO fixtures(id, competition_id, season, round, kickoff, status, home_team_id, away_team_id, home_goals, away_goals)
       SELECT * FROM unnest($1::int[], $2::int[], $3::int[], $4::text[], $5::timestamptz[], $6::text[], $7::int[], $8::int[], $9::int[], $10::int[])`,
      [c.map((f) => f.id), c.map((f) => f.comp), c.map((f) => f.season), c.map((f) => (/matchday/i.test(f.round) ? `Regular Season - ${f.round.replace(/\D/g, "")}` : f.round)),
        c.map((f) => f.kickoff), c.map((f) => f.status), c.map((f) => f.h), c.map((f) => f.a), c.map((f) => f.hg), c.map((f) => f.ag)],
    );
  }
  await q(`UPDATE competitions c SET current_season = s.season FROM (SELECT competition_id, MAX(season) AS season FROM fixtures GROUP BY competition_id) s WHERE s.competition_id = c.id`);
  console.log(`Loaded ${teams.size} teams and ${unique.length} fixtures.`);

  // Walk-forward predictions for the most recent month of played matches.
  const params = await modelParams();
  const played = unique.filter((f) => f.status === "FT").sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const hist: HistMatch[] = played.map((f) => ({ date: Date.parse(f.kickoff), home: String(f.h), away: String(f.a), hg: f.hg!, ag: f.ag!, neutral: false }));
  const lastPlayed = Date.parse(played[played.length - 1].kickoff);
  const recent = played.filter((f) => Date.parse(f.kickoff) > lastPlayed - 30 * 86_400_000);
  const weeks = new Map<number, typeof recent>();
  for (const f of recent) {
    const wk = Math.floor(Date.parse(f.kickoff) / (7 * 86_400_000));
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk)!.push(f);
  }
  for (const [wk, list] of weeks) {
    const model = fitModel(hist, wk * 7 * 86_400_000, params);
    for (const f of list) {
      const mk = predictMatch(model, String(f.h), String(f.a));
      const pk = makePicks(mk);
      await q(
        `INSERT INTO predictions(fixture_id, model_version, p_home, p_draw, p_away, exp_home, exp_away, rho, p_over, p_btts, top_scores,
           pick_1x2, pick_ou, pick_score, pick_btts, confidence, is_featured, locked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,TRUE) ON CONFLICT DO NOTHING`,
        [f.id, MODEL_VERSION, mk.home, mk.draw, mk.away, mk.expHome, mk.expAway, model.rho, JSON.stringify(mk.over), mk.btts,
          JSON.stringify(mk.topScores), pk.pick1x2, pk.pickOu, pk.pickScore, pk.pickBtts, pk.confidence, pk.pick1x2Prob >= 0.65],
      );
    }
  }
  console.log((await settlePredictions()).message);
  console.log((await generatePredictions()).message);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
