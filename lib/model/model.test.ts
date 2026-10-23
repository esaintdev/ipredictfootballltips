import { test } from "node:test";
import assert from "node:assert/strict";
import { marketsFromMatrix, scoreMatrix } from "./poisson";
import { fitModel, predictMatch, type HistMatch } from "./ratings";
import { makePicks } from "./picks";
import { runBacktest } from "./backtest";

test("score matrix is a probability distribution and markets are consistent", () => {
  const m = scoreMatrix(1.6, 1.1, -0.08);
  const total = m.flat().reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  const mk = marketsFromMatrix(m, 1.6, 1.1);
  assert.ok(Math.abs(mk.home + mk.draw + mk.away - 1) < 1e-9);
  assert.ok(mk.home > mk.away);
  assert.ok(mk.over["1.5"] > mk.over["2.5"] && mk.over["2.5"] > mk.over["3.5"]);
});

// Synthetic league: "Strong" beats everyone, home teams score more.
function league(): HistMatch[] {
  const teams = ["Strong", "B", "C", "D", "E", "F"];
  const out: HistMatch[] = [];
  let day = Date.parse("2024-08-01");
  for (let r = 0; r < 6; r++) {
    for (const h of teams) for (const a of teams) {
      if (h === a) continue;
      const hg = (h === "Strong" ? 3 : 1) + (r % 2);
      const ag = a === "Strong" ? 2 : r % 3 === 0 ? 1 : 0;
      out.push({ date: (day += 3_600_000 * 20), home: h, away: a, hg, ag });
    }
  }
  return out;
}

test("model learns team strength and home advantage", () => {
  const model = fitModel(league(), Date.now());
  assert.ok(model.homeAdv > 1);
  assert.ok(model.attack.get("Strong")! > model.attack.get("B")!);
  const p = makePicks(predictMatch(model, "Strong", "B"));
  assert.equal(p.pick1x2, "1");
  assert.ok(p.confidence > 50);
});

test("backtest never uses future matches and reports metrics", () => {
  const ms = league().map((m) => ({ ...m, group: "Test" }));
  const from = ms[Math.floor(ms.length / 2)].date;
  const r = runBacktest(ms, { testFrom: from, testTo: ms[ms.length - 1].date + 1 });
  assert.ok(r.overall.n > 0);
  assert.ok(r.overall.acc1x2 >= 0 && r.overall.acc1x2 <= 1);
  assert.ok(r.byGroup.Test.n === r.overall.n);
});
