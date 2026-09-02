-- Repair the invoice-type CHECK constraint.
--
-- Migration 013 widened the allowed document types, but dropped the constraint
-- by its PostgreSQL-style name. CockroachDB names an unnamed column CHECK
-- `check_<column>`, so `billing_documents_document_type_check` did not exist
-- and the drop silently did nothing. Migration 013 then added a second, wider
-- constraint beside the original narrow one from migration 002. Both are
-- enforced, so every deposit, milestone, final, retainer, subscription, and
-- other invoice has been rejected at insert with:
--
--   failed to satisfy CHECK constraint
--   (document_type IN ('standard':::STRING, 'proforma':::STRING, 'recurring':::STRING))
--
-- Both earlier names are dropped here, and the allowed set is re-stated under a
-- new name so this migration never drops and adds the same name in one
-- transaction. Existing rows all carry an allowed type, so validation of the
-- new constraint cannot fail. Dropping a name that is absent is a no-op, which
-- keeps this safe on a database where only one of the two ever existed.

ALTER TABLE billing_documents DROP CONSTRAINT IF EXISTS check_document_type;

ALTER TABLE billing_documents DROP CONSTRAINT IF EXISTS billing_documents_document_type_check;

ALTER TABLE billing_documents
  ADD CONSTRAINT billing_documents_document_type_allowed
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
