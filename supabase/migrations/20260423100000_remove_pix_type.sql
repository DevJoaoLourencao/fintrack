-- Migrate any existing pix transactions to debit, then remove pix from allowed types
UPDATE transactions SET type = 'debit' WHERE type = 'pix';
ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('credit_card', 'debit', 'recurring', 'subscription'));
