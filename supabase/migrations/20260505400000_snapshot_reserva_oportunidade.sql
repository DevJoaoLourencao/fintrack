ALTER TABLE investment_snapshots ADD COLUMN IF NOT EXISTS reserva_oportunidade numeric(14,2) NOT NULL DEFAULT 0;
