# iPredictFootballTips

AI football prediction website built with **Next.js 15 (App Router) + Postgres**, with predictions for:

- **Match winner (1X2)** with confidence stars
- **Over/Under goals** (0.5 – 4.5 lines, headline tip on 2.5)
- **Both teams to score**
- **Correct score** (most likely score + full probability grid)

Coverage: the top 15 domestic leagues, all UEFA competitions, and FIFA / national-team football. Men's senior football only; women's and youth competitions are filtered out.

## The model

`lib/model/` is a self-contained **Dixon-Coles Poisson model**:

1. Every team gets attack and defence ratings, fitted by weighted iterative proportional fitting on up to about 3 years of results. Weights decay with a 240-day half-life, and a shrinkage prior pulls teams with little data towards average.
2. Home advantage and the Dixon-Coles low-score correction (ρ) are estimated from the data. Competitions flagged *neutral* (World Cup, Euros, Super Cup and so on) get no home advantage.
3. Expected goals → a 0-0 to 10-10 score matrix → every market.

A single fit covers all competitions, so UEFA matches between clubs from different leagues link the leagues' strength scales.

## Backtest results (out-of-sample)

`npm run backtest:offline` downloads public results from openfootball, tunes the parameters on 2023-24, then runs a weekly walk-forward test on **2024-25 and 2025-26**. The model is refitted every week using only matches played before that week.

7,153 matches across 12 competitions:

| Market | Accuracy |
|---|---|
| Match winner (1X2) | **50.6%** (always picking home: 43.8%) |
| 1X2 tips with probability ≥ 60% | **70.4%** (22% of matches) |
| 1X2 tips with probability ≥ 70% | **79.3%** (9% of matches) |
| Over/Under 1.5 | 76.5% |
| Over/Under 2.5 | 55.6% (≥ 65% confidence: 61.7%) |
| Over/Under 3.5 | 69.4% |
| BTTS | 53.5% |
| Correct score (top pick) | 12.8% (actual score in top 3: 33.0%) |
| 1X2 log loss | 1.000 (uniform guess: 1.099) |

The model is well calibrated (see `/accuracy`). Football is noisy: a typical ceiling for 1X2 accuracy is around 53–55%, even for bookmakers. The value is in the probabilities and the high-confidence subset. The full report is in `data/offline-backtest.json`, and the website renders it at `/accuracy`.

You can run backtests on your own API-Football data from **Admin → Backtests**: pick a date range, competitions and parameters, then publish a run to the accuracy page or apply its parameters to the live model.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:migrate           # optional: tables are also created automatically on first request
npm run dev
```

Then:

1. Sign in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. **Sync & Jobs → Refresh competition metadata** (1 API call) to set each competition's current season.
3. **Import history**, 3 seasons. That's one call per competition per season, about 100 calls for everything.
4. **Run daily pipeline**: sync fixtures and results → grade → predict.

### No API key yet?

`npm run seed:demo` loads real results and the current season's fixtures for 12 competitions from openfootball (stored with negative ids). The whole site and admin panel can then be explored. `npm run seed:demo -- --clear` removes it again.

### Automation

`vercel.json` runs `/api/cron` daily (Vercel sends `Authorization: Bearer $CRON_SECRET`). For more frequent updates, point an external scheduler at `/api/cron?secret=$CRON_SECRET` every 2–4 hours. Each run costs about 10 API calls (one per day in the window), however many competitions are enabled.

> API-Football's free plan has 100 requests a day and limited season access. For live current-season data, use a paid plan.

## Admin control panel (`/admin`)

- **Dashboard**: data counts, API quota, 30-day hit rates, one-click jobs, setup checklist
- **Predictions**: per day; override 1X2 / O/U / score, analyst notes, feature, publish or unpublish, regenerate. Tips lock at kick-off and can't be edited afterwards.
- **Competitions**: enable or disable, ordering, current season, neutral venue; add any league by API-Football id (women's and youth leagues rejected)
- **Backtests**: walk-forward runs with full reports (by confidence, calibration, per competition and season)
- **Sync & Jobs**: history import, pipeline steps, job log
- **Settings**: site text and announcement banner, auto-publish and auto-feature rules, model parameters
- **Admins**: add or remove admins, change password

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | model unit tests |
| `npm run lint` | type-check |
| `npm run backtest:offline` | public-data backtest → `data/offline-backtest.json` |
| `npm run seed:demo` | demo data without an API key |
| `npm run db:migrate` | create the schema |
