-- Bookstore orders. Payment is taken by Stripe; Lulu prints and ships each order.

CREATE TABLE IF NOT EXISTS store_orders (
  id                    TEXT PRIMARY KEY,                 -- public order number, e.g. ND-7K3Q9X
  token                 TEXT NOT NULL,                    -- secret in the customer's tracking link
  status                TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | submitted | printing | shipped | delivered | rejected | canceled
  email                 TEXT NOT NULL,
  name                  TEXT NOT NULL,
  address_json          TEXT NOT NULL,
  items_json            TEXT NOT NULL,                    -- [{ slug, title, qty, unit_cents }]
  shipping_level        TEXT NOT NULL,
  subtotal_cents        INTEGER NOT NULL,
  shipping_cents        INTEGER NOT NULL,
  total_cents           INTEGER NOT NULL,
  lulu_cost_cents       INTEGER,                          -- what Lulu charges for printing + shipping
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  lulu_job_id           INTEGER,
  lulu_status           TEXT,
  tracking_json         TEXT,                             -- [{ carrier, id, urls }]
  error                 TEXT,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  paid_at               INTEGER,
  shipped_at            INTEGER,
  synced_at             INTEGER
);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON store_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_session ON store_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_job ON store_orders (lulu_job_id);

CREATE TABLE IF NOT EXISTS store_events (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL,
  kind       TEXT NOT NULL,                               -- created | paid | submitted | lulu | error | admin
  detail     TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_store_events_order ON store_events (order_id, created_at);
