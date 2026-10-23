import type { Markets } from "./poisson";

export type Outcome = "1" | "X" | "2";

export interface Picks {
  pick1x2: Outcome;
  pick1x2Prob: number;
  pickOu: "over" | "under";
  ouLine: number;
  pickOuProb: number;
  pickScore: string;
  pickScoreProb: number;
  pickBtts: boolean;
  pickBttsProb: number;
  /** 0-100 star-style confidence for the main (1X2) tip */
  confidence: number;
}

export function makePicks(m: Markets, ouLine = 2.5): Picks {
  const opts: [Outcome, number][] = [["1", m.home], ["X", m.draw], ["2", m.away]];
  opts.sort((a, b) => b[1] - a[1]);
  const pOver = m.over[String(ouLine)];
  return {
    pick1x2: opts[0][0],
    pick1x2Prob: opts[0][1],
    pickOu: pOver >= 0.5 ? "over" : "under",
    ouLine,
    pickOuProb: Math.max(pOver, 1 - pOver),
    pickScore: m.topScores[0].score,
    pickScoreProb: m.topScores[0].p,
    pickBtts: m.btts >= 0.5,
    pickBttsProb: Math.max(m.btts, 1 - m.btts),
    confidence: Math.round(opts[0][1] * 100),
  };
}

export function outcomeOf(hg: number, ag: number): Outcome {
  return hg > ag ? "1" : hg === ag ? "X" : "2";
}
