import { LocalTime } from "@/components/ui";

export interface JobRow { id: number; kind: string; status: string; message: string | null; api_calls: number; started_at: string; finished_at: string | null }

export function JobTable({ jobs }: { jobs: JobRow[] }) {
  if (!jobs.length) return <p className="text-sm text-muted">No jobs have run yet.</p>;
  return (
    <table className="table min-w-[720px]">
      <thead><tr><th>Started</th><th>Job</th><th>Status</th><th>API calls</th><th>Duration</th><th>Message</th></tr></thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id}>
            <td className="whitespace-nowrap text-muted"><LocalTime iso={j.started_at} mode="datetime" /></td>
            <td className="font-semibold text-white">{j.kind}</td>
            <td>
              <span className={`chip ${j.status === "done" ? "chip-active" : j.status === "error" ? "border-loss text-loss" : "border-gold text-gold"}`}>{j.status}</span>
            </td>
            <td>{j.api_calls}</td>
            <td className="text-muted">{j.finished_at ? `${Math.round((new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) / 1000)}s` : "…"}</td>
            <td className="max-w-md text-xs text-slate-300">{j.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
