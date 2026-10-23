import type { MetadataRoute } from "next";
import { competitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const comps = await competitions().catch(() => []);
  return [
    ...["", "/predictions", "/leagues", "/results", "/accuracy", "/about"].map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const })),
    ...comps.map((c) => ({ url: `${base}/leagues/${c.slug}`, changeFrequency: "daily" as const })),
  ];
}
