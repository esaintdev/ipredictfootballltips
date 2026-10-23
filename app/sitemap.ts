import type { MetadataRoute } from "next";
import { competitions } from "@/lib/queries";
import { CATEGORIES } from "@/lib/tips";
import { DAY_LINKS, WEEKDAY_LINKS } from "@/components/site/nav";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const comps = await competitions().catch(() => []);
  const pages = [
    "", "/leagues", "/results", "/accuracy", "/about",
    ...CATEGORIES.map((c) => `/${c.slug}`),
    ...[...DAY_LINKS, ...WEEKDAY_LINKS].map((l) => l.href),
  ];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const })),
    ...comps.map((c) => ({ url: `${base}/leagues/${c.slug}`, changeFrequency: "daily" as const })),
  ];
}
