CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind STRING NOT NULL CHECK (kind IN ('handover', 'book', 'research')),
  title STRING NOT NULL,
  slug STRING NOT NULL UNIQUE,
  summary STRING NULL,
  -- Cover image: a public object, safe to expose.
  cover_key STRING NULL,
  cover_url STRING NULL,
  -- Document file: a PRIVATE object. Streamed only through a policy-checked
  -- route; handover documents have no public route at all.
  document_key STRING NULL,
  document_mime STRING NOT NULL DEFAULT 'application/pdf',
  page_count INT4 NULL,
  -- Handover-only public-facing framing (display labels only).
  client_label STRING NULL,
  project_label STRING NULL,
  -- Book-only commercial fields. is_free defaults true; no purchase path yet.
  author_label STRING NULL,
  price_amount DECIMAL(20,2) NULL,
  price_currency STRING NOT NULL DEFAULT 'NGN' CHECK (price_currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  is_free BOOL NOT NULL DEFAULT true,
  -- Book card treatment so each book type reads distinctly.
  card_variant STRING NOT NULL DEFAULT 'standard'
    CHECK (card_variant IN ('standard', 'field-guide', 'playbook', 'deep-dive')),
  -- Publish control and derived access policy.
  status STRING NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_downloadable BOOL NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NULL,
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publications_kind_status_idx
  ON publications (kind, status, published_at DESC);

CREATE INDEX IF NOT EXISTS publications_status_idx
  ON publications (status, created_at DESC);
