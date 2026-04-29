alter table investment_snapshots
  add column if not exists usd_rate numeric(10, 4) null;
