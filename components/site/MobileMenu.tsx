"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, LogoMark, type IconName } from "./icons";

type L = { href: string; label: string; icon?: IconName };

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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:hidden">
        <Icon name="menu" size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-navy p-5 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-xl font-bold tracking-wide uppercase"><LogoMark size={28} />Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><Icon name="x" size={18} /></button>
            </div>
            {main.map((l) => <DrawerLink key={l.href} l={l} active={path === l.href} />)}
            <div className="mt-6 mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-gold uppercase">Football Tips</div>
            <div className="grid grid-cols-2 gap-1">
              {tips.map((l) => (
                <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-[13px] font-semibold ${path === l.href ? "bg-brand-solid text-[#060b16]" : "bg-white/5 text-white/85 hover:bg-white/10"}`}>{l.label}</Link>
              ))}
            </div>
            <div className="mt-6 mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-gold uppercase">By Day</div>
            {days.map((l) => <DrawerLink key={l.href} l={{ ...l, icon: "calendar" }} active={path === l.href} />)}
          </nav>
        </div>
      )}
    </>
  );
}

function DrawerLink({ l, active }: { l: L; active: boolean }) {
  return (
    <Link href={l.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${active ? "bg-white/10 text-brand-solid" : "text-white/90 hover:bg-white/5"}`}>
      {l.icon && <Icon name={l.icon} size={18} className={active ? "" : "text-white/50"} />}{l.label}
    </Link>
  );
}
