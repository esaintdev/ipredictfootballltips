// Public tip categories (Banker, Double Chance, Over 1.5, ...). Every tip is derived from the
// stored model probabilities, so a category is just a different view of the same prediction.
// Tips inherit the prediction's lock: probabilities are frozen at kick-off, and so are the tips.

import type { MatchRow } from "./queries";

export interface Tip {
  /** Short code shown in the tips column, e.g. "1X", "Over 2.5", "GG". */
  code: string;
  /** Longer label for cards, e.g. "Home or draw". */
  label: string;
  p: number;
  market: "1x2" | "dc" | "ou" | "btts" | "cs";
}

export interface TipRow { m: MatchRow; tip: Tip }

export type CategoryId =
  | "free" | "all" | "banker" | "two-odds" | "double-chance" | "over-1-5" | "over-2-5" | "super-single"
  | "btts" | "ou-3-5" | "draw" | "home-win" | "away-win" | "correct-score";

export interface Category {
  id: CategoryId;
  slug: string;
  /** Tab label */
  label: string;
  /** H1 / hero title */
  title: string;
  intro: string;
}

export const CATEGORIES: Category[] = [
  { id: "free", slug: "free-football-tips", label: "Free Tips", title: "Free Football Tips", intro: "Our strongest pick for each match the model is confident about, across every market." },
  { id: "all", slug: "all-predictions", label: "All Predictions", title: "All Predictions", intro: "Every match we cover today with the model's best tip, fair odds and confidence, all on one page." },
  { id: "banker", slug: "banker-of-the-day", label: "Banker Tips", title: "Banker of the Day", intro: "The day's highest-probability selections, picked purely by the numbers." },
  { id: "two-odds", slug: "2-odds-predictions", label: "Free 2 Odds", title: "2 Odds Accumulator", intro: "A short accumulator of the safest picks of the day, built to reach combined fair odds of about 2.00." },
  { id: "double-chance", slug: "double-chance-predictions", label: "Double Chance", title: "Double Chance Predictions", intro: "Home or draw (1X) and draw or away (X2) picks where the model gives the double chance 70% or more." },
  { id: "over-1-5", slug: "over-1-5-goals-predictions", label: "Over 1.5 Goals", title: "Over 1.5 Goals Predictions", intro: "Matches where our expected-goals model gives at least a 70% chance of two or more goals." },
  { id: "over-2-5", slug: "over-2-5-goals-predictions", label: "Over 2.5 Goals", title: "Over 2.5 Goals Predictions", intro: "Matches where the model expects three or more goals, ranked by probability." },
  { id: "super-single", slug: "super-single-predictions", label: "Super Single", title: "Super Single", intro: "Single bets with fair odds between 1.40 and 2.00: the best balance of probability and price today." },
  { id: "btts", slug: "btts-gg-predictions", label: "BTTS / GG", title: "Both Teams To Score (GG) Predictions", intro: "Matches where the model gives both teams at least a 55% chance of scoring." },
  { id: "ou-3-5", slug: "over-under-3-5-goals-predictions", label: "O/U 3.5 Goals", title: "Over/Under 3.5 Goals Predictions", intro: "Over or under 3.5 goals, whichever side the model gives 65% or more." },
  { id: "draw", slug: "draw-predictions", label: "Draws", title: "Draw Predictions", intro: "Evenly matched games where the draw probability is unusually high." },
  { id: "home-win", slug: "home-win-predictions", label: "Home Win", title: "Home Win Predictions", intro: "Matches where the home side is the model's pick with at least a 50% win probability." },
  { id: "away-win", slug: "away-win-predictions", label: "Away Win", title: "Away Win Predictions", intro: "Matches where the visitors are the model's pick with at least a 45% win probability." },
  { id: "correct-score", slug: "correct-score-predictions", label: "Correct Score", title: "Correct Score Predictions", intro: "The single most likely scoreline for every match, from the full Dixon-Coles score grid." },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const categoryHref = (c: Category, date?: string) => `/${c.slug}${date ? `?date=${date}` : ""}`;

export const fairOdds = (p: number) => (p > 0 ? 1 / p : 0);

/** Every tip the model can make for a match. 1X2 and O/U 2.5 respect admin overrides. */
export function candidates(m: MatchRow): Tip[] {
  if (m.p_home == null) return [];
  const ph = m.p_home, pd = m.p_draw!, pa = m.p_away!;
  const over = m.p_over ?? {};
  const out: Tip[] = [
    { code: "1", label: `${m.home_name} to win`, p: ph, market: "1x2" },
    { code: "X", label: "Draw", p: pd, market: "1x2" },
    { code: "2", label: `${m.away_name} to win`, p: pa, market: "1x2" },
    { code: "1X", label: "Home or draw", p: ph + pd, market: "dc" },
    { code: "X2", label: "Draw or away", p: pd + pa, market: "dc" },
  ];
  for (const line of ["1.5", "2.5", "3.5"]) {
    if (over[line] == null) continue;
    out.push({ code: `Over ${line}`, label: `Over ${line} goals`, p: over[line], market: "ou" });
    out.push({ code: `Under ${line}`, label: `Under ${line} goals`, p: 1 - over[line], market: "ou" });
  }
  if (m.p_btts != null) {
    out.push({ code: "GG", label: "Both teams to score", p: m.p_btts, market: "btts" });
    out.push({ code: "NG", label: "Not both teams to score", p: 1 - m.p_btts, market: "btts" });
  }
  return out;
}

/** The headline 1X2 tip (override-aware). */
export function mainTip(m: MatchRow): Tip | null {
  if (m.p_home == null || !m.pick_1x2) return null;
  const p = m.pick_1x2 === "1" ? m.p_home : m.pick_1x2 === "X" ? m.p_draw! : m.p_away!;
  return { code: m.pick_1x2, label: m.pick_1x2 === "1" ? `${m.home_name} to win` : m.pick_1x2 === "2" ? `${m.away_name} to win` : "Draw", p, market: "1x2" };
}

// Picks priced below this are too short to be useful as a "best tip" (fair odds under ~1.20).
const MAX_BEST_P = 0.83;

/** The most likely tip that still has a sensible price. Under 3.5 / Over 0.5 style near-certainties are skipped. */
export function bestTip(m: MatchRow): Tip | null {
  const c = candidates(m).filter((t) => t.p <= MAX_BEST_P);
  if (!c.length) return mainTip(m);
  return c.reduce((a, b) => (b.p > a.p ? b : a));
}

function ouTip(m: MatchRow, line: string, side: "Over" | "Under"): Tip | null {
  const o = m.p_over?.[line];
  if (o == null) return null;
  return { code: `${side} ${line}`, label: `${side} ${line} goals`, p: side === "Over" ? o : 1 - o, market: "ou" };
}

function scoreTip(m: MatchRow): Tip | null {
  if (!m.pick_score || !m.top_scores) return null;
  const p = m.top_scores.find((s) => s.score === m.pick_score)?.p ?? m.top_scores[0]?.p ?? 0;
  return { code: m.pick_score, label: `Correct score ${m.pick_score}`, p, market: "cs" };
}

const byP = (a: TipRow, b: TipRow) => b.tip.p - a.tip.p;
const byKickoff = (a: TipRow, b: TipRow) => new Date(a.m.kickoff).getTime() - new Date(b.m.kickoff).getTime();

/** Tips for one category from a day's matches. Tables are in kick-off order except ranked categories. */
export function tipsFor(id: CategoryId, rows: MatchRow[]): TipRow[] {
  const ms = rows.filter((m) => m.p_home != null);
  const map = (f: (m: MatchRow) => Tip | null) => ms.map((m) => ({ m, tip: f(m) })).filter((r): r is TipRow => r.tip != null);
  switch (id) {
    case "all":
      return map(bestTip).sort(byKickoff);
    case "free":
      return map(bestTip).filter((r) => r.tip.p >= 0.65).sort(byKickoff);
    case "banker":
      return map(bestTip).sort(byP).slice(0, 3);
    case "two-odds":
      return accumulator(map(bestTip).sort(byP), 2);
    case "double-chance":
      return map((m) => {
        const dc = candidates(m).filter((t) => t.market === "dc");
        const t = dc.reduce((a, b) => (b.p > a.p ? b : a));
        return t.p >= 0.7 && t.p <= 0.95 ? t : null;
      }).sort(byKickoff);
    case "over-1-5":
      return map((m) => ouTip(m, "1.5", "Over")).filter((r) => r.tip.p >= 0.7).sort(byKickoff);
    case "over-2-5":
      return map((m) => (m.pick_ou === "over" ? ouTip(m, "2.5", "Over") : null)).sort(byKickoff);
    case "super-single":
      return map((m) => {
        const c = candidates(m).filter((t) => t.p >= 0.5 && t.p <= 1 / 1.4);
        return c.length ? c.reduce((a, b) => (b.p > a.p ? b : a)) : null;
      }).sort(byP).slice(0, 3);
    case "btts":
      return map((m) => (m.p_btts != null && m.p_btts >= 0.55 ? { code: "GG", label: "Both teams to score", p: m.p_btts, market: "btts" as const } : null)).sort(byKickoff);
    case "ou-3-5":
      return map((m) => {
        const o = m.p_over?.["3.5"];
        if (o == null) return null;
        const t = ouTip(m, "3.5", o >= 0.5 ? "Over" : "Under")!;
        return t.p >= 0.65 ? t : null;
      }).sort(byKickoff);
    case "draw":
      return map((m) => (m.pick_1x2 === "X" || m.p_draw! >= 0.28 ? { code: "X", label: "Draw", p: m.p_draw!, market: "1x2" as const } : null)).sort(byP);
    case "home-win":
      return map((m) => (m.pick_1x2 === "1" && m.p_home! >= 0.5 ? mainTip(m) : null)).sort(byKickoff);
    case "away-win":
      return map((m) => (m.pick_1x2 === "2" && m.p_away! >= 0.45 ? mainTip(m) : null)).sort(byKickoff);
    case "correct-score":
      return map(scoreTip).sort(byKickoff);
  }
}

/** Greedy accumulator: safest picks (one per match) until the combined fair odds reach the target. */
function accumulator(sorted: TipRow[], target: number, maxLegs = 4): TipRow[] {
  const legs: TipRow[] = [];
  let odds = 1;
  for (const r of sorted) {
    if (odds >= target || legs.length >= maxLegs) break;
    legs.push(r);
    odds *= fairOdds(r.tip.p);
  }
  return odds >= target * 0.9 ? legs : [];
}

export const comboOdds = (rows: TipRow[]) => rows.reduce((o, r) => o * fairOdds(r.tip.p), 1);

/** Grades a tip against a final score. null = not finished. */
export function gradeTip(tip: Tip, hg: number | null, ag: number | null): boolean | null {
  if (hg == null || ag == null) return null;
  const total = hg + ag;
  const c = tip.code;
  if (c === "1") return hg > ag;
  if (c === "X") return hg === ag;
  if (c === "2") return hg < ag;
  if (c === "1X") return hg >= ag;
  if (c === "X2") return hg <= ag;
  if (c === "GG") return hg > 0 && ag > 0;
  if (c === "NG") return hg === 0 || ag === 0;
  const ou = /^(Over|Under) (\d\.5)$/.exec(c);
  if (ou) return ou[1] === "Over" ? total > Number(ou[2]) : total < Number(ou[2]);
  if (/^\d+-\d+$/.test(c)) return c === `${hg}-${ag}`;
  return null;
}

const FINISHED = ["FT", "AET", "PEN"];
export const isFinished = (m: MatchRow) => FINISHED.includes(m.status) && m.home_goals != null;
export const tipResult = (r: TipRow) => (isFinished(r.m) ? gradeTip(r.tip, r.m.home_goals, r.m.away_goals) : null);
