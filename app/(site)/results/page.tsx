import Link from "next/link";
import type { Metadata } from "next";
import { settledForDay } from "@/lib/queries";
import { CATEGORIES, tipResult, tipsFor, type CategoryId } from "@/lib/tips";
import { addDays, Board, DayPill, longDate, PageHero, QuickTabs, TipsTable, todayIso, validDate } from "@/components/site/blocks";
import { DatePicker, Scroller } from "@/components/site/client";
import { WidgetRow } from "@/components/site/widgets";
import { pct } from "@/components/ui";
import { Icon } from "@/components/site/icons";

export const metadata: Metadata = { title: "Prediction Results", description: "Yesterday's football predictions graded: every published tip with the final score and WON or LOST." };

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ date?: string; tips?: string }> }) {
  const sp = await searchParams;
  const today = todayIso();
  const date = validDate(sp.date) ?? addDays(today, -1);
  const cat = CATEGORIES.find((c) => c.id === sp.tips && c.id !== "free")?.id ?? ("all" as CategoryId);
  const rows = tipsFor(cat, await settledForDay(date));
  const graded = rows.map(tipResult).filter((w) => w != null);
  const won = graded.filter(Boolean).length;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 7));
  const href = (p: { date?: string; tips?: string }) => {
    const u = new URLSearchParams({ date: p.date ?? date });
    const tips = p.tips ?? cat;
    if (tips !== "all") u.set("tips", tips);
    return `/results?${u}`;
  };

  return (
    <>
      <PageHero title="Prediction Results" eyebrow="Graded in public" intro="Every published tip is frozen at kick-off and graded automatically after the final whistle. Nothing is deleted." />
      <QuickTabs active="/results" />
      <Board
        title="Results"
        sub={longDate(date)}
        controls={
          <div className="flex items-center gap-2">
            <Scroller className="max-w-[calc(100vw-7rem)] sm:max-w-none">
              {days.map((d) => <DayPill key={d} d={d} on={d === date} today={today} href={href({ date: d })} />)}
            </Scroller>
            <DatePicker value={date} base={`/results?${cat !== "all" ? `tips=${cat}&` : ""}`} />
          </div>
        }
        tabs={
          <Scroller className="-mx-1 px-1 pb-1">
            {CATEGORIES.filter((c) => c.id !== "free").map((c) => (
              <Link key={c.id} href={href({ tips: c.id })} data-active={c.id === cat} className={`s-pill ${c.id === cat ? "s-pill-active" : ""}`}>{c.label}</Link>
            ))}
          </Scroller>
        }
      >
        {graded.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-3 text-sm sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 font-bold text-accent"><Icon name="check" size={15} />Won {won}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-loss/12 px-3 py-1.5 font-bold text-loss"><Icon name="xCircle" size={15} />Lost {graded.length - won}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 font-semibold text-white"><Icon name="trend" size={15} className="text-brand-solid" />Hit rate {pct(won / graded.length, 1)}</span>
          </div>
        )}
        <TipsTable rows={rows} empty="No graded tips in this category for this day." pageSize={50} />
      </Board>
      <WidgetRow />
    </>
  );
}
