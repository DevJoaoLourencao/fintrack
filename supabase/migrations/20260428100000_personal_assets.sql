create table if not exists personal_assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  category     text not null,
  purchase_value numeric(12, 2) not null default 0,
  current_value  numeric(12, 2) null,
  notes        text null,
  created_at   timestamptz not null default now()
);

alter table personal_assets enable row level security;

create policy "Users manage own personal assets"
  on personal_assets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
