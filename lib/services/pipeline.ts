import { runJob } from "./jobs";
import { syncWindow } from "./sync";
import { generatePredictions, settlePredictions } from "./predict";

/** The daily routine: pull fixtures/results, grade finished matches, predict upcoming ones. */
export async function runDailyPipeline() {
  const parts: string[] = [];
  let ok = true;
  for (const [name, fn] of [
    ["sync", () => syncWindow()],
    ["settle", () => settlePredictions()],
    ["predict", () => generatePredictions()],
  ] as const) {
    const r = await runJob(name, fn);
    ok &&= r.ok;
    parts.push(`${name}: ${r.message}`);
  }
  return { ok, message: parts.join(" · ") };
}
