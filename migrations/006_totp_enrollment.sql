-- Self-service TOTP enrollment: authenticators are created as pending
-- (confirmed_at NULL) when an admin registers with the registration code, and
-- confirmed once the first valid authenticator code is entered.
ALTER TABLE admin_authenticators ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ NULL;
