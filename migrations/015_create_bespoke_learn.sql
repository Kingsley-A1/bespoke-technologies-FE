-- Bespoke Learn is a bounded product domain. This migration is deliberately
-- additive and contains no publisher, course, lesson, fixture, or learner
-- inserts. Reviewed course content is authored through /admin/learn.

CREATE TABLE IF NOT EXISTS learn_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email STRING NOT NULL UNIQUE,
  display_name STRING NULL,
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'suspended', 'deleted')),
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learn_email_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email STRING NOT NULL,
  identity_hash STRING NOT NULL,
  network_hash STRING NOT NULL,
  code_hash STRING NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  failed_attempts INT4 NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0 AND failed_attempts <= 5),
  invalidated_at TIMESTAMPTZ NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_email_challenges_lookup_idx
  ON learn_email_challenges (identity_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS learn_rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action STRING NOT NULL CHECK (action IN ('email_code.request', 'email_code.verify')),
  identity_hash STRING NOT NULL,
  network_hash STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_rate_limit_events_lookup_idx
  ON learn_rate_limit_events (action, identity_hash, network_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS learn_sessions (
  id UUID PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  token_hash STRING NOT NULL UNIQUE,
  network_hash STRING NOT NULL,
  user_agent STRING NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_sessions_learner_idx
  ON learn_sessions (learner_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS learn_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NULL REFERENCES learn_learners(id),
  action STRING NOT NULL,
  entity_type STRING NOT NULL,
  entity_id STRING NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_security_events_learner_idx
  ON learn_security_events (learner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS learn_publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  name STRING NOT NULL,
  description STRING NULL,
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learn_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  biography STRING NULL,
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learn_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  publisher_id UUID NOT NULL REFERENCES learn_publishers(id),
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_courses_publisher_idx ON learn_courses (publisher_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS learn_course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learn_courses(id),
  version_number INT4 NOT NULL CHECK (version_number > 0),
  state STRING NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'review_ready', 'validated', 'published', 'superseded', 'archived')),
  title STRING NOT NULL,
  summary STRING NOT NULL,
  description STRING NOT NULL,
  outcomes JSONB NOT NULL DEFAULT '[]'::JSONB,
  audience STRING NULL,
  prerequisites JSONB NOT NULL DEFAULT '[]'::JSONB,
  commitment STRING NULL,
  formats JSONB NOT NULL DEFAULT '[]'::JSONB,
  cover_asset_id UUID NULL,
  access_policy STRING NOT NULL DEFAULT 'unavailable' CHECK (access_policy IN ('public_preview', 'authenticated_free', 'manual_grant', 'unavailable')),
  seo_title STRING NULL,
  seo_description STRING NULL,
  reviewed_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  published_by UUID NULL REFERENCES admin_users(id),
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, version_number)
);
CREATE INDEX IF NOT EXISTS learn_course_versions_public_idx
  ON learn_course_versions (state, course_id, published_at DESC);

CREATE TABLE IF NOT EXISTS learn_course_authors (
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  author_id UUID NOT NULL REFERENCES learn_authors(id),
  role STRING NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'reviewer')),
  sort_order INT4 NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  PRIMARY KEY (course_version_id, author_id),
  UNIQUE (course_version_id, sort_order)
);

CREATE TABLE IF NOT EXISTS learn_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  title STRING NOT NULL,
  summary STRING NULL,
  sort_order INT4 NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_version_id, sort_order),
  UNIQUE (course_version_id, id)
);

CREATE TABLE IF NOT EXISTS learn_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  module_id UUID NOT NULL,
  slug STRING NOT NULL,
  title STRING NOT NULL,
  objective STRING NOT NULL,
  context STRING NULL,
  estimated_minutes INT4 NOT NULL DEFAULT 10 CHECK (estimated_minutes >= 1 AND estimated_minutes <= 120),
  sort_order INT4 NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, module_id) REFERENCES learn_modules(course_version_id, id),
  UNIQUE (module_id, sort_order),
  UNIQUE (course_version_id, slug),
  UNIQUE (course_version_id, id)
);

CREATE TABLE IF NOT EXISTS learn_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learn_courses(id),
  r2_key STRING NOT NULL UNIQUE,
  filename STRING NOT NULL,
  mime_type STRING NOT NULL,
  byte_size INT8 NOT NULL CHECK (byte_size > 0),
  width INT4 NULL CHECK (width IS NULL OR width > 0),
  height INT4 NULL CHECK (height IS NULL OR height > 0),
  alt_text STRING NULL,
  caption STRING NULL,
  transcript STRING NULL,
  decorative BOOL NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_assets_course_idx ON learn_assets (course_id, created_at DESC);

ALTER TABLE learn_course_versions
  ADD CONSTRAINT learn_course_versions_cover_asset_fk
  FOREIGN KEY (cover_asset_id) REFERENCES learn_assets(id);

CREATE TABLE IF NOT EXISTS learn_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  lesson_id UUID NOT NULL,
  stable_id STRING NOT NULL,
  block_type STRING NOT NULL CHECK (block_type IN ('rich_text', 'callout', 'image', 'slides', 'video', 'audio', 'download', 'quiz', 'interactive', 'reflection')),
  required BOOL NOT NULL DEFAULT false,
  completion_rule STRING NOT NULL CHECK (completion_rule IN ('none', 'acknowledged', 'submitted', 'assessment_passed', 'media_complete')),
  config JSONB NOT NULL,
  sort_order INT4 NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, lesson_id) REFERENCES learn_lessons(course_version_id, id),
  UNIQUE (lesson_id, sort_order),
  UNIQUE (lesson_id, stable_id),
  UNIQUE (course_version_id, id)
);

CREATE TABLE IF NOT EXISTS learn_enrolments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_id UUID NOT NULL REFERENCES learn_courses(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (learner_id, course_id)
);
CREATE INDEX IF NOT EXISTS learn_enrolments_learner_idx
  ON learn_enrolments (learner_id, enrolled_at DESC);

CREATE TABLE IF NOT EXISTS learn_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_id UUID NOT NULL REFERENCES learn_courses(id),
  source STRING NOT NULL CHECK (source IN ('authenticated_free', 'manual_grant')),
  state STRING NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'revoked', 'expired')),
  granted_by UUID NULL REFERENCES admin_users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_by UUID NULL REFERENCES admin_users(id),
  revocation_reason STRING NULL,
  UNIQUE (learner_id, course_id, source)
);
CREATE INDEX IF NOT EXISTS learn_entitlements_lookup_idx
  ON learn_entitlements (learner_id, course_id, state, expires_at);

CREATE TABLE IF NOT EXISTS learn_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  lesson_id UUID NOT NULL,
  state STRING NOT NULL DEFAULT 'not_started' CHECK (state IN ('not_started', 'in_progress', 'completed')),
  resume_block_id UUID NULL REFERENCES learn_content_blocks(id),
  resume_position JSONB NOT NULL DEFAULT '{}'::JSONB,
  completed_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, lesson_id) REFERENCES learn_lessons(course_version_id, id),
  UNIQUE (learner_id, course_version_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learn_block_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  lesson_id UUID NOT NULL,
  block_id UUID NOT NULL,
  state STRING NOT NULL DEFAULT 'not_started' CHECK (state IN ('not_started', 'in_progress', 'completed')),
  position JSONB NOT NULL DEFAULT '{}'::JSONB,
  completed_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, lesson_id) REFERENCES learn_lessons(course_version_id, id),
  FOREIGN KEY (course_version_id, block_id) REFERENCES learn_content_blocks(course_version_id, id),
  UNIQUE (learner_id, course_version_id, block_id)
);

CREATE TABLE IF NOT EXISTS learn_activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  lesson_id UUID NOT NULL,
  block_id UUID NOT NULL,
  idempotency_key STRING NOT NULL UNIQUE,
  attempt_number INT4 NOT NULL CHECK (attempt_number > 0),
  status STRING NOT NULL CHECK (status IN ('submitted', 'evaluated')),
  feedback JSONB NOT NULL DEFAULT '{}'::JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, lesson_id) REFERENCES learn_lessons(course_version_id, id),
  FOREIGN KEY (course_version_id, block_id) REFERENCES learn_content_blocks(course_version_id, id),
  UNIQUE (learner_id, course_version_id, block_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS learn_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES learn_activity_attempts(id),
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learn_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  lesson_id UUID NOT NULL,
  block_id UUID NOT NULL,
  artifact_kind STRING NOT NULL CHECK (artifact_kind IN ('reflection', 'ai_opportunity_blueprint')),
  body STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (course_version_id, lesson_id) REFERENCES learn_lessons(course_version_id, id),
  FOREIGN KEY (course_version_id, block_id) REFERENCES learn_content_blocks(course_version_id, id),
  UNIQUE (learner_id, course_version_id, block_id, artifact_kind)
);

CREATE TABLE IF NOT EXISTS learn_completion_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learn_learners(id),
  course_id UUID NOT NULL REFERENCES learn_courses(id),
  course_version_id UUID NOT NULL REFERENCES learn_course_versions(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_reason STRING NOT NULL CHECK (completion_reason IN ('required_blocks_completed', 'authorised_override')),
  UNIQUE (learner_id, course_version_id)
);

CREATE TABLE IF NOT EXISTS learn_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_user_id UUID NULL REFERENCES admin_users(id),
  actor_label STRING NOT NULL,
  action STRING NOT NULL,
  entity_type STRING NOT NULL,
  entity_id STRING NOT NULL,
  reason STRING NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_audit_events_entity_idx
  ON learn_audit_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learn_audit_events_created_idx
  ON learn_audit_events (created_at DESC);
