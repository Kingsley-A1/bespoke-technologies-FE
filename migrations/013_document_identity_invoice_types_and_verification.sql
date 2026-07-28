-- Backward-compatible official-document corrections.
-- Existing document IDs, numbers, snapshots, line items, and lifecycle records
-- remain unchanged.

ALTER TABLE billing_documents
  ADD COLUMN IF NOT EXISTS custom_type_label STRING NULL;

ALTER TABLE billing_documents
  ADD COLUMN IF NOT EXISTS value_label STRING NULL;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS value_label STRING NULL;

ALTER TABLE billing_documents
  DROP CONSTRAINT IF EXISTS billing_documents_document_type_check;

ALTER TABLE billing_documents
  ADD CONSTRAINT billing_documents_document_type_check
  CHECK (
    document_type IN (
      'standard',
      'proforma',
      'recurring',
      'deposit',
      'milestone',
      'final',
      'retainer',
      'subscription',
      'other'
    )
  );

UPDATE company_settings
SET
  company_name = 'Bespoke Technologies',
  registration_number = '9582429',
  website = 'https://www.bespoketech.com.ng',
  phone = '08088071657',
  email = 'support@bespoketech.com.ng',
  ceo_name = 'Kingsley Maduabuchi',
  ceo_title = 'Founder & CEO',
  motto = 'Engineering the solutions for this, and The Next Generations_',
  payment_instructions = CASE
    WHEN trim(coalesce(payment_instructions, '')) = '' THEN
      'Third-party infrastructure and external services—including database, email, hosting, storage, domains, payment gateways, and similar providers—may require separate or additional payment later, depending on usage, plan limits, exchange rates, or provider pricing. These charges are not waived by a zero-balance or pro-bono invoice unless the governing project agreement explicitly states otherwise.'
    WHEN position('Third-party infrastructure and external services' IN payment_instructions) = 0 THEN
      payment_instructions || e'\n\n' ||
      'Third-party infrastructure and external services—including database, email, hosting, storage, domains, payment gateways, and similar providers—may require separate or additional payment later, depending on usage, plan limits, exchange rates, or provider pricing. These charges are not waived by a zero-balance or pro-bono invoice unless the governing project agreement explicitly states otherwise.'
    ELSE payment_instructions
  END,
  updated_at = now()
WHERE id = 'primary';
