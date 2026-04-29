-- Prevent duplicate installment numbers per transaction (idempotent inserts for recurring extension)
ALTER TABLE installments
  ADD CONSTRAINT installments_tx_number_unique UNIQUE (transaction_id, number);
