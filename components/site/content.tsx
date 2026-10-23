import Link from "next/link";
import type { ReactNode } from "react";
import type { CategoryId } from "@/lib/tips";

interface Copy { body: ReactNode; faq: [string, ReactNode][] }

const HOW = (
  <>
    <h2>How our model picks these matches</h2>
    <p>
      Every tip comes from the same statistical model: each team gets an attack and a defence rating fitted on years of results, recent matches
      count more, and home advantage is estimated from the data. Those ratings become expected goals, then a probability for every scoreline from
      0-0 to 10-10, and finally a probability for every market. <Link href="/about">Read how it works</Link>.
    </p>
  </>
);

const ODDS_FAQ: [string, ReactNode] = [
  "What are the odds in the table?",
  "They are fair odds: 1 divided by the model's probability, with no bookmaker margin. If a bookmaker offers a higher price than our fair odds, the model sees value in that bet.",
];
const DAILY_FAQ: [string, ReactNode] = [
  "Are the predictions updated daily?",
  "Yes. Fixtures and results sync automatically every day, the model is refitted, and predictions for the coming week are regenerated. Tips are frozen at kick-off and graded after the final whistle.",
];

export const CATEGORY_COPY: Record<CategoryId | "home" | "day", Copy> = {
  home: {
    body: (
      <>
        <h2>Free football predictions, backed by data</h2>
        <p>
          iPredictFootballTips publishes free predictions for the top 15 domestic leagues, every UEFA competition and FIFA national-team football.
          Instead of gut feeling, every tip comes from a Dixon-Coles Poisson model that has been backtested on thousands of past matches.
        </p>
        <p>
          Use the tabs above to switch between markets: <Link href="/banker-of-the-day">banker of the day</Link>,{" "}
          <Link href="/double-chance-predictions">double chance</Link>, <Link href="/over-2-5-goals-predictions">over 2.5 goals</Link>,{" "}
          <Link href="/btts-gg-predictions">both teams to score</Link>, <Link href="/correct-score-predictions">correct score</Link> and more.
        </p>
        {HOW}
        <h2>Graded in public</h2>
        <p>
          Every published tip is graded automatically, and nothing is deleted. Check yesterday&apos;s tips on the <Link href="/results">results page</Link>{" "}
          and our long-run hit rates on the <Link href="/accuracy">accuracy page</Link>.
        </p>
      </>
    ),
    faq: [DAILY_FAQ, ODDS_FAQ, ["Which competitions do you cover?", "The top 15 domestic leagues, the Champions League, Europa League and Conference League, plus the World Cup, Euros, Nations League and other national-team competitions. Men's senior football only."]],
  },
  day: {
    body: (
      <>
        <h2>Every match, one page</h2>
        <p>
          This page lists every match we cover on the chosen day with the model&apos;s best tip. The best tip is the most likely outcome across 1X2,
          double chance, goals and BTTS markets, skipping near-certainties priced below about 1.20.
        </p>
        {HOW}
      </>
    ),
    faq: [DAILY_FAQ, ODDS_FAQ],
  },
  free: {
    body: (
      <>
        <h2>What are free tips?</h2>
        <p>
          Free tips are the model&apos;s best pick for each match where it is at least 65% confident. For every fixture we compare 1X2, double chance,
          over/under goals and both-teams-to-score, and keep the most likely outcome that still has a sensible price.
        </p>
        {HOW}
      </>
    ),
    faq: [DAILY_FAQ, ODDS_FAQ, ["Can I use these tips in accumulators?", "You can, but remember that probabilities multiply: four 75% picks together land only about 32% of the time."]],
  },
  all: {
    body: (
      <>
        <h2>All predictions in one place</h2>
        <p>
          Every match we cover today, with the model&apos;s best tip, fair odds and confidence. Open any match for the full breakdown: 1X2
          probabilities, every goal line, BTTS, the correct score grid, recent form and head-to-head.
        </p>
        {HOW}
      </>
    ),
    faq: [DAILY_FAQ, ODDS_FAQ],
  },
  banker: {
    body: (
      <>
        <h2>How we choose the banker of the day</h2>
        <p>
          The banker is simply the highest-probability tip of the day, taken from the model&apos;s best tip for every match. We skip near-certain
          markets priced below about 1.20, so the banker is always a pick worth having on its own.
        </p>
        <p>A banker means high confidence, not certainty. Even an 80% pick loses one time in five, so stake sensibly.</p>
        {HOW}
      </>
    ),
    faq: [["Is the banker guaranteed?", "No. Nothing in football is. Our backtests show high-confidence picks win much more often than average, but they still lose sometimes."], ODDS_FAQ],
  },
  "two-odds": {
    body: (
      <>
        <h2>How the 2 odds accumulator is built</h2>
        <p>
          We take the safest best tips of the day, one per match, and add them in order of probability until the combined fair odds reach about
          2.00 (at most four selections). Fewer legs means fewer ways to lose.
        </p>
        {HOW}
      </>
    ),
    faq: [["Why are there sometimes no 2 odds tips?", "If there aren't enough confident picks on the day to reach odds of about 2.00 in four selections or fewer, we don't force it."], ODDS_FAQ],
  },
  "double-chance": {
    body: (
      <>
        <h2>What is double chance?</h2>
        <p>
          A double chance bet covers two of the three match outcomes: <b>1X</b> wins if the home team wins or draws, <b>X2</b> wins if the away
          team wins or draws. We list the stronger side of each match when the model rates it at 70% or more.
        </p>
        {HOW}
      </>
    ),
    faq: [["Is double chance safer than a straight win?", "Yes, because it covers two outcomes, but the odds are lower to match."], ODDS_FAQ],
  },
  "over-1-5": {
    body: (
      <>
        <h2>Over 1.5 goals explained</h2>
        <p>An over 1.5 goals bet wins if the match has two or more goals. We list matches where the model rates that at 70% or more, based on both teams&apos; expected goals.</p>
        {HOW}
      </>
    ),
    faq: [["Do goals in extra time count?", "No. Like bookmakers, we grade goals markets on the regular-time score."], ODDS_FAQ],
  },
  "over-2-5": {
    body: (
      <>
        <h2>Over 2.5 goals explained</h2>
        <p>Over 2.5 goals wins with three or more goals in the match. These are the matches where the model&apos;s headline goals tip is <b>over</b>.</p>
        {HOW}
      </>
    ),
    faq: [["How accurate are your over/under tips?", <>See the <Link href="/accuracy">accuracy page</Link> for our backtested and live hit rates by goal line and confidence level.</>], ODDS_FAQ],
  },
  "super-single": {
    body: (
      <>
        <h2>What is a super single?</h2>
        <p>
          A super single is one bet on its own, without an accumulator. We pick the most likely tips whose fair odds sit between 1.40 and 2.00,
          the range where a single bet still pays something worthwhile.
        </p>
        {HOW}
      </>
    ),
    faq: [ODDS_FAQ, DAILY_FAQ],
  },
  btts: {
    body: (
      <>
        <h2>Both teams to score (GG)</h2>
        <p>BTTS, or GG, wins if both teams score at least once. We list matches where the model gives both sides a combined 55% or better chance of scoring.</p>
        {HOW}
      </>
    ),
    faq: [["What does GG mean?", "GG (goal-goal) is another name for both teams to score: yes. NG (no goal) means at least one team fails to score."], ODDS_FAQ],
  },
  "ou-3-5": {
    body: (
      <>
        <h2>Over/Under 3.5 goals</h2>
        <p>Under 3.5 wins with three goals or fewer; over 3.5 needs four or more. We show whichever side the model rates at 65% or more.</p>
        {HOW}
      </>
    ),
    faq: [ODDS_FAQ, DAILY_FAQ],
  },
  draw: {
    body: (
      <>
        <h2>Draw predictions</h2>
        <p>
          Draws are the hardest outcome to predict, so we rank matches by the model&apos;s draw probability and list the evenly matched games where it is
          28% or higher. That is above the typical draw rate, and the fair odds reflect it.
        </p>
        {HOW}
      </>
    ),
    faq: [["Why are draw confidence numbers lower?", "A draw is rarely the single most likely outcome, so even our best draw picks sit around 30–35%. The fair odds tell you what price would be worth taking."], ODDS_FAQ],
  },
  "home-win": {
    body: (
      <>
        <h2>Home win predictions</h2>
        <p>Matches where the home team is the model&apos;s 1X2 pick with at least a 50% win probability. Home advantage is measured from the data, and neutral-venue tournament games get none.</p>
        {HOW}
      </>
    ),
    faq: [ODDS_FAQ, DAILY_FAQ],
  },
  "away-win": {
    body: (
      <>
        <h2>Away win predictions</h2>
        <p>Matches where the visiting team is the model&apos;s 1X2 pick with at least a 45% win probability, despite the home side&apos;s advantage.</p>
        {HOW}
      </>
    ),
    faq: [ODDS_FAQ, DAILY_FAQ],
  },
  "correct-score": {
    body: (
      <>
        <h2>Correct score predictions</h2>
        <p>
          The single most likely scoreline from the full Dixon-Coles score grid. Correct score is a long shot by nature: our top pick is right
          roughly one time in eight, and the real score is in our top three about a third of the time.
        </p>
        {HOW}
      </>
    ),
    faq: [["Where can I see other likely scores?", "Open any match to see the full probability grid for every scoreline."], ODDS_FAQ],
  },
};

export function SeoContent({ id }: { id: keyof typeof CATEGORY_COPY }) {
  const c = CATEGORY_COPY[id];
  return (
    <section className="s-card s-prose mt-6 p-5 text-fg/90 sm:p-8 [&>h2:first-child]:mt-0">
      {c.body}
      <h2>Frequently Asked Questions</h2>
      {c.faq.map(([q, a]) => (
        <div key={q}>
          <h3>{q}</h3>
          <p>{a}</p>
        </div>
      ))}
    </section>
  );
}
