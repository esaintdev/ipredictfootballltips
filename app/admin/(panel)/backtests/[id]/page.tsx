import Link from "next/link";
import { notFound } from "next/navigation";
import { q1 } from "@/lib/db";
import type { BacktestReport } from "@/lib/model/backtest";
import type { ModelParams } from "@/lib/model/ratings";
import type { BacktestScope } from "@/lib/services/backtest";
import { applyBacktestParams, deleteBacktest, toggleBacktestPublic } from "../../../actions";
import { BacktestView } from "@/components/BacktestView";
import { Flash } from "@/components/Flash";

export default async function BacktestDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const bt = await q1<{ id: number; label: string; status: string; is_public: boolean; params: ModelParams; scope: BacktestScope; report: BacktestReport | null; error: string | null }>(
    "SELECT * FROM backtests WHERE id=$1", [Number((await params).id)]);
  if (!bt) notFound();

  return (
    <div className="space-y-6">
      {bt.status === "running" && <meta httpEquiv="refresh" content="5" />}
      <Link href="/admin/backtests" className="text-sm text-muted hover:text-brand">← Backtests</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{bt.label}</h1>
          <p className="text-sm text-muted">
            {bt.scope.from} → {bt.scope.to} · refit every {bt.scope.stepDays} days · half-life {bt.params.halfLifeDays}d · shrinkage {bt.params.shrinkage} ·{" "}
            {bt.scope.competitionIds.length ? `${bt.scope.competitionIds.length} competitions` : "all competitions"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bt.status === "done" && (
            <>
              <form action={toggleBacktestPublic}><input type="hidden" name="id" value={bt.id} /><button className="btn btn-ghost">{bt.is_public ? "Hide from accuracy page" : "Show on accuracy page"}</button></form>
              <form action={applyBacktestParams}><input type="hidden" name="id" value={bt.id} /><button className="btn btn-ghost">Use these parameters live</button></form>
            </>
          )}
          <form action={deleteBacktest}><input type="hidden" name="id" value={bt.id} /><button className="btn btn-danger">Delete</button></form>
        </div>
      </div>
      <Flash msg={sp.msg} error={sp.error ?? (bt.status === "error" ? bt.error ?? "Failed" : undefined)} />
      {bt.status === "running" && <div className="card p-8 text-center text-muted">Running… this page refreshes automatically.</div>}
      {bt.report && <BacktestView report={bt.report} />}
    </div>
  );
}
