import type { Metadata } from "next";
import { loginAction } from "../actions";
import { Logo } from "@/components/Logo";
import { Flash } from "@/components/Flash";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-bold text-white">Admin sign in</h1>
        <p className="mb-6 text-sm text-muted">Manage predictions, competitions and backtests.</p>
        <Flash error={sp.error} />
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={sp.next ?? "/admin"} />
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="username" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
          <button className="btn btn-primary w-full">Sign in</button>
        </form>
        <p className="mt-6 text-xs text-muted">First run: the owner account is created from <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>.</p>
      </div>
    </div>
  );
}
