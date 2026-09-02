-- Progress billing: let a deposit, milestone, or final invoice state the whole
-- engagement it belongs to, so the client can see what this payment covers and
-- what remains. Additive and nullable. Existing documents are untouched and
-- continue to print exactly as they do today.

ALTER TABLE billing_documents
  ADD COLUMN IF NOT EXISTS contract_value DECIMAL(20,2) NULL;

ALTER TABLE billing_documents
  ADD COLUMN IF NOT EXISTS previously_invoiced DECIMAL(20,2) NULL;
