"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type L = { href: string; label: string; icon?: string };

/** Desktop navigation. The tips dropdown opens on hover and on keyboard focus. */
export function NavLinks({ main, tips }: { main: L[]; tips: L[] }) {
  const path = usePathname();
  const tipActive = tips.some((t) => t.href === path);
  const item = (active: boolean) =>
    `relative flex h-16 items-center gap-2 px-3 text-sm font-semibold transition ${active ? "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand-solid" : "text-white/75 hover:text-white"}`;
  const [home, botd, ...rest] = main;
  return (
    <nav className="hidden items-center lg:flex" aria-label="Main">
      {[home, botd].map((l) => (
        <Link key={l.href} href={l.href} className={item(path === l.href)}><span aria-hidden>{l.icon}</span>{l.label}</Link>
      ))}
      <div className="group relative">
        <button className={item(tipActive)} aria-haspopup="true">
          <span aria-hidden>📋</span>Football Tips<span className="text-xs transition group-hover:rotate-180 group-focus-within:rotate-180">▾</span>
        </button>
        <div className="invisible absolute left-0 top-full z-50 w-[30rem] translate-y-1 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="mt-1 grid grid-cols-2 gap-1 rounded-2xl border border-edge bg-surface p-2 shadow-xl">
            {tips.map((t) => (
              <Link key={t.href} href={t.href} className={`rounded-lg px-3 py-2 text-sm font-medium ${t.href === path ? "bg-accent-soft text-accent" : "text-fg hover:bg-surface-2"}`}>{t.label}</Link>
            ))}
          </div>
        </div>
      </div>
      {rest.map((l) => (
        <Link key={l.href} href={l.href} className={item(path === l.href || (l.href !== "/" && path.startsWith(l.href + "/")))}><span aria-hidden>{l.icon}</span>{l.label}</Link>
      ))}
    </nav>
  );
}
