-- Sales tax computed by Stripe Tax at checkout, and store settings saved from the admin
-- (for now the Stripe webhook's signing secret, created by the "Connect Stripe" button).
ALTER TABLE store_orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS store_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
