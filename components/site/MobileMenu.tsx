"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type L = { href: string; label: string; icon?: string };

export function MobileMenu({ main, tips, days }: { main: L[]; tips: L[]; days: L[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg text-white hover:bg-white/10 lg:hidden">
        <span className="h-0.5 w-5 rounded bg-current" /><span className="h-0.5 w-5 rounded bg-current" /><span className="h-0.5 w-5 rounded bg-current" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-navy p-5 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-white/60">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-white/10">✕</button>
            </div>
            {main.map((l) => <DrawerLink key={l.href} l={l} active={path === l.href} />)}
            <div className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-gold">Football Tips</div>
            {tips.map((l) => <DrawerLink key={l.href} l={l} active={path === l.href} />)}
            <div className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-gold">By Day</div>
            {days.map((l) => <DrawerLink key={l.href} l={l} active={path === l.href} />)}
          </nav>
        </div>
      )}
    </>
  );
}

function DrawerLink({ l, active }: { l: L; active: boolean }) {
  return (
    <Link href={l.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${active ? "bg-white/10 text-brand-solid" : "text-white/90 hover:bg-white/5"}`}>
      {l.icon && <span aria-hidden>{l.icon}</span>}{l.label}
    </Link>
  );
}
