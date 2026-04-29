-- Migrate any existing debit transactions to recurring, then remove debit from allowed types
UPDATE transactions SET type = 'recurring' WHERE type = 'debit';
ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('credit_card', 'recurring', 'subscription'));
