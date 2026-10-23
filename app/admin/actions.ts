"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { q, q1 } from "@/lib/db";
import { hashPassword, login, logout, requireAdmin } from "@/lib/auth";
import { addCompetition, importHistory, syncCompetitionMeta, syncWindow } from "@/lib/services/sync";
import { generatePredictions, settlePredictions } from "@/lib/services/predict";
import { runJob } from "@/lib/services/jobs";
import { runDailyPipeline } from "@/lib/services/pipeline";
import { createBacktest, executeBacktest } from "@/lib/services/backtest";
import { DEFAULT_SITE, modelParams, setSetting, siteSettings } from "@/lib/settings";
import { DEFAULT_PARAMS } from "@/lib/model/ratings";

const back = (path: string, msg: string, error = false) => redirect(`${path}?${error ? "error" : "msg"}=${encodeURIComponent(msg)}`);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string, d: number) => {
  const v = Number(f.get(k));
  return Number.isFinite(v) && f.get(k) !== "" && f.get(k) != null ? v : d;
};

// ---------------------------------------------------------------- auth
export async function loginAction(form: FormData) {
  const ok = await login(str(form, "email"), str(form, "password"));
  if (!ok) redirect("/admin/login?error=Invalid%20email%20or%20password");
  const next = str(form, "next");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- jobs
export async function runJobAction(form: FormData) {
  await requireAdmin();
  const kind = str(form, "kind");
  let res: { ok: boolean; message: string };
  switch (kind) {
    case "meta": res = await runJob("meta", syncCompetitionMeta); break;
    case "window": res = await runJob("sync", () => syncWindow()); break;
    case "predict": res = await runJob("predict", () => generatePredictions()); break;
    case "settle": res = await runJob("settle", settlePredictions); break;
    case "daily": res = await runDailyPipeline(); break;
    default: res = { ok: false, message: "Unknown job" };
  }
  revalidatePath("/", "layout");
  back(str(form, "return") || "/admin", res.message, !res.ok);
}

export async function importHistoryAction(form: FormData) {
  await requireAdmin();
  const seasons = Math.min(5, Math.max(1, num(form, "seasons", 3)));
  const compId = num(form, "competition_id", 0);
  after(() => runJob("import", () => importHistory(seasons, compId ? [compId] : undefined)).then(() => undefined));
  back("/admin/jobs", `History import started (${seasons} season${seasons > 1 ? "s" : ""}${compId ? `, competition ${compId}` : ", all enabled competitions"}). Refresh this page to follow progress.`);
}

// ---------------------------------------------------------------- competitions
export async function toggleCompetition(form: FormData) {
  await requireAdmin();
  await q("UPDATE competitions SET enabled = NOT enabled WHERE id = $1", [num(form, "id", 0)]);
  revalidatePath("/", "layout");
  back("/admin/competitions", "Competition updated");
}

export async function updateCompetition(form: FormData) {
  await requireAdmin();
  const schema = z.object({
    id: z.number().int(),
    priority: z.number().int(),
    current_season: z.number().int().min(1990).max(2100).nullable(),
    category: z.enum(["domestic", "uefa", "fifa"]),
    neutral: z.boolean(),
  });
  const d = schema.parse({
    id: num(form, "id", 0),
    priority: num(form, "priority", 100),
    current_season: form.get("current_season") ? num(form, "current_season", 0) : null,
    category: str(form, "category"),
    neutral: form.get("neutral") === "on",
  });
  await q("UPDATE competitions SET priority=$2, current_season=$3, category=$4, neutral=$5 WHERE id=$1", [d.id, d.priority, d.current_season, d.category, d.neutral]);
  revalidatePath("/", "layout");
  back("/admin/competitions", "Saved");
}

export async function addCompetitionAction(form: FormData) {
  await requireAdmin();
  try {
    const name = await addCompetition(num(form, "id", 0), str(form, "category") || "domestic");
    back("/admin/competitions", `Added ${name}. Import its history before relying on predictions.`);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    back("/admin/competitions", (e as Error).message, true);
  }
}

// ---------------------------------------------------------------- predictions
export async function updatePrediction(form: FormData) {
  await requireAdmin();
  const id = num(form, "fixture_id", 0);
  const opt = (k: string, allowed: RegExp) => {
    const v = str(form, k);
    return v && allowed.test(v) ? v : null;
  };
  await q(
    `UPDATE predictions SET override_1x2=$2, override_ou=$3, override_score=$4, admin_note=$5, is_featured=$6, is_published=$7, updated_at=NOW()
     WHERE fixture_id=$1 AND settled_at IS NULL`,
    [id, opt("override_1x2", /^(1|X|2)$/), opt("override_ou", /^(over|under)$/), opt("override_score", /^\d{1,2}-\d{1,2}$/),
      str(form, "admin_note") || null, form.get("is_featured") === "on", form.get("is_published") === "on"],
  );
  // Manual featuring on a day stops auto-featuring from overriding the editor's choice.
  const k = await q1<{ d: string }>("SELECT (kickoff AT TIME ZONE 'UTC')::date::text AS d FROM fixtures WHERE id=$1", [id]);
  if (k) await setSetting(`manual_featured_${k.d}`, true);
  revalidatePath("/", "layout");
  back(str(form, "return") || "/admin/predictions", "Prediction saved");
}

export async function bulkPublish(form: FormData) {
  await requireAdmin();
  const day = str(form, "date");
  const publish = str(form, "publish") === "1";
  await q(
    `UPDATE predictions p SET is_published=$2 FROM fixtures f WHERE f.id=p.fixture_id AND p.settled_at IS NULL
     AND f.kickoff >= ($1::date)::timestamp AT TIME ZONE 'UTC' AND f.kickoff < ($1::date + 1)::timestamp AT TIME ZONE 'UTC'`,
    [day, publish],
  );
  revalidatePath("/", "layout");
  back(`/admin/predictions`, `${publish ? "Published" : "Unpublished"} all predictions for ${day}`);
}

export async function regeneratePrediction(form: FormData) {
  await requireAdmin();
  const id = num(form, "fixture_id", 0);
  const r = await runJob("predict", () => generatePredictions({ fixtureIds: [id] }));
  back(str(form, "return") || "/admin/predictions", r.message, !r.ok);
}

// ---------------------------------------------------------------- backtests
export async function runBacktestAction(form: FormData) {
  await requireAdmin();
  const base = await modelParams();
  const params = {
    ...base,
    halfLifeDays: num(form, "halfLifeDays", base.halfLifeDays),
    shrinkage: num(form, "shrinkage", base.shrinkage),
    maxAgeDays: num(form, "maxAgeDays", base.maxAgeDays),
  };
  const ids = form.getAll("competition_ids").map(Number).filter(Boolean);
  const scope = { from: str(form, "from"), to: str(form, "to"), competitionIds: ids, stepDays: Math.max(1, num(form, "stepDays", 7)) };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scope.from) || !/^\d{4}-\d{2}-\d{2}$/.test(scope.to)) back("/admin/backtests", "Pick a valid date range", true);
  const id = await createBacktest(str(form, "label") || `Backtest ${scope.from} → ${scope.to}`, params, scope);
  after(() => executeBacktest(id));
  redirect(`/admin/backtests/${id}`);
}

export async function toggleBacktestPublic(form: FormData) {
  await requireAdmin();
  const id = num(form, "id", 0);
  await q("UPDATE backtests SET is_public = NOT is_public WHERE id=$1", [id]);
  revalidatePath("/accuracy");
  back(`/admin/backtests/${id}`, "Visibility updated");
}

export async function deleteBacktest(form: FormData) {
  await requireAdmin();
  await q("DELETE FROM backtests WHERE id=$1", [num(form, "id", 0)]);
  back("/admin/backtests", "Backtest deleted");
}

export async function applyBacktestParams(form: FormData) {
  await requireAdmin();
  const bt = await q1<{ params: typeof DEFAULT_PARAMS }>("SELECT params FROM backtests WHERE id=$1", [num(form, "id", 0)]);
  if (bt) await setSetting("model_params", bt.params);
  back("/admin/settings", "Model parameters copied from backtest. Regenerate predictions to apply them.");
}

// ---------------------------------------------------------------- settings
export async function saveSiteSettings(form: FormData) {
  await requireAdmin();
  const cur = await siteSettings();
  await setSetting("site", {
    siteName: str(form, "siteName") || DEFAULT_SITE.siteName,
    tagline: str(form, "tagline") || DEFAULT_SITE.tagline,
    announcement: str(form, "announcement"),
    autoPublish: form.get("autoPublish") === "on",
    featuredMinProb: Math.min(0.95, Math.max(0.34, num(form, "featuredMinProb", cur.featuredMinProb * 100) / 100)),
    maxFeaturedPerDay: Math.max(0, Math.round(num(form, "maxFeaturedPerDay", cur.maxFeaturedPerDay))),
    horizonDays: Math.min(14, Math.max(1, Math.round(num(form, "horizonDays", cur.horizonDays)))),
  });
  revalidatePath("/", "layout");
  back("/admin/settings", "Site settings saved");
}

export async function saveModelParams(form: FormData) {
  await requireAdmin();
  const cur = await modelParams();
  const p = {
    halfLifeDays: Math.max(14, num(form, "halfLifeDays", cur.halfLifeDays)),
    maxAgeDays: Math.max(90, num(form, "maxAgeDays", cur.maxAgeDays)),
    shrinkage: Math.max(0, num(form, "shrinkage", cur.shrinkage)),
    unknownAttack: Math.max(0.3, num(form, "unknownAttack", cur.unknownAttack)),
    unknownDefence: Math.max(0.3, num(form, "unknownDefence", cur.unknownDefence)),
    iterations: Math.min(200, Math.max(5, Math.round(num(form, "iterations", cur.iterations)))),
  };
  await setSetting("model_params", p);
  back("/admin/settings", "Model parameters saved. Regenerate predictions to apply them.");
}

export async function resetModelParams() {
  await requireAdmin();
  await setSetting("model_params", DEFAULT_PARAMS);
  back("/admin/settings", "Model parameters reset to defaults");
}

// ---------------------------------------------------------------- admins
export async function addAdmin(form: FormData) {
  await requireAdmin();
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) back("/admin/admins", "Valid email and a password of 8+ characters required", true);
  await q("INSERT INTO admins(email, name, password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING", [email, str(form, "name") || "Admin", await hashPassword(password)]);
  back("/admin/admins", `Admin ${email} added`);
}

export async function deleteAdmin(form: FormData) {
  const me = await requireAdmin();
  const id = num(form, "id", 0);
  if (id === me.id) back("/admin/admins", "You can't remove yourself", true);
  await q("DELETE FROM admins WHERE id=$1", [id]);
  back("/admin/admins", "Admin removed");
}

export async function changePassword(form: FormData) {
  const me = await requireAdmin();
  const password = str(form, "password");
  if (password.length < 8) back("/admin/admins", "Password must be at least 8 characters", true);
  await q("UPDATE admins SET password_hash=$2 WHERE id=$1", [me.id, await hashPassword(password)]);
  back("/admin/admins", "Password changed");
}
