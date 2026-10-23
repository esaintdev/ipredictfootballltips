import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q, q1 } from "./db";
import { COOKIE, signSession, verifySession, type Session } from "./session";

export async function currentAdmin(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function requireAdmin(): Promise<Session> {
  const s = await currentAdmin();
  if (!s) redirect("/admin/login");
  return s;
}

/** First run: create the admin from ADMIN_EMAIL / ADMIN_PASSWORD if no admin exists yet. */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await q1<{ n: string }>("SELECT COUNT(*)::text AS n FROM admins");
  if (existing && existing.n === "0") {
    await q("INSERT INTO admins(email, name, password_hash) VALUES ($1, 'Owner', $2) ON CONFLICT DO NOTHING", [email, await bcrypt.hash(password, 10)]);
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  await bootstrapAdmin();
  const admin = await q1<{ id: number; email: string; name: string; password_hash: string }>(
    "SELECT id, email, name, password_hash FROM admins WHERE email = $1",
    [email.toLowerCase().trim()],
  );
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) return false;
  await q("UPDATE admins SET last_login_at = NOW() WHERE id = $1", [admin.id]);
  const token = await signSession({ id: admin.id, email: admin.email, name: admin.name });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
