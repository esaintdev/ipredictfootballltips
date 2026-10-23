import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works" };

export default function About() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-slate-300">
      <h1 className="text-3xl font-black text-white">How our AI predictions work</h1>
      <p>
        iPredictFootballTips uses a statistical goals model rather than gut feeling. Every prediction on the site comes from the same
        transparent process, which is refreshed every day as new results come in.
      </p>
      <h2 className="text-xl font-bold text-white">1. Team ratings</h2>
      <p>
        Each team gets an <b>attack</b> and a <b>defence</b> rating, fitted from thousands of recent results across all the competitions we cover.
        Recent matches count more: a result loses half its weight about every 8 months. Teams with little data are pulled towards the average, so
        early-season and newly-promoted sides don&apos;t produce wild numbers. Home advantage is estimated from the data, and tournament matches at
        neutral venues are treated as neutral.
      </p>
      <h2 className="text-xl font-bold text-white">2. Expected goals → every scoreline</h2>
      <p>
        Combining the two teams&apos; ratings gives the expected goals for each side. From those we compute the probability of every scoreline from 0-0
        to 10-10 using a Poisson model with the Dixon-Coles correction, which fixes the classic under-estimation of 0-0, 1-0, 0-1 and 1-1 results.
      </p>
      <h2 className="text-xl font-bold text-white">3. Markets</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Match winner (1X2):</b> sum of all home-win, draw and away-win scorelines. The tip is the most likely outcome; stars show confidence.</li>
        <li><b>Over/Under goals:</b> probability of more than 0.5 / 1.5 / 2.5 / 3.5 / 4.5 total goals. The headline tip uses the 2.5 line.</li>
        <li><b>Both teams to score:</b> probability that both sides score at least once.</li>
        <li><b>Correct score:</b> the single most likely scoreline, plus the full probability grid on each match page.</li>
      </ul>
      <h2 className="text-xl font-bold text-white">4. Honest testing</h2>
      <p>
        We backtest by replaying past seasons week by week: the model is refitted using only matches played before each week, then predicts that
        week&apos;s fixtures. Live tips are frozen at kick-off and graded automatically. See the <a href="/accuracy" className="text-brand">accuracy page</a>.
      </p>
      <h2 className="text-xl font-bold text-white">Coverage</h2>
      <p>
        The top 15 domestic leagues, the Champions League, Europa League, Conference League, UEFA Super Cup, Euros, Nations League, the World Cup
        and its qualifiers, continental national-team tournaments and international friendlies. Men&apos;s senior football only.
      </p>
      <div className="card border-loss/40 p-5 text-sm">
        <b className="text-loss">18+ · Please gamble responsibly.</b> Football is unpredictable: even an 80% tip loses one time in five. Our
        predictions are for information and entertainment, not financial advice.
      </div>
    </article>
  );
}
