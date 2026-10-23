"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/** Shows `step` children at a time with a "Load more" button. */
export function LoadMore({ children, step = 25 }: { children: ReactNode; step?: number }) {
  const all = Children.toArray(children);
  const [n, setN] = useState(step);
  return (
    <>
      {all.slice(0, n)}
      {n < all.length && (
        <div className="flex justify-center py-4">
          <button onClick={() => setN(n + step)} className="s-btn s-btn-outline">Load more <span aria-hidden>▾</span></button>
        </div>
      )}
    </>
  );
}

/** Horizontal scroller that keeps the active item (data-active) in view. */
export function Scroller({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[data-active=true]");
    if (el && ref.current) ref.current.scrollLeft = el.offsetLeft - ref.current.clientWidth / 2 + el.clientWidth / 2;
  }, []);
  return <div ref={ref} className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>{children}</div>;
}

/** Calendar button: picks any date and navigates to `${base}date=...`. */
export function DatePicker({ value, base }: { value: string; base: string }) {
  const router = useRouter();
  return (
    <label className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-edge text-subtle hover:border-accent hover:text-accent" title="Pick a date">
      <span aria-hidden>📅</span>
      <span className="sr-only">Pick a date</span>
      <input type="date" value={value} onChange={(e) => e.target.value && router.push(`${base}date=${e.target.value}`)}
        className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}

/** Simple prev/next carousel with dots; each child is one slide. */
export function Carousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const [i, setI] = useState(0);
  if (!slides.length) return null;
  const go = (d: number) => setI((i + d + slides.length) % slides.length);
  return (
    <div>
      {slides.length > 1 && (
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => go(-1)} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-edge hover:border-accent">‹</button>
          <div className="flex gap-2">{slides.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-2 w-2 rounded-full ${k === i ? "bg-fg" : "bg-edge"}`} />)}</div>
          <button onClick={() => go(1)} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-edge hover:border-accent">›</button>
        </div>
      )}
      {slides[i]}
    </div>
  );
}
