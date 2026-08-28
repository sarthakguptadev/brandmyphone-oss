-- Phone Sticker Sponsorship - Cloudflare D1 schema
-- Apply: npm run db:migrate

CREATE TABLE IF NOT EXISTS claims (
  spot_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  url TEXT,
  email TEXT,
  payment_id TEXT,
  claimed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending (
  spot_id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  expires_at TEXT NOT NULL
);