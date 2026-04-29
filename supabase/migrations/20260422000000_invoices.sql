CREATE TABLE invoices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id    uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  month      text NOT NULL,
  amount     numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (card_id, month)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_invoices" ON invoices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
