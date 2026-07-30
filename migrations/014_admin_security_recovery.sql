-- Recovery codes may create only these short-lived authenticator-replacement
-- sessions. They are deliberately separate from ordinary admin sessions.
CREATE TABLE IF NOT EXISTS admin_recovery_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  token_hash STRING NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  network_hash STRING NULL,
  user_agent STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_recovery_sessions_user_idx
  ON admin_recovery_sessions (user_id, expires_at DESC);
