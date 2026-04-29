-- Phase 2: cards, categories, transactions, installments

CREATE TABLE cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  last_four   text NOT NULL CHECK (length(last_four) = 4),
  color       text NOT NULL,
  closing_day integer NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day     integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cards" ON cards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL,
  icon       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_categories" ON categories FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id            uuid REFERENCES cards(id) ON DELETE SET NULL,
  category_id        uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description        text NOT NULL,
  total_amount       numeric(12,2) NOT NULL CHECK (total_amount > 0),
  type               text NOT NULL CHECK (type IN ('credit_card','pix','debit','recurring')),
  total_installments integer NOT NULL DEFAULT 1 CHECK (total_installments >= 1),
  purchase_date      date NOT NULL,
  is_recurring       boolean NOT NULL DEFAULT false,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_transactions" ON transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE installments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  number         integer NOT NULL,
  amount         numeric(12,2) NOT NULL,
  due_date       date NOT NULL,
  paid           boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_installments" ON installments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = installments.transaction_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = installments.transaction_id
        AND t.user_id = auth.uid()
    )
  );
