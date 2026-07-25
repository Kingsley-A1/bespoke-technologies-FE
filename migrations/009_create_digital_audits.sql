CREATE TABLE IF NOT EXISTS digital_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name STRING NOT NULL,
  industry STRING NOT NULL,
  team_size STRING NOT NULL,
  email STRING NULL,
  phone STRING NULL,
  contact_consent BOOL NOT NULL DEFAULT false,
  share_business_name BOOL NOT NULL DEFAULT true,
  status STRING NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'in_progress', 'completed', 'archived')),
  management_state STRING NOT NULL DEFAULT 'new'
    CHECK (management_state IN ('new', 'reviewed', 'contacted', 'converted', 'closed')),
  progress_count INT4 NOT NULL DEFAULT 0 CHECK (progress_count BETWEEN 0 AND 6),
  definition_version STRING NOT NULL,
  scoring_version STRING NOT NULL,
  overall_score INT4 NULL CHECK (overall_score BETWEEN 0 AND 100),
  tier STRING NULL,
  result_snapshot JSONB NULL,
  share_token STRING NULL UNIQUE,
  resume_token_hash STRING NOT NULL UNIQUE,
  lead_id UUID NULL REFERENCES leads(id),
  owner_user_id UUID NULL REFERENCES admin_users(id),
  source STRING NOT NULL DEFAULT 'website',
  attribution JSONB NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_audits_status_activity_idx
  ON digital_audits (status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS digital_audits_management_idx
  ON digital_audits (management_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS digital_audits_business_idx
  ON digital_audits (business_name, created_at DESC);
CREATE INDEX IF NOT EXISTS digital_audits_lead_idx
  ON digital_audits (lead_id);

CREATE TABLE IF NOT EXISTS digital_audit_answers (
  audit_id UUID NOT NULL REFERENCES digital_audits(id) ON DELETE CASCADE,
  question_id STRING NOT NULL,
  option_index INT4 NOT NULL CHECK (option_index BETWEEN 0 AND 3),
  maturity INT4 NOT NULL CHECK (maturity BETWEEN 0 AND 3),
  answer_snapshot JSONB NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (audit_id, question_id)
);

CREATE INDEX IF NOT EXISTS digital_audit_answers_audit_idx
  ON digital_audit_answers (audit_id, updated_at);

CREATE TABLE IF NOT EXISTS digital_audit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES digital_audits(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES admin_users(id),
  body STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_audit_notes_audit_idx
  ON digital_audit_notes (audit_id, created_at DESC);

CREATE TABLE IF NOT EXISTS digital_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES digital_audits(id) ON DELETE CASCADE,
  event_type STRING NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_audit_events_audit_idx
  ON digital_audit_events (audit_id, created_at DESC);

CREATE TABLE IF NOT EXISTS digital_audit_submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_hash STRING NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_audit_attempts_network_idx
  ON digital_audit_submission_attempts (network_hash, attempted_at DESC);
