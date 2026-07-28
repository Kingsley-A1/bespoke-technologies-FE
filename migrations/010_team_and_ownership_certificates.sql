CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  full_name STRING NOT NULL,
  role_title STRING NOT NULL,
  team_group STRING NOT NULL CHECK (team_group IN ('leadership', 'product', 'engineering', 'design', 'operations', 'partnerships')),
  short_bio STRING NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::JSONB,
  location STRING NULL,
  links JSONB NOT NULL DEFAULT '{}'::JSONB,
  portrait_key STRING NULL,
  portrait_mime STRING NULL,
  portrait_alt STRING NOT NULL DEFAULT '',
  card_variant STRING NOT NULL DEFAULT 'blueprint' CHECK (card_variant IN ('blueprint', 'signal', 'grid', 'orbit')),
  display_order INT4 NOT NULL DEFAULT 0,
  status STRING NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ NULL,
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_public_idx
  ON team_members (status, team_group, display_order, created_at);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type STRING NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at DATE NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_logo_key STRING NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_logo_mime STRING NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portfolio_project_id STRING NULL REFERENCES portfolio_projects(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_invoice_id UUID NULL REFERENCES billing_documents(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commercial_mode STRING NOT NULL DEFAULT 'paid'
  CHECK (commercial_mode IN ('paid', 'free', 'donation', 'undisclosed'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_value_publicly BOOL NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS value_note STRING NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_portfolio_project_idx
  ON projects (portfolio_project_id) WHERE portfolio_project_id IS NOT NULL;

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ceo_name STRING NOT NULL DEFAULT 'Kingsley Maduabuchi';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ceo_title STRING NOT NULL DEFAULT 'Founder & CEO';

CREATE TABLE IF NOT EXISTS ownership_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number STRING NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  billing_document_id UUID NULL REFERENCES billing_documents(id),
  status STRING NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'revoked')),
  owner_kind STRING NOT NULL CHECK (owner_kind IN ('company', 'contact', 'other')),
  owner_snapshot JSONB NOT NULL,
  project_snapshot JSONB NOT NULL,
  commercial_snapshot JSONB NOT NULL,
  company_snapshot JSONB NOT NULL,
  ownership_statement STRING NOT NULL,
  verification_token STRING NULL UNIQUE,
  verification_token_hash STRING NULL UNIQUE,
  pdf_key STRING NULL,
  pdf_sha256 STRING NULL,
  issued_at TIMESTAMPTZ NULL,
  issued_by UUID NULL REFERENCES admin_users(id),
  delivered_to STRING NULL,
  delivery_state STRING NOT NULL DEFAULT 'not_sent'
    CHECK (delivery_state IN ('not_sent', 'sent', 'failed')),
  delivery_provider_id STRING NULL,
  delivery_error STRING NULL,
  delivered_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_by UUID NULL REFERENCES admin_users(id),
  revocation_reason STRING NULL,
  replaces_certificate_id UUID NULL REFERENCES ownership_certificates(id),
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ownership_certificates_active_project_idx
  ON ownership_certificates (project_id) WHERE status IN ('draft', 'issued');
CREATE INDEX IF NOT EXISTS ownership_certificates_status_idx
  ON ownership_certificates (status, created_at DESC);
