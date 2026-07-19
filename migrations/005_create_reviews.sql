-- Public client reviews. Submitted from the public site, always created as
-- 'pending', and only visible publicly after an admin publishes them.
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name STRING NOT NULL,
  project_name STRING NOT NULL,
  project_url STRING NULL,
  body STRING NOT NULL,
  rating INT4 NOT NULL CHECK (rating BETWEEN 1 AND 5),
  -- Optional project logo, uploaded by an admin (never by the submitter).
  logo_key STRING NULL,
  logo_mime STRING NULL,
  status STRING NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'archived')),
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status, published_at DESC);

CREATE TABLE IF NOT EXISTS review_submission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_hash STRING NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_submission_attempts_network_idx
  ON review_submission_attempts (network_hash, attempted_at DESC);
