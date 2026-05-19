-- ============================================================
-- PROOF-OF-SUPPORT — COMPLETE SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet               TEXT        UNIQUE NOT NULL,
  username             TEXT        UNIQUE,
  avatar_url           TEXT,
  total_points         INTEGER     NOT NULL DEFAULT 0,
  current_season_points INTEGER    NOT NULL DEFAULT 0,
  streak_days          INTEGER     NOT NULL DEFAULT 0,
  streak_last_date     DATE,
  contributions_count  INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CONTRIBUTIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet      TEXT        NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  link        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'tweet'
                CHECK (type IN ('tweet','thread','referral','feedback')),
  points      INTEGER     NOT NULL DEFAULT 10,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  upvotes     INTEGER     NOT NULL DEFAULT 0,
  season      TEXT        NOT NULL DEFAULT 'genesis',
  signature   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet, link)
);

-- ─── BADGES ─────────────────────────────────────────────────
-- NOTE: badges.id is a TEXT slug (e.g. 'genesis', 'signal-5') so it can be
-- referenced directly by string IDs from lib/utils.ts BADGES array.
CREATE TABLE IF NOT EXISTS badges (
  id          TEXT  PRIMARY KEY,
  slug        TEXT  UNIQUE NOT NULL,
  name        TEXT  NOT NULL,
  description TEXT,
  icon        TEXT  NOT NULL,
  color       TEXT  NOT NULL DEFAULT 'cyan',
  tier        TEXT  NOT NULL DEFAULT 'common'
                CHECK (tier IN ('common','rare','epic','legendary')),
  threshold   INTEGER NOT NULL DEFAULT 1,
  type        TEXT  NOT NULL DEFAULT 'contributions'
                CHECK (type IN ('contributions','points','streak','special'))
);

-- ─── USER BADGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet    TEXT        NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  badge_id  TEXT        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet, badge_id)
);

-- ─── SEASONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ,
  is_active  BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contributions_wallet    ON contributions(wallet);
CREATE INDEX IF NOT EXISTS idx_contributions_status    ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_type      ON contributions(type);
CREATE INDEX IF NOT EXISTS idx_contributions_created   ON contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_season    ON contributions(season);
CREATE INDEX IF NOT EXISTS idx_users_total_points      ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_wallet      ON user_badges(wallet);

-- ─── FUNCTIONS ──────────────────────────────────────────────

-- Increment user points
CREATE OR REPLACE FUNCTION increment_user_points(p_wallet TEXT, p_points INTEGER)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE users
  SET
    total_points          = GREATEST(0, total_points + p_points),
    current_season_points = GREATEST(0, current_season_points + p_points),
    updated_at            = NOW()
  WHERE wallet = p_wallet;
$$;

-- Increment a contribution's upvote counter (used by the public upvote endpoint).
CREATE OR REPLACE FUNCTION increment_contribution_upvotes(p_id UUID)
RETURNS INTEGER LANGUAGE sql AS $$
  UPDATE contributions
  SET upvotes = upvotes + 1
  WHERE id = p_id
  RETURNING upvotes;
$$;

-- Auto-update contributions_count
CREATE OR REPLACE FUNCTION update_contributions_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET contributions_count = contributions_count + 1 WHERE wallet = NEW.wallet;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET contributions_count = GREATEST(0, contributions_count - 1) WHERE wallet = OLD.wallet;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_contributions_count
AFTER INSERT OR DELETE ON contributions
FOR EACH ROW EXECUTE FUNCTION update_contributions_count();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges   ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Users public read"         ON users         FOR SELECT USING (true);
CREATE POLICY "Contributions public read" ON contributions FOR SELECT USING (true);
CREATE POLICY "Badges public read"        ON badges        FOR SELECT USING (true);
CREATE POLICY "User badges public read"   ON user_badges   FOR SELECT USING (true);

-- Note: Writes are handled server-side via service role key only

-- ─── SEED BADGES ────────────────────────────────────────────
INSERT INTO badges (id, slug, name, description, icon, color, tier, threshold, type) VALUES
  ('genesis',     'genesis',     'Genesis',     'First contribution ever submitted',         '🌱', 'green',  'common',    1,    'contributions'),
  ('signal-5',    'signal-5',    'Signal Boost','5 contributions submitted',                  '📡', 'cyan',   'common',    5,    'contributions'),
  ('advocate-10', 'advocate-10', 'Advocate',    '10 contributions submitted',                 '📢', 'cyan',   'rare',      10,   'contributions'),
  ('champion-25', 'champion-25', 'Champion',    '25 contributions submitted',                 '🏆', 'gold',   'epic',      25,   'contributions'),
  ('legend-50',   'legend-50',   'Legend',      '50 contributions submitted',                 '⚡', 'purple', 'legendary', 50,   'contributions'),
  ('streak-7',    'streak-7',    'Consistent',  '7-day contribution streak',                  '🔥', 'pink',   'rare',      7,    'streak'),
  ('streak-30',   'streak-30',   'Relentless',  '30-day contribution streak',                 '💎', 'purple', 'legendary', 30,   'streak'),
  ('points-100',  'points-100',  'Centurion',   '100 points earned',                          '💯', 'gold',   'common',    100,  'points'),
  ('points-500',  'points-500',  'Power Node',  '500 points earned',                          '⚙️', 'cyan',   'epic',      500,  'points'),
  ('points-1000', 'points-1000', 'Genesis Core','1,000 points earned — founding tier',        '🔮', 'purple', 'legendary', 1000, 'points')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED SEASON ────────────────────────────────────────────
INSERT INTO seasons (slug, name, starts_at, ends_at, is_active) VALUES
  ('genesis', 'Season Genesis', NOW(), NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- ─── SAMPLE DATA (optional — remove for production) ─────────
INSERT INTO users (wallet, username, total_points, streak_days) VALUES
  ('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'sol_builder',  120, 5),
  ('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'web3_chad',     75, 3),
  ('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', 'defi_phoenix',  40, 1)
ON CONFLICT (wallet) DO NOTHING;

INSERT INTO contributions (wallet, link, description, type, points, status) VALUES
  ('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
   'https://twitter.com/sol_builder/status/1234567890',
   'Wrote a detailed thread explaining how on-chain contribution tracking works and why it matters for Web3 communities. Got 200+ engagements.',
   'thread', 25, 'approved'),
  ('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
   'https://twitter.com/web3_chad/status/9876543210',
   'Referred 5 new developers to the HelpBnk × Superteam hackathon. All 5 submitted projects.',
   'referral', 40, 'approved'),
  ('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
   'https://twitter.com/defi_phoenix/status/1122334455',
   'Gave detailed product feedback on the PoS dashboard UI — identified 3 UX issues that were fixed before launch.',
   'feedback', 15, 'approved')
ON CONFLICT DO NOTHING;
