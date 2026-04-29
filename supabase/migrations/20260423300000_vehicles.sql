-- Vehicles: inventory management for motos/vehicles

CREATE TABLE vehicles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  purchase_price numeric(12,2) NOT NULL CHECK (purchase_price > 0),
  purchase_date  date,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','receivable','sold')),
  notes          text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_vehicles" ON vehicles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE vehicle_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id          uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  total_sale_price    numeric(12,2) NOT NULL CHECK (total_sale_price >= 0),
  cash_amount         numeric(12,2) NOT NULL DEFAULT 0,
  installments_count  integer NOT NULL DEFAULT 0 CHECK (installments_count >= 0),
  installments_amount numeric(12,2) NOT NULL DEFAULT 0,
  installments_paid   integer NOT NULL DEFAULT 0,
  trade_description   text,
  trade_value         numeric(12,2) NOT NULL DEFAULT 0,
  notes               text,
  sale_date           date,
  completed           boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE vehicle_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_vehicle_sales" ON vehicle_sales FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
