// Score-distribution maths: Poisson goals with the Dixon-Coles low-score correction.

export const MAX_GOALS = 10;
export const OU_LINES = [0.5, 1.5, 2.5, 3.5, 4.5] as const;

const FACT: number[] = [1];
for (let i = 1; i <= 20; i++) FACT[i] = FACT[i - 1] * i;

export function poissonPmf(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / FACT[k];
}

/** Dixon-Coles dependence factor for the four low-scoring outcomes. */
export function dcTau(x: number, y: number, lh: number, la: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lh * la * rho;
  if (x === 0 && y === 1) return 1 + lh * rho;
  if (x === 1 && y === 0) return 1 + la * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

/** matrix[h][a] = P(home scores h, away scores a), normalised to sum to 1. */
export function scoreMatrix(lh: number, la: number, rho: number, max = MAX_GOALS): number[][] {
  const ph = Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, lh));
  const pa = Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, la));
  const m: number[][] = [];
  let total = 0;
  for (let h = 0; h <= max; h++) {
    m[h] = [];
    for (let a = 0; a <= max; a++) {
      const p = Math.max(0, ph[h] * pa[a] * dcTau(h, a, lh, la, rho));
      m[h][a] = p;
      total += p;
    }
  }
  for (let h = 0; h <= max; h++) for (let a = 0; a <= max; a++) m[h][a] /= total;
  return m;
}

export interface Markets {
  home: number;
  draw: number;
  away: number;
  /** P(total goals > line) keyed by line, e.g. over["2.5"] */
  over: Record<string, number>;
  btts: number;
  topScores: { score: string; p: number }[];
  expHome: number;
  expAway: number;
}

export function marketsFromMatrix(m: number[][], lh: number, la: number): Markets {
  let home = 0, draw = 0, away = 0, btts = 0;
  const over: Record<string, number> = {};
  for (const l of OU_LINES) over[String(l)] = 0;
  const scores: { score: string; p: number }[] = [];
  for (let h = 0; h < m.length; h++) {
    for (let a = 0; a < m[h].length; a++) {
      const p = m[h][a];
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
      if (h > 0 && a > 0) btts += p;
      for (const l of OU_LINES) if (h + a > l) over[String(l)] += p;
      scores.push({ score: `${h}-${a}`, p });
    }
  }
  scores.sort((x, y) => y.p - x.p);
  return { home, draw, away, over, btts, topScores: scores.slice(0, 8), expHome: lh, expAway: la };
}
