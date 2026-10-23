import Link from "next/link";
import type { ReactNode } from "react";
import { competitions } from "@/lib/queries";
import type { CategoryId, TipRow } from "@/lib/tips";
import { Board, CategoryTabs, DatePills, PageHero, QuickTabs, TipsTable, TopLeagues } from "./blocks";
import { CATEGORY_COPY, SeoContent } from "./content";
import { UpcomingPicks, WidgetRow } from "./widgets";

interface Props {
  title: string;
  intro: string;
  boardTitle: ReactNode;
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
  const comps = await competitions();
  const top = comps.filter((c) => c.category === "domestic").slice(0, 5);
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <QuickTabs active={p.quickActive} />
      <TopLeagues comps={top} />
      {p.before}
      <Board
        title={p.boardTitle}
        controls={p.date ? <DatePills date={p.date} base={p.base} /> : undefined}
        tabs={<CategoryTabs active={p.category} date={p.tabDate} />}
        footer={p.footer ?? (
          <>
            <Link href="/banker-of-the-day" className="s-btn s-btn-gold">Banker Tips ›</Link>
            <Link href="/accuracy" className="s-btn s-btn-primary">Our Track Record</Link>
            <Link href="/all-predictions" className="s-btn s-btn-outline sm:ml-auto">View all matches ›</Link>
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
