export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS competitions (
  id            INTEGER PRIMARY KEY,           -- API-Football league id
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'domestic', -- domestic | uefa | fifa
  type          TEXT NOT NULL DEFAULT 'league',   -- league | cup
  is_national   BOOLEAN NOT NULL DEFAULT FALSE,   -- national-team competition
  neutral       BOOLEAN NOT NULL DEFAULT FALSE,   -- usually played at neutral venues
  logo          TEXT,
  flag          TEXT,
  current_season INTEGER,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  priority      INTEGER NOT NULL DEFAULT 100,
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS teams (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  country     TEXT,
  logo        TEXT,
  is_national BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS fixtures (
  id             INTEGER PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season         INTEGER NOT NULL,
  round          TEXT,
  kickoff        TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL,                -- API-Football short status (NS, FT, AET, PEN, PST…)
  home_team_id   INTEGER NOT NULL REFERENCES teams(id),
  away_team_id   INTEGER NOT NULL REFERENCES teams(id),
  home_goals     INTEGER,
  away_goals     INTEGER,
  venue          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fixtures_kickoff_idx ON fixtures(kickoff);
CREATE INDEX IF NOT EXISTS fixtures_comp_idx ON fixtures(competition_id, season);
CREATE INDEX IF NOT EXISTS fixtures_home_idx ON fixtures(home_team_id);
CREATE INDEX IF NOT EXISTS fixtures_away_idx ON fixtures(away_team_id);

CREATE TABLE IF NOT EXISTS predictions (
  fixture_id     INTEGER PRIMARY KEY REFERENCES fixtures(id) ON DELETE CASCADE,
  model_version  TEXT NOT NULL,
  p_home         REAL NOT NULL,
  p_draw         REAL NOT NULL,
  p_away         REAL NOT NULL,
  exp_home       REAL NOT NULL,
  exp_away       REAL NOT NULL,
  rho            REAL NOT NULL DEFAULT -0.05,
  p_over         JSONB NOT NULL,               -- {"0.5":..,"1.5":..,"2.5":..}
  p_btts         REAL NOT NULL,
  top_scores     JSONB NOT NULL,               -- [{"score":"1-0","p":0.12},…]
  pick_1x2       TEXT NOT NULL,
  pick_ou        TEXT NOT NULL,                -- over | under (2.5 line)
  pick_score     TEXT NOT NULL,
  pick_btts      BOOLEAN NOT NULL,
  confidence     INTEGER NOT NULL,
  override_1x2   TEXT,
  override_ou    TEXT,
  override_score TEXT,
  admin_note     TEXT,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  locked         BOOLEAN NOT NULL DEFAULT FALSE, -- frozen at kickoff, never regenerated after
  won_1x2        BOOLEAN,
  won_ou         BOOLEAN,
  won_score      BOOLEAN,
  won_btts       BOOLEAN,
  settled_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS predictions_settled_idx ON predictions(settled_at);

CREATE TABLE IF NOT EXISTS backtests (
  id          SERIAL PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'running',  -- running | done | error
  label       TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE, -- shown on the public accuracy page
  params      JSONB NOT NULL,
  scope       JSONB NOT NULL,
  report      JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS job_logs (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'running',
  message     TEXT,
  api_calls   INTEGER NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
`;
