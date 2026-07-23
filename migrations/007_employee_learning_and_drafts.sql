-- Employee access extends the existing identity and TOTP system. Employees are
-- invited by the founder, enroll their own authenticator, and receive a narrow
-- permission set rather than a parallel authentication system.
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('founder_admin', 'admin_manager', 'employee'));
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS enrollment_code_hash STRING NULL;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS enrollment_expires_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS invoice_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES admin_users(id),
  title STRING NOT NULL DEFAULT 'Untitled invoice',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_drafts_owner_idx ON invoice_drafts (owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title STRING NOT NULL,
  description STRING NULL,
  provider STRING NULL,
  course_url STRING NULL,
  start_date DATE NULL,
  due_date DATE NULL,
  state STRING NOT NULL DEFAULT 'planned' CHECK (state IN ('planned', 'active', 'completed', 'archived')),
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  status STRING NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress INT4 NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  plan JSONB NOT NULL DEFAULT '[]'::JSONB,
  certification_key STRING NULL,
  certification_mime STRING NULL,
  certification_uploaded_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, user_id)
);
CREATE INDEX IF NOT EXISTS learning_assignments_user_idx ON learning_assignments (user_id, status, updated_at DESC);
