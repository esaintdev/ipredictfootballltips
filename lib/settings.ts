import { q, q1 } from "./db";
import { DEFAULT_PARAMS, type ModelParams } from "./model/ratings";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await q1<{ value: T }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row ? row.value : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await q(
    "INSERT INTO settings(key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, JSON.stringify(value)],
  );
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  announcement: string;
  autoPublish: boolean;
  /** Minimum 1X2 probability for a match to be auto-featured as a "Top Tip". */
  featuredMinProb: number;
  maxFeaturedPerDay: number;
  /** Days ahead to generate predictions for. */
  horizonDays: number;
}

export const DEFAULT_SITE: SiteSettings = {
  siteName: "iPredictFootballTips",
  tagline: "AI-powered football predictions, backed by data",
  announcement: "",
  autoPublish: true,
  featuredMinProb: 0.6,
  maxFeaturedPerDay: 6,
  horizonDays: 7,
};

export async function siteSettings(): Promise<SiteSettings> {
  return { ...DEFAULT_SITE, ...(await getSetting<Partial<SiteSettings>>("site", {})) };
}

export async function modelParams(): Promise<ModelParams> {
  return { ...DEFAULT_PARAMS, ...(await getSetting<Partial<ModelParams>>("model_params", {})) };
}
