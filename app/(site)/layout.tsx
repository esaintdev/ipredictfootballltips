import Link from "next/link";
import { Icon, LogoMark } from "@/components/site/icons";
import { MobileMenu } from "@/components/site/MobileMenu";
import { NavLinks } from "@/components/site/NavLinks";
import { THEME_SCRIPT, ThemeToggle } from "@/components/site/ThemeToggle";
import { DAY_LINKS, MAIN_NAV, TIP_LINKS, WEEKDAY_LINKS } from "@/components/site/nav";
import { dbSetupHint } from "@/lib/db";
import { siteSettings } from "@/lib/settings";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "How It Works" },
  { href: "/accuracy", label: "Accuracy & Backtests" },
  { href: "/results", label: "Results" },
  { href: "/leagues", label: "Leagues" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let setupHint: string | null = null;
  const site = await siteSettings().catch((e) => {
    console.error("Database check failed:", e);
    setupHint = dbSetupHint(e);
    return null;
  });
  return (
    <div className="site flex min-h-screen flex-col">
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy/95 shadow-lg shadow-black/10 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <SiteLogo name={site?.siteName} />
          <NavLinks main={MAIN_NAV} tips={TIP_LINKS} />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileMenu main={MAIN_NAV} tips={TIP_LINKS} days={DAY_LINKS} />
          </div>
        </div>
      </header>

      {site?.announcement && (
        <div className="bg-gold px-4 py-2 text-center text-sm font-semibold text-[#060b16]">{site.announcement}</div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{setupHint ? <SetupNotice hint={setupHint} /> : children}</main>

      <footer className="relative mt-14 overflow-hidden bg-navy text-white/75">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-solid via-gold to-brand-solid" />
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 pt-14 pb-10 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <SiteLogo name={site?.siteName} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Free, statistical football predictions from a Dixon-Coles Poisson model, refreshed daily and graded in public.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-white/80 ring-1 ring-white/10"><Icon name="shield" size={14} className="text-brand-solid" />Backtested model</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-white/80 ring-1 ring-white/10"><Icon name="check" size={14} className="text-brand-solid" />Every tip graded</span>
            </div>
            <Link href="/accuracy" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-solid hover:underline">See our track record<Icon name="chevronRight" size={16} /></Link>
          </div>
          <FooterCol title="Quick Links" links={QUICK_LINKS} />
          <FooterCol title="Predictions" links={[...DAY_LINKS.map((l) => ({ ...l, label: l.label.replace(/Football Predictions for (the )?/, "") })), { href: "/all-predictions", label: "All Predictions" }, { href: "/banker-of-the-day", label: "Banker of the Day" }]} />
          <FooterCol title="By Day" links={WEEKDAY_LINKS.map((l) => ({ ...l, label: l.label.replace(" Football Predictions", "") }))} />
          <FooterCol title="Football Tips" links={TIP_LINKS.slice(3, 10)} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <div className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-loss to-[#b42328] px-4 py-3 text-center text-sm text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-loss">18+</span>
            <span>You must be 18 or over to use this site. Predictions are probabilities, not guarantees.{" "}
              <a href="https://www.begambleaware.org" target="_blank" rel="noreferrer" className="font-semibold underline">Please play responsibly</a></span>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm sm:flex-row">
            <span className="text-gold">© {new Date().getFullYear()} {site?.siteName ?? "iPredictFootballTips"}. All rights reserved.</span>
            <span className="text-white/40">Fair odds = 1 / model probability. No bookmaker margin.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SiteLogo({ name = "iPredictFootballTips" }: { name?: string }) {
  const m = /^(i?Predict)(Football)(.*)$/.exec(name);
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${name} home`}>
      <LogoMark size={36} />
      <span className="font-display text-[1.35rem] leading-none font-bold tracking-wide text-white sm:text-[1.5rem]">
        {m ? <>{m[1]}<span className="text-brand-solid">{m[2]}</span>{m[3]}</> : name}
      </span>
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-lg font-bold tracking-wide text-white uppercase">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => <li key={l.href}><Link href={l.href} className="transition hover:text-brand-solid">{l.label}</Link></li>)}
      </ul>
    </div>
  );
}

/** Shown instead of the page when the database isn't reachable, so the cause is visible even in production builds. */
function SetupNotice({ hint }: { hint: string }) {
  return (
    <div className="s-card mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-loss/10 text-loss"><Icon name="alert" size={26} /></span>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-wide text-fg uppercase">Database not connected</h1>
      <p className="mt-2 text-sm leading-relaxed text-subtle">{hint}</p>
    </div>
  );
}
