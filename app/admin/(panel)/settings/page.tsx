import { modelParams, siteSettings } from "@/lib/settings";
import { apiKey } from "@/lib/api/football";
import { resetModelParams, saveModelParams, saveSiteSettings } from "../../actions";
import { Flash } from "@/components/Flash";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const [site, params] = await Promise.all([siteSettings(), modelParams()]);
  const env = [
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
    ["API_FOOTBALL_KEY", Boolean(apiKey())],
    ["AUTH_SECRET", Boolean(process.env.AUTH_SECRET)],
    ["CRON_SECRET", Boolean(process.env.CRON_SECRET)],
    ["NEXT_PUBLIC_SITE_URL", Boolean(process.env.NEXT_PUBLIC_SITE_URL)],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-sm text-muted">Site content, publishing rules and model parameters.</p>
      </div>
      <Flash msg={sp.msg} error={sp.error} />

      <div className="card p-5">
        <h2 className="mb-3 font-bold text-white">Environment</h2>
        <div className="flex flex-wrap gap-2">
          {env.map(([k, ok]) => <span key={k} className={`chip ${ok ? "chip-active" : "border-loss text-loss"}`}>{ok ? "✓" : "✕"} {k}</span>)}
        </div>
      </div>

      <form action={saveSiteSettings} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-bold text-white sm:col-span-2">Site & publishing</h2>
        <div><label className="label">Site name</label><input name="siteName" defaultValue={site.siteName} className="input" /></div>
        <div><label className="label">Tagline</label><input name="tagline" defaultValue={site.tagline} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Announcement banner (blank = hidden)</label><input name="announcement" defaultValue={site.announcement} className="input" /></div>
        <div><label className="label">Auto-feature tips with probability ≥ (%)</label><input type="number" name="featuredMinProb" defaultValue={Math.round(site.featuredMinProb * 100)} className="input" /></div>
        <div><label className="label">Max featured tips per day</label><input type="number" name="maxFeaturedPerDay" defaultValue={site.maxFeaturedPerDay} className="input" /></div>
        <div><label className="label">Prediction horizon (days ahead)</label><input type="number" name="horizonDays" defaultValue={site.horizonDays} className="input" /></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="autoPublish" defaultChecked={site.autoPublish} /> Auto-publish new predictions (teams with too little data always start as drafts)</label>
        <div className="sm:col-span-2"><button className="btn btn-primary">Save site settings</button></div>
      </form>

      <form action={saveModelParams} className="card grid gap-4 p-5 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <h2 className="font-bold text-white">Model parameters</h2>
          <p className="text-xs text-muted">Defaults were tuned by backtest on 2023-24 and validated out-of-sample on 2024-25 / 2025-26. Run a backtest before changing them.</p>
        </div>
        <div><label className="label">Half-life (days)</label><input type="number" name="halfLifeDays" defaultValue={params.halfLifeDays} className="input" /></div>
        <div><label className="label">Max history (days)</label><input type="number" name="maxAgeDays" defaultValue={params.maxAgeDays} className="input" /></div>
        <div><label className="label">Shrinkage (pseudo-matches)</label><input type="number" step="0.5" name="shrinkage" defaultValue={params.shrinkage} className="input" /></div>
        <div><label className="label">Unknown team attack</label><input type="number" step="0.01" name="unknownAttack" defaultValue={params.unknownAttack} className="input" /></div>
        <div><label className="label">Unknown team defence</label><input type="number" step="0.01" name="unknownDefence" defaultValue={params.unknownDefence} className="input" /></div>
        <div><label className="label">Fitting iterations</label><input type="number" name="iterations" defaultValue={params.iterations} className="input" /></div>
        <div className="flex gap-2 sm:col-span-3">
          <button className="btn btn-primary">Save model parameters</button>
          <button formAction={resetModelParams} className="btn btn-ghost">Reset to defaults</button>
        </div>
      </form>
    </div>
  );
}
