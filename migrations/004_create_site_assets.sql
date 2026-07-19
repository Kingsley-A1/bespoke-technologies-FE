-- Admin-managed site appearance assets (e.g. the homepage hero phone
-- screenshots). Each row is one named slot pointing at a private R2 object
-- that is streamed through /api/site-assets/[key].
CREATE TABLE IF NOT EXISTS site_assets (
  asset_key STRING PRIMARY KEY,
  r2_key STRING NOT NULL,
  mime STRING NOT NULL,
  updated_by UUID NULL REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
