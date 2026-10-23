import Link from "next/link";
import type { ReactNode } from "react";
import { competitions, trackRecord } from "@/lib/queries";
import type { CategoryId, TipRow } from "@/lib/tips";
import { pct } from "@/components/ui";
import { Board, CategoryTabs, DatePills, PageHero, QuickTabs, TipsTable, TopLeagues, type HeroStat } from "./blocks";
import { CATEGORY_COPY, SeoContent } from "./content";
import { Icon } from "./icons";
import { UpcomingPicks, WidgetRow } from "./widgets";

interface Props {
  title: string;
  intro: string;
  boardTitle: ReactNode;
  boardSub?: ReactNode;
  category: CategoryId;
  rows: TipRow[];
  /** Date shown in the pills; omit for multi-day pages (weekend) */
  date?: string;
  /** Page URL the date pills link to */
  base: string;
  /** Date passed on to the category tabs */
  tabDate?: string;
  quickActive?: string;
  copy: keyof typeof CATEGORY_COPY;
  before?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
}

export async function TipsPage(p: Props) {
  const [comps, record] = await Promise.all([competitions(), trackRecord(30)]);
  const top = comps.filter((c) => c.category === "domestic").slice(0, 5);
  const best = p.rows.reduce((a, r) => Math.max(a, r.tip.p), 0);
  const stats: HeroStat[] = [
    { label: p.rows.length === 1 ? "Tip" : "Tips", value: String(p.rows.length), icon: "list" },
    ...(best ? [{ label: "Top confidence", value: pct(best), icon: "flame" as const }] : []),
    ...(record.overall.n ? [{ label: "1X2 hit rate · 30d", value: pct(record.overall.w1x2 / record.overall.n, 1), icon: "trend" as const }] : []),
  ];
  return (
    <>
      <PageHero title={p.title} intro={p.intro} stats={stats} />
      <QuickTabs active={p.quickActive} />
      <TopLeagues comps={top} />
      {p.before}
      <Board
        title={p.boardTitle}
        sub={p.boardSub}
        controls={p.date ? <DatePills date={p.date} base={p.base} /> : undefined}
        tabs={<CategoryTabs active={p.category} date={p.tabDate} />}
        footer={p.footer ?? (
          <>
            <Link href="/banker-of-the-day" className="s-btn s-btn-gold"><Icon name="target" size={17} />Banker Tips</Link>
            <Link href="/accuracy" className="s-btn s-btn-navy"><Icon name="chart" size={17} />Our Track Record</Link>
            <Link href="/all-predictions" className="s-btn s-btn-outline sm:ml-auto">View all matches<Icon name="chevronRight" size={16} /></Link>
          </>
        )}
      >
        <TipsTable rows={p.rows} empty={p.empty} />
      </Board>
      <UpcomingPicks />
      <WidgetRow />
      <SeoContent id={p.copy} />
    </>
  );
}
