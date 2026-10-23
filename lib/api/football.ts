// Thin client for API-Football v3 (api-sports.io or RapidAPI host).

import { getSetting, setSetting } from "../settings";

export interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string }; venue?: { name?: string | null } };
  league: { id: number; season: number; round?: string; name: string };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
  score?: { fulltime?: { home: number | null; away: number | null } };
}
export interface ApiTeam { id: number; name: string; logo?: string }

export interface ApiLeague {
  league: { id: number; name: string; type: string; logo: string };
  country: { name: string; flag: string | null };
  seasons: { year: number; current: boolean }[];
}

export class ApiFootballError extends Error {}

let callsThisProcess = 0;
export function apiCallCount() { return callsThisProcess; }

export function apiKey(): string | undefined {
  return process.env.API_FOOTBALL_KEY || process.env.APIFOOTBALL_KEY || process.env.API_SPORTS_KEY || process.env.RAPIDAPI_KEY;
}

export async function apiGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const key = apiKey();
  if (!key) throw new ApiFootballError("API-Football key missing. Set API_FOOTBALL_KEY in the environment.");
  const rapid = Boolean(process.env.RAPIDAPI_KEY && !process.env.API_FOOTBALL_KEY);
  const host = rapid ? "https://api-football-v1.p.rapidapi.com/v3" : (process.env.API_FOOTBALL_HOST ?? "https://v3.football.api-sports.io");
  const url = new URL(host + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const headers: Record<string, string> = rapid
    ? { "x-rapidapi-key": key, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" }
    : { "x-apisports-key": key };

  const out: T[] = [];
  let page = 1;
  for (;;) {
    if (page > 1) url.searchParams.set("page", String(page));
    const res = await fetch(url, { headers, cache: "no-store" });
    callsThisProcess++;
    const remaining = res.headers.get("x-ratelimit-requests-remaining");
    const limit = res.headers.get("x-ratelimit-requests-limit");
    if (remaining) await setSetting("api_quota", { remaining: Number(remaining), limit: Number(limit ?? 0), at: new Date().toISOString() }).catch(() => {});
    if (!res.ok) throw new ApiFootballError(`API-Football ${res.status} on ${path}`);
    const json = (await res.json()) as { response: T[]; errors: unknown; paging?: { current: number; total: number } };
    const errs = json.errors && (Array.isArray(json.errors) ? json.errors : Object.values(json.errors as object));
    if (errs && (errs as unknown[]).length) throw new ApiFootballError(`API-Football: ${JSON.stringify(json.errors)}`);
    out.push(...json.response);
    if (!json.paging || json.paging.current >= json.paging.total) break;
    page++;
  }
  return out;
}

export async function quota() {
  return getSetting<{ remaining: number; limit: number; at: string } | null>("api_quota", null);
}

export const FINISHED = ["FT", "AET", "PEN"];
export const DEAD = ["PST", "CANC", "ABD", "AWD", "WO"];
