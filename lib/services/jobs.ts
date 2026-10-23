import { q, q1 } from "../db";
import { apiCallCount } from "../api/football";

/** Runs `fn` and records it in job_logs with status, message and API calls used. */
export async function runJob<T>(kind: string, fn: () => Promise<{ message: string; result?: T }>) {
  const row = await q1<{ id: number }>("INSERT INTO job_logs(kind) VALUES ($1) RETURNING id", [kind]);
  const before = apiCallCount();
  try {
    const { message, result } = await fn();
    await q("UPDATE job_logs SET status='done', message=$2, api_calls=$3, finished_at=NOW() WHERE id=$1", [row!.id, message, apiCallCount() - before]);
    return { ok: true as const, message, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await q("UPDATE job_logs SET status='error', message=$2, api_calls=$3, finished_at=NOW() WHERE id=$1", [row!.id, message, apiCallCount() - before]);
    return { ok: false as const, message };
  }
}
