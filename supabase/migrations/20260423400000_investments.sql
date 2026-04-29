-- Investment snapshots: periodic portfolio value by category

CREATE TABLE investment_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          date NOT NULL,
  acoes         numeric(12,2) NOT NULL DEFAULT 0,
  fiis          numeric(12,2) NOT NULL DEFAULT 0,
  cripto        numeric(12,2) NOT NULL DEFAULT 0,
  internacional numeric(12,2) NOT NULL DEFAULT 0,
  renda_fixa    numeric(12,2) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE investment_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_investment_snapshots" ON investment_snapshots FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
