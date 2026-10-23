import { test } from "node:test";
import assert from "node:assert/strict";
import { bestTip, comboOdds, gradeTip, tipsFor, type Tip } from "./tips";
import type { MatchRow } from "./queries";

const t = (code: string): Tip => ({ code, label: code, p: 0.5, market: "1x2" });

test("gradeTip settles every tip code on the regular-time score", () => {
  assert.equal(gradeTip(t("1"), 2, 1), true);
  assert.equal(gradeTip(t("X"), 1, 1), true);
  assert.equal(gradeTip(t("1X"), 0, 1), false);
  assert.equal(gradeTip(t("X2"), 1, 1), true);
  assert.equal(gradeTip(t("Over 2.5"), 2, 1), true);
  assert.equal(gradeTip(t("Under 3.5"), 2, 2), false);
  assert.equal(gradeTip(t("GG"), 1, 0), false);
  assert.equal(gradeTip(t("NG"), 0, 0), true);
  assert.equal(gradeTip(t("2-1"), 2, 1), true);
  assert.equal(gradeTip(t("1"), null, null), null);
});

const match = (id: number, ph: number, pd: number, over: Record<string, number>, btts: number) =>
  ({ id, kickoff: new Date(2026, 0, 1, 12 + id).toISOString(), status: "NS", home_name: "H", away_name: "A",
    p_home: ph, p_draw: pd, p_away: 1 - ph - pd, p_over: over, p_btts: btts, pick_1x2: ph > 0.5 ? "1" : "X",
    pick_ou: over["2.5"] >= 0.5 ? "over" : "under", pick_score: "1-0", top_scores: [{ score: "1-0", p: 0.12 }] }) as unknown as MatchRow;

test("bestTip skips near-certain picks priced under ~1.20", () => {
  const m = match(1, 0.6, 0.25, { "1.5": 0.9, "2.5": 0.6, "3.5": 0.35 }, 0.5);
  const b = bestTip(m)!;
  assert.ok(b.p <= 0.83);
  assert.equal(b.code, "Under 3.5"); // 1X (0.85) and Over 1.5 (0.90) are too short
});

test("2 odds accumulator reaches about 2.00 with at most four legs", () => {
  const rows = [1, 2, 3, 4, 5].map((i) => match(i, 0.55, 0.25, { "1.5": 0.8, "2.5": 0.55, "3.5": 0.3 }, 0.5));
  const acca = tipsFor("two-odds", rows);
  assert.ok(acca.length > 0 && acca.length <= 4);
  assert.ok(comboOdds(acca) >= 1.8);
  assert.equal(new Set(acca.map((r) => r.m.id)).size, acca.length);
});
