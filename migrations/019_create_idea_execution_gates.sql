-- Bespoke Idea Execution Gate — public assessment, deterministic scoring and
-- lead capture. Mirrors the digital_audits family so both assessment products
-- share one operational shape.

CREATE TABLE IF NOT EXISTS idea_execution_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_title STRING NOT NULL,
  idea_summary STRING NOT NULL,
  idea_stage STRING NOT NULL,
  owner_role STRING NOT NULL,
  contact_name STRING NULL,
  email STRING NULL,
  phone STRING NULL,
  contact_consent BOOL NOT NULL DEFAULT false,
  share_idea_title BOOL NOT NULL DEFAULT true,
  status STRING NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'in_progress', 'completed', 'archived')),
  management_state STRING NOT NULL DEFAULT 'new'
    CHECK (management_state IN ('new', 'reviewed', 'contacted', 'converted', 'closed')),
  progress_count INT4 NOT NULL DEFAULT 0 CHECK (progress_count BETWEEN 0 AND 10),
  definition_version STRING NOT NULL,
  scoring_version STRING NOT NULL,
  total_score INT4 NULL CHECK (total_score BETWEEN 0 AND 20),
  gates_passed INT4 NULL CHECK (gates_passed BETWEEN 0 AND 10),
  decision STRING NULL CHECK (decision IN ('green', 'amber', 'red')),
  result_snapshot JSONB NULL,
  analysis_snapshot JSONB NULL,
  analysis_source STRING NOT NULL DEFAULT 'framework'
    CHECK (analysis_source IN ('framework', 'assisted')),
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

CREATE INDEX IF NOT EXISTS idea_execution_gates_status_activity_idx
  ON idea_execution_gates (status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idea_execution_gates_management_idx
  ON idea_execution_gates (management_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idea_execution_gates_decision_idx
  ON idea_execution_gates (decision, completed_at DESC);
CREATE INDEX IF NOT EXISTS idea_execution_gates_lead_idx
  ON idea_execution_gates (lead_id);

CREATE TABLE IF NOT EXISTS idea_execution_gate_answers (
  gate_assessment_id UUID NOT NULL REFERENCES idea_execution_gates(id) ON DELETE CASCADE,
  gate_id STRING NOT NULL,
  option_index INT4 NOT NULL CHECK (option_index BETWEEN 0 AND 2),
  score INT4 NOT NULL CHECK (score BETWEEN 0 AND 2),
  evidence STRING NOT NULL DEFAULT '',
  answer_snapshot JSONB NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (gate_assessment_id, gate_id)
);

CREATE INDEX IF NOT EXISTS idea_execution_gate_answers_assessment_idx
  ON idea_execution_gate_answers (gate_assessment_id, updated_at);

CREATE TABLE IF NOT EXISTS idea_execution_gate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_assessment_id UUID NOT NULL REFERENCES idea_execution_gates(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES admin_users(id),
  body STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idea_execution_gate_notes_assessment_idx
  ON idea_execution_gate_notes (gate_assessment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idea_execution_gate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_assessment_id UUID NOT NULL REFERENCES idea_execution_gates(id) ON DELETE CASCADE,
  event_type STRING NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idea_execution_gate_events_assessment_idx
  ON idea_execution_gate_events (gate_assessment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idea_execution_gate_submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_hash STRING NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idea_execution_gate_attempts_network_idx
  ON idea_execution_gate_submission_attempts (network_hash, attempted_at DESC);
