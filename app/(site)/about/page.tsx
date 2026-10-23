import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, QuickTabs } from "@/components/site/blocks";

export const metadata: Metadata = { title: "How it works" };

export default function About() {
  return (
    <>
      <PageHero title="How Our Predictions Work" intro="A statistical goals model instead of gut feeling. Every prediction on the site comes from the same transparent process, refreshed every day as new results come in." />
      <QuickTabs />
      <article className="s-card s-prose mt-6 p-5 text-fg/90 sm:p-8 [&>h2:first-child]:mt-0">
        <h2>1. Team ratings</h2>
        <p>
          Each team gets an <b>attack</b> and a <b>defence</b> rating, fitted from thousands of recent results across all the competitions we cover.
          Recent matches count more: a result loses half its weight about every 8 months. Teams with little data are pulled towards the average, so
          early-season and newly-promoted sides don&apos;t produce wild numbers. Home advantage is estimated from the data, and tournament matches at
          neutral venues are treated as neutral.
        </p>
        <h2>2. From expected goals to every scoreline</h2>
        <p>
          Combining the two teams&apos; ratings gives the expected goals for each side. From those we compute the probability of every scoreline from 0-0
          to 10-10 using a Poisson model with the Dixon-Coles correction, which fixes the classic under-estimation of 0-0, 1-0, 0-1 and 1-1 results.
        </p>
        <h2>3. Markets and tip categories</h2>
        <ul>
          <li><b>Match winner (1X2) and double chance:</b> sums of the home-win, draw and away-win scorelines.</li>
          <li><b>Over/Under goals:</b> probability of more than 0.5 / 1.5 / 2.5 / 3.5 / 4.5 total goals.</li>
          <li><b>Both teams to score (GG):</b> probability that both sides score at least once.</li>
          <li><b>Correct score:</b> the single most likely scoreline, plus the full probability grid on each match page.</li>
        </ul>
        <p>
          Our tip categories, such as <Link href="/banker-of-the-day">Banker of the Day</Link>, <Link href="/2-odds-predictions">2 Odds</Link> and{" "}
          <Link href="/over-1-5-goals-predictions">Over 1.5 Goals</Link>, are filters on these probabilities. The odds we show are <b>fair odds</b>: 1
          divided by the probability, with no bookmaker margin.
        </p>
        <h2>4. Honest testing</h2>
        <p>
          We backtest by replaying past seasons week by week: the model is refitted using only matches played before each week, then predicts that
          week&apos;s fixtures. Live tips are frozen at kick-off and graded automatically. See the <Link href="/accuracy">accuracy page</Link> and{" "}
          <Link href="/results">daily results</Link>.
        </p>
        <h2>Coverage</h2>
        <p>
          The top 15 domestic leagues, the Champions League, Europa League, Conference League, UEFA Super Cup, Euros, Nations League, the World Cup
          and its qualifiers, continental national-team tournaments and international friendlies. Men&apos;s senior football only.
        </p>
        <div className="rounded-2xl border border-loss/40 bg-loss/10 p-5 text-sm">
          <b className="text-loss">18+ · Please gamble responsibly.</b> Football is unpredictable: even an 80% tip loses one time in five. Our
          predictions are for information and entertainment, not financial advice.
        </div>
      </article>
    </>
  );
}
