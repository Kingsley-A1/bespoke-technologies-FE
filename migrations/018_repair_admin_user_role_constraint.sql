-- Repair the admin role CHECK constraint, which carries the same defect as the
-- invoice-type constraint repaired in migration 017.
--
-- Migration 007 added the `employee` role and dropped the old constraint by its
-- PostgreSQL-style name `admin_users_role_check`. Under CockroachDB the name
-- generated for the unnamed column CHECK in migration 002 is `check_role`, so
-- that drop did nothing and the original two-role constraint is still enforced
-- alongside the wider one. Inviting an employee would be rejected at insert.
--
-- Kept in its own migration so each repair applies in its own transaction and
-- one failing cannot roll back the other.

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS check_role;

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_allowed
  CHECK (role IN ('founder_admin', 'admin_manager', 'employee'));
