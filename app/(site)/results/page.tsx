import Link from "next/link";
import type { Metadata } from "next";
import { settledForDay } from "@/lib/queries";
import { CATEGORIES, tipResult, tipsFor, type CategoryId } from "@/lib/tips";
import { addDays, Board, longDate, PageHero, QuickTabs, TipsTable, todayIso, validDate } from "@/components/site/blocks";
import { DatePicker, Scroller } from "@/components/site/client";
import { WidgetRow } from "@/components/site/widgets";
import { pct } from "@/components/ui";

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
      <PageHero title="Prediction Results" intro="Every published tip is frozen at kick-off and graded automatically after the final whistle. Nothing is deleted." />
      <QuickTabs active="/results" />
      <Board
        title={<>Results<span className="mt-1 block text-sm font-medium text-subtle">{longDate(date)}</span></>}
        controls={
          <div className="flex items-center gap-2">
            <Scroller className="max-w-[calc(100vw-7rem)] sm:max-w-none">
              {days.map((d) => (
                <Link key={d} href={href({ date: d })} data-active={d === date}
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl leading-tight ${d === date ? "bg-brand-solid text-[#060b16]" : "bg-surface-2 text-subtle hover:text-fg"}`}>
                  <span className="text-[10px] font-semibold uppercase">{new Date(d).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                  <span className="text-base font-extrabold">{new Date(d).getUTCDate()}</span>
                </Link>
              ))}
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
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg bg-accent-soft px-3 py-1.5 font-bold text-accent">Won {won}</span>
            <span className="rounded-lg bg-loss/15 px-3 py-1.5 font-bold text-loss">Lost {graded.length - won}</span>
            <span className="rounded-lg bg-surface-2 px-3 py-1.5 font-semibold text-fg">Hit rate {pct(won / graded.length, 1)}</span>
          </div>
        )}
        <TipsTable rows={rows} empty="No graded tips in this category for this day." pageSize={50} />
      </Board>
      <WidgetRow />
    </>
  );
}
