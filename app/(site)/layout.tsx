import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/site/MobileMenu";
import { NavLinks } from "@/components/site/NavLinks";
import { THEME_SCRIPT, ThemeToggle } from "@/components/site/ThemeToggle";
import { DAY_LINKS, MAIN_NAV, TIP_LINKS, WEEKDAY_LINKS } from "@/components/site/nav";
import { siteSettings } from "@/lib/settings";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "How It Works" },
  { href: "/accuracy", label: "Accuracy & Backtests" },
  { href: "/results", label: "Results" },
  { href: "/leagues", label: "Leagues" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await siteSettings().catch(() => null);
  return (
    <div className="site flex min-h-screen flex-col">
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <header className="sticky top-0 z-40 bg-navy shadow-lg shadow-black/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

      <footer className="mt-12 bg-navy text-white/80">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-3 lg:grid-cols-5">
          <FooterCol title="Quick Links" links={QUICK_LINKS} />
          <FooterCol title="Predictions" links={[...DAY_LINKS, { href: "/all-predictions", label: "All Predictions" }, { href: "/banker-of-the-day", label: "Banker of the Day" }]} />
          <FooterCol title="Prediction By Days" links={WEEKDAY_LINKS} />
          <FooterCol title="Football Tips" links={TIP_LINKS.slice(3, 10)} />
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-4 font-bold text-white">About Us</h3>
            <p className="text-sm leading-relaxed text-white/70">
              {site?.siteName ?? "iPredictFootballTips"} publishes free, statistical football predictions from a Dixon-Coles Poisson model,
              refreshed daily and graded in public.
            </p>
            <Link href="/accuracy" className="mt-3 inline-block text-sm font-semibold text-brand-solid hover:underline">See our track record →</Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <div className="rounded-xl bg-gradient-to-r from-loss to-[#b42328] px-4 py-3 text-center text-sm text-white">
            <b>18+</b> · You must be 18 years old or over to use this site. Predictions are probabilities, not guarantees.{" "}
            <a href="https://www.begambleaware.org" target="_blank" rel="noreferrer" className="font-semibold underline">Please play responsibly</a>
          </div>
          <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-gold">
            © {new Date().getFullYear()} {site?.siteName ?? "iPredictFootballTips"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 font-bold text-white">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-brand-solid">{l.label}</Link></li>)}
      </ul>
    </div>
  );
}
