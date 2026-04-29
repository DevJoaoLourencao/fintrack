CREATE TABLE investment_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN ('acoes','fiis','cripto','internacional','renda_fixa')),
  name          text NOT NULL,
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
ALTER TABLE investment_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_investment_assets" ON investment_assets FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
