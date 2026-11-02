-- Whether the reader asked to hear about the next book (unchecked unless they tick it).
ALTER TABLE store_orders ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0;
