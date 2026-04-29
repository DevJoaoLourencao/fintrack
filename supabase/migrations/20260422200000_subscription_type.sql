-- Add subscription transaction type
ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('credit_card', 'pix', 'debit', 'recurring', 'subscription'));
