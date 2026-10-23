import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const maxDuration = 300;

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/predictions", label: "Predictions", icon: "◎" },
  { href: "/admin/competitions", label: "Competitions", icon: "🏆" },
  { href: "/admin/backtests", label: "Backtests", icon: "🧪" },
  { href: "/admin/jobs", label: "Sync & Jobs", icon: "⟳" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/admins", label: "Admins", icon: "👤" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-panel lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4 lg:block">
          <Logo />
          <div className="mt-1 hidden text-xs text-muted lg:block">Control panel</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-panel-2 hover:text-white">
              <span className="w-4 text-center">{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-line p-4 text-xs text-muted lg:absolute lg:bottom-0 lg:block lg:w-full">
          <div className="truncate">{me.email}</div>
          <div className="mt-2 flex gap-2">
            <Link href="/" className="btn btn-ghost px-3 py-1 text-xs">View site</Link>
            <form action={logoutAction}><button className="btn btn-ghost px-3 py-1 text-xs">Log out</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}
