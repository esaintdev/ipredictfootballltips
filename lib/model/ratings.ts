// Time-weighted team strength model (Maher / Dixon-Coles style).
//   lambda_home = base * homeAdv * attack[home] * defence[away]
//   lambda_away = base *           attack[away] * defence[home]
// Ratings are fitted with weighted iterative proportional fitting, with an
// exponential time decay and a shrinkage prior that pulls thin samples to average.

import { dcTau, marketsFromMatrix, scoreMatrix, type Markets } from "./poisson";

export interface HistMatch {
  date: number; // epoch ms
  home: string;
  away: string;
  hg: number;
  ag: number;
  neutral?: boolean;
}

export interface ModelParams {
  /** Days for a match's weight to halve. */
  halfLifeDays: number;
  /** Ignore matches older than this. */
  maxAgeDays: number;
  /** Pseudo-matches of "average" evidence added to every team. */
  shrinkage: number;
  /** Ratings used for teams the model has never seen (e.g. newly promoted). */
  unknownAttack: number;
  unknownDefence: number;
  iterations: number;
}

export const DEFAULT_PARAMS: ModelParams = {
  halfLifeDays: 240,
  maxAgeDays: 1100,
  shrinkage: 2,
  unknownAttack: 0.85,
  unknownDefence: 1.15,
  iterations: 40,
};

export interface FittedModel {
  attack: Map<string, number>;
  defence: Map<string, number>;
  base: number;
  homeAdv: number;
  rho: number;
  params: ModelParams;
  nMatches: number;
}

const DAY = 86_400_000;

export function fitModel(all: HistMatch[], asOf: number, params: ModelParams = DEFAULT_PARAMS): FittedModel {
  const decay = Math.LN2 / params.halfLifeDays;
  const ms: (HistMatch & { w: number })[] = [];
  for (const m of all) {
    if (m.date >= asOf) continue;
    const age = (asOf - m.date) / DAY;
    if (age > params.maxAgeDays) continue;
    ms.push({ ...m, w: Math.exp(-decay * age) });
  }

  const attack = new Map<string, number>();
  const defence = new Map<string, number>();
  for (const m of ms) {
    attack.set(m.home, 1); attack.set(m.away, 1);
    defence.set(m.home, 1); defence.set(m.away, 1);
  }

  let wSum = 0, gSum = 0, hgSum = 0, agSum = 0;
  for (const m of ms) {
    wSum += m.w; gSum += m.w * (m.hg + m.ag);
    if (!m.neutral) { hgSum += m.w * m.hg; agSum += m.w * m.ag; }
  }
  let base = wSum > 0 ? gSum / (2 * wSum) : 1.35;
  let homeAdv = agSum > 0 ? Math.sqrt(hgSum / agSum) : 1.15;
  if (!(homeAdv > 0) || !isFinite(homeAdv)) homeAdv = 1.15;
  if (ms.length === 0) return { attack, defence, base, homeAdv, rho: -0.05, params, nMatches: 0 };

  const k = params.shrinkage;
  for (let it = 0; it < params.iterations; it++) {
    // attack update
    const aNum = new Map<string, number>(), aDen = new Map<string, number>();
    for (const m of ms) {
      const h = m.neutral ? 1 : homeAdv;
      add(aNum, m.home, m.w * m.hg);
      add(aDen, m.home, m.w * base * h * defence.get(m.away)!);
      add(aNum, m.away, m.w * m.ag);
      add(aDen, m.away, m.w * base * defence.get(m.home)!);
    }
    for (const t of attack.keys()) attack.set(t, (aNum.get(t)! + k * base) / (aDen.get(t)! + k * base));
    // defence update
    const dNum = new Map<string, number>(), dDen = new Map<string, number>();
    for (const m of ms) {
      const h = m.neutral ? 1 : homeAdv;
      add(dNum, m.away, m.w * m.hg);
      add(dDen, m.away, m.w * base * h * attack.get(m.home)!);
      add(dNum, m.home, m.w * m.ag);
      add(dDen, m.home, m.w * base * attack.get(m.away)!);
    }
    for (const t of defence.keys()) defence.set(t, (dNum.get(t)! + k * base) / (dDen.get(t)! + k * base));
    // normalise mean attack to 1 (defence mean too) and fold scale into base
    const meanA = mean(attack.values()), meanD = mean(defence.values());
    for (const t of attack.keys()) attack.set(t, attack.get(t)! / meanA);
    for (const t of defence.keys()) defence.set(t, defence.get(t)! / meanD);
    // base and home advantage
    let expH = 0, expA = 0, obsH = 0, obsA = 0;
    for (const m of ms) {
      const eh = m.w * attack.get(m.home)! * defence.get(m.away)!;
      const ea = m.w * attack.get(m.away)! * defence.get(m.home)!;
      if (!m.neutral) { expH += eh; obsH += m.w * m.hg; expA += ea; obsA += m.w * m.ag; }
    }
    if (expH > 0 && expA > 0 && obsA > 0) homeAdv = Math.sqrt((obsH / expH) / (obsA / expA));
    let expScaled = 0;
    for (const m of ms) {
      const h = m.neutral ? 1 : homeAdv;
      expScaled += m.w * (h * attack.get(m.home)! * defence.get(m.away)! + attack.get(m.away)! * defence.get(m.home)!);
    }
    base = expScaled > 0 ? gSum / expScaled : base;
  }

  // Dixon-Coles rho: maximise the weighted log of the tau correction (tau keeps
  // the distribution normalised, so the Poisson part is constant in rho).
  let bestRho = 0, bestLl = -Infinity;
  for (let r = -0.25; r <= 0.1001; r += 0.01) {
    let ll = 0;
    for (const m of ms) {
      if (m.hg > 1 || m.ag > 1) continue;
      const h = m.neutral ? 1 : homeAdv;
      const lh = base * h * attack.get(m.home)! * defence.get(m.away)!;
      const la = base * attack.get(m.away)! * defence.get(m.home)!;
      const tau = dcTau(m.hg, m.ag, lh, la, r);
      ll += tau > 0 ? m.w * Math.log(tau) : -1e9;
    }
    if (ll > bestLl) { bestLl = ll; bestRho = r; }
  }

  return { attack, defence, base, homeAdv, rho: Math.round(bestRho * 100) / 100, params, nMatches: ms.length };
}

export function expectedGoals(model: FittedModel, home: string, away: string, neutral = false): [number, number] {
  const p = model.params;
  const aH = model.attack.get(home) ?? p.unknownAttack;
  const dH = model.defence.get(home) ?? p.unknownDefence;
  const aA = model.attack.get(away) ?? p.unknownAttack;
  const dA = model.defence.get(away) ?? p.unknownDefence;
  const h = neutral ? 1 : model.homeAdv;
  const clamp = (x: number) => Math.min(6, Math.max(0.1, x));
  return [clamp(model.base * h * aH * dA), clamp(model.base * aA * dH)];
}

export function predictMatch(model: FittedModel, home: string, away: string, neutral = false): Markets {
  const [lh, la] = expectedGoals(model, home, away, neutral);
  return marketsFromMatrix(scoreMatrix(lh, la, model.rho), lh, la);
}

export function knows(model: FittedModel, team: string) {
  return model.attack.has(team);
}

function add(map: Map<string, number>, key: string, v: number) {
  map.set(key, (map.get(key) ?? 0) + v);
}
function mean(it: Iterable<number>) {
  let s = 0, n = 0;
  for (const v of it) { s += v; n++; }
  return n ? s / n : 1;
}
