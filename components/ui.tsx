import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "./LocalTime";

export { LocalTime };

export function TeamLogo({ src, name, size = 24 }: { src: string | null; name: string; size?: number }) {
  if (!src) {
    return (
      <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-panel-2 text-[10px] font-bold text-muted">
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} loading="lazy" className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

export const pct = (x: number | null | undefined, d = 0) => (x == null ? "–" : `${(x * 100).toFixed(d)}%`);

export function ProbBar({ home, draw, away, labels = true }: { home: number; draw: number; away: number; labels?: boolean }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-panel-2">
        <div className="bg-brand" style={{ width: `${home * 100}%` }} />
        <div className="bg-slate-500" style={{ width: `${draw * 100}%` }} />
        <div className="bg-gold" style={{ width: `${away * 100}%` }} />
      </div>
      {labels && (
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span><b className="text-brand">1</b> {pct(home)}</span>
          <span><b className="text-slate-300">X</b> {pct(draw)}</span>
          <span><b className="text-gold">2</b> {pct(away)}</span>
        </div>
      )}
    </div>
  );
}

export function Meter({ value, color = "bg-brand" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

export function Stars({ confidence }: { confidence: number }) {
  const n = confidence >= 75 ? 5 : confidence >= 65 ? 4 : confidence >= 55 ? 3 : confidence >= 45 ? 2 : 1;
  return (
    <span className="text-gold" title={`Confidence ${confidence}%`}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function WinLoss({ won }: { won: boolean | null }) {
  if (won == null) return <span className="text-muted">–</span>;
  return won ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">✓</span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-loss/20 text-xs font-bold text-loss">✕</span>
  );
}

export function SectionTitle({ children, href, action }: { children: ReactNode; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-white">{children}</h2>
      {href && <Link href={href} className="text-sm font-medium text-brand hover:underline">{action ?? "View all"} →</Link>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-3xl">⚽</div>
      <p className="mt-3 font-semibold text-white">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function pickLabel(pick: string | null, home: string, away: string) {
  if (pick === "1") return `${home} win`;
  if (pick === "2") return `${away} win`;
  if (pick === "X") return "Draw";
  return "–";
}
