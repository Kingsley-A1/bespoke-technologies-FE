-- What's New at Bespoke: the official public publication channel.
--
-- A post is publicly visible only when status = 'published' AND
-- published_at <= now(). A published row with a future published_at is a
-- scheduled post; no background job is needed to make it go live.

CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  title STRING NOT NULL,
  dek STRING NULL,
  category STRING NOT NULL DEFAULT 'announcements'
    CHECK (category IN ('announcements', 'product-updates', 'project-documentation', 'engineering-notes', 'events')),
  -- Validated, structured rich-text document (allow-listed nodes and marks).
  body JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::JSONB,
  -- Derived from body on every save; used for descriptions and reading time.
  body_text STRING NOT NULL DEFAULT '',
  reading_minutes INT4 NOT NULL DEFAULT 1,
  cover_asset_id UUID NULL,
  cover_alt STRING NULL,
  -- 1200x630 JPEG derived from the cover; the Open Graph / WhatsApp image.
  share_asset_id UUID NULL,
  seo_title STRING NULL,
  seo_description STRING NULL,
  author_name STRING NOT NULL,
  is_featured BOOL NOT NULL DEFAULT false,
  status STRING NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ NULL,
  first_published_at TIMESTAMPTZ NULL,
  -- Optimistic concurrency: every content save must present the current version.
  version INT4 NOT NULL DEFAULT 1,
  created_by UUID NULL REFERENCES admin_users(id),
  updated_by UUID NULL REFERENCES admin_users(id),
  published_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT news_posts_published_has_date CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS news_posts_public_idx
  ON news_posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS news_posts_category_public_idx
  ON news_posts (category, status, published_at DESC);

CREATE INDEX IF NOT EXISTS news_posts_updated_idx
  ON news_posts (updated_at DESC);

-- Processed images (covers, share images and in-article images) stored in R2.
-- Objects are immutable: a replaced image is a new asset with a new id.
CREATE TABLE IF NOT EXISTS news_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  purpose STRING NOT NULL CHECK (purpose IN ('cover', 'share', 'inline')),
  r2_key STRING NOT NULL UNIQUE,
  mime STRING NOT NULL,
  width INT4 NOT NULL,
  height INT4 NOT NULL,
  byte_size INT4 NOT NULL,
  created_by UUID NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_assets_post_idx ON news_assets (post_id, purpose);

-- Old slugs of posts that were once public permanently redirect to the
-- current slug, so shared links and indexed URLs keep working.
CREATE TABLE IF NOT EXISTS news_slug_redirects (
  old_slug STRING PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_slug_redirects_post_idx ON news_slug_redirects (post_id);
