CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  role STRING NOT NULL CHECK (role IN ('founder_admin', 'admin_manager')),
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('invited', 'active', 'suspended')),
  enrolled_at TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_authenticators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id),
  authenticator_type STRING NOT NULL CHECK (authenticator_type IN ('totp', 'recovery')),
  secret_ciphertext STRING NULL,
  secret_hash STRING NULL,
  last_used_step INT8 NULL,
  disabled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_authenticator_secret_idx
  ON admin_authenticators (user_id, authenticator_type, secret_hash);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  token_hash STRING NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  network_hash STRING NULL,
  user_agent STRING NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_hash STRING NOT NULL,
  network_hash STRING NOT NULL,
  outcome STRING NOT NULL CHECK (outcome IN ('success', 'failure', 'locked')),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_lookup_idx ON admin_login_attempts (identity_hash, network_hash, attempted_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NULL REFERENCES admin_users(id),
  actor_label STRING NOT NULL,
  action STRING NOT NULL,
  entity_type STRING NOT NULL,
  entity_id STRING NULL,
  reason STRING NULL,
  metadata JSONB NULL,
  request_id STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx ON admin_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_events_entity_idx ON admin_audit_events (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING NOT NULL,
  normalized_name STRING NOT NULL UNIQUE,
  email STRING NULL,
  phone STRING NULL,
  address STRING NULL,
  currency STRING NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  payment_terms_days INT4 NOT NULL DEFAULT 14,
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'archived')),
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  name STRING NOT NULL,
  email STRING NULL,
  phone STRING NULL,
  job_title STRING NULL,
  is_billing BOOL NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name STRING NOT NULL,
  contact_name STRING NOT NULL,
  email STRING NULL,
  phone STRING NULL,
  service STRING NOT NULL,
  source STRING NOT NULL DEFAULT 'manual',
  stage STRING NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost', 'archived')),
  estimated_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency STRING NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  owner_user_id UUID NULL REFERENCES admin_users(id),
  next_action STRING NULL,
  next_action_at TIMESTAMPTZ NULL,
  lost_reason STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads (stage, updated_at DESC);

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  actor_user_id UUID NULL REFERENCES admin_users(id),
  activity_type STRING NOT NULL,
  body STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  lead_id UUID NULL REFERENCES leads(id),
  name STRING NOT NULL,
  service STRING NOT NULL,
  summary STRING NULL,
  owner_user_id UUID NULL REFERENCES admin_users(id),
  status STRING NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'blocked', 'review', 'completed', 'on_hold', 'cancelled')),
  health STRING NOT NULL DEFAULT 'on_track' CHECK (health IN ('on_track', 'at_risk', 'off_track')),
  priority STRING NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  commercial_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency STRING NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  start_date DATE NULL,
  due_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status, due_date);

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title STRING NOT NULL,
  owner_user_id UUID NULL REFERENCES admin_users(id),
  due_date DATE NULL,
  state STRING NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'in_progress', 'completed', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NULL REFERENCES projects(id),
  title STRING NOT NULL,
  assignee_user_id UUID NULL REFERENCES admin_users(id),
  priority STRING NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status STRING NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  due_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_sequences (
  prefix STRING NOT NULL,
  sequence_year INT4 NOT NULL,
  next_value INT8 NOT NULL DEFAULT 1,
  PRIMARY KEY (prefix, sequence_year)
);

CREATE TABLE IF NOT EXISTS billing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number STRING NOT NULL UNIQUE,
  document_type STRING NOT NULL CHECK (document_type IN ('standard', 'proforma', 'recurring')),
  status STRING NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'voided', 'accepted', 'expired')),
  client_id UUID NOT NULL REFERENCES clients(id),
  project_id UUID NULL REFERENCES projects(id),
  parent_document_id UUID NULL REFERENCES billing_documents(id),
  client_snapshot JSONB NOT NULL,
  company_snapshot JSONB NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency STRING NOT NULL CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  subtotal DECIMAL(20,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(20,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(20,2) NOT NULL DEFAULT 0,
  total DECIMAL(20,2) NOT NULL DEFAULT 0,
  balance DECIMAL(20,2) NOT NULL DEFAULT 0,
  notes STRING NULL,
  terms STRING NULL,
  payment_instructions STRING NULL,
  purchase_order STRING NULL,
  revision INT4 NOT NULL DEFAULT 1,
  issued_at TIMESTAMPTZ NULL,
  issued_by UUID NULL REFERENCES admin_users(id),
  voided_at TIMESTAMPTZ NULL,
  voided_by UUID NULL REFERENCES admin_users(id),
  void_reason STRING NULL,
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_documents_status_idx ON billing_documents (status, due_date);
CREATE INDEX IF NOT EXISTS billing_documents_client_idx ON billing_documents (client_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS billing_documents_parent_issue_idx ON billing_documents (parent_document_id, issue_date, document_type) WHERE parent_document_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES billing_documents(id) ON DELETE CASCADE,
  name STRING NOT NULL,
  description STRING NULL,
  quantity DECIMAL(20,4) NOT NULL,
  unit_rate DECIMAL(20,2) NOT NULL,
  discount_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  line_total DECIMAL(20,2) NOT NULL,
  sort_order INT4 NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS billing_document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES billing_documents(id),
  actor_user_id UUID NULL REFERENCES admin_users(id),
  event_type STRING NOT NULL,
  from_status STRING NULL,
  to_status STRING NULL,
  detail JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_document_id UUID NOT NULL REFERENCES billing_documents(id),
  frequency STRING NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('draft', 'active', 'paused', 'ended', 'failed')),
  start_date DATE NOT NULL,
  end_date DATE NULL,
  next_run_date DATE NOT NULL,
  auto_issue BOOL NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ NULL,
  last_error STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES recurring_schedules(id),
  due_date DATE NOT NULL,
  generated_document_id UUID NULL REFERENCES billing_documents(id),
  state STRING NOT NULL CHECK (state IN ('started', 'completed', 'failed')),
  error STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  UNIQUE (schedule_id, due_date)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  amount DECIMAL(20,2) NOT NULL CHECK (amount > 0),
  currency STRING NOT NULL CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
  paid_at TIMESTAMPTZ NOT NULL,
  method STRING NOT NULL,
  reference STRING NOT NULL,
  note STRING NULL,
  state STRING NOT NULL DEFAULT 'recorded' CHECK (state IN ('recorded', 'reversed')),
  recorded_by UUID NULL REFERENCES admin_users(id),
  reversed_at TIMESTAMPTZ NULL,
  reversed_by UUID NULL REFERENCES admin_users(id),
  reversal_reason STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_client_reference_idx ON payments (client_id, reference);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  document_id UUID NOT NULL REFERENCES billing_documents(id),
  amount DECIMAL(20,2) NOT NULL CHECK (amount > 0),
  UNIQUE (payment_id, document_id)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES admin_users(id),
  action STRING NOT NULL,
  entity_type STRING NOT NULL,
  entity_id STRING NOT NULL,
  reason STRING NOT NULL,
  state STRING NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'approved', 'rejected')),
  resolved_by UUID NULL REFERENCES admin_users(id),
  resolution_note STRING NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id STRING PRIMARY KEY DEFAULT 'primary',
  company_name STRING NOT NULL,
  website STRING NOT NULL,
  phone STRING NOT NULL,
  email STRING NOT NULL,
  registration_number STRING NOT NULL,
  motto STRING NOT NULL,
  address STRING NULL,
  default_currency STRING NOT NULL DEFAULT 'NGN',
  default_payment_terms_days INT4 NOT NULL DEFAULT 14,
  payment_instructions STRING NULL,
  invoice_approval_threshold DECIMAL(20,2) NOT NULL DEFAULT 1000000,
  updated_by UUID NULL REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NULL REFERENCES billing_documents(id),
  channel STRING NOT NULL,
  destination STRING NOT NULL,
  state STRING NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT4 NOT NULL DEFAULT 0,
  last_error STRING NULL,
  next_attempt_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING NOT NULL,
  email STRING NOT NULL,
  phone STRING NULL,
  company STRING NULL,
  service STRING NULL,
  message STRING NOT NULL,
  state STRING NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'triaged', 'converted', 'archived')),
  lead_id UUID NULL REFERENCES leads(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_hash STRING NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_submission_attempts_network_idx ON contact_submission_attempts (network_hash, attempted_at DESC);

INSERT INTO company_settings (
  id, company_name, website, phone, email, registration_number, motto
) VALUES (
  'primary',
  'Bespoke Technologies',
  'www.bespoketech.com.ng',
  '08088071657',
  'bespoketech01@gmail.com',
  '9582429',
  'Engineering the solutions for this, and The Next Generations_'
) ON CONFLICT (id) DO NOTHING;
