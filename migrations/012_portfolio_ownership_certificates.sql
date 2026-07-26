ALTER TABLE ownership_certificates ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE ownership_certificates ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE ownership_certificates
  ADD COLUMN IF NOT EXISTS portfolio_project_id STRING NULL
  REFERENCES portfolio_projects(id);

ALTER TABLE ownership_certificates
  ADD CONSTRAINT IF NOT EXISTS ownership_certificates_source_chk
  CHECK (
    (project_id IS NOT NULL AND portfolio_project_id IS NULL)
    OR
    (project_id IS NULL AND portfolio_project_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS ownership_certificates_active_portfolio_idx
  ON ownership_certificates (portfolio_project_id)
  WHERE portfolio_project_id IS NOT NULL AND status IN ('draft', 'issued');
