CREATE TABLE investment_snapshot_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES investment_snapshots(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text NOT NULL,
  amount      numeric(14,2) NOT NULL,
  currency    text NOT NULL DEFAULT 'BRL',
  quantity    numeric(14,6),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE investment_snapshot_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_snapshot_items" ON investment_snapshot_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
