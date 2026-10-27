ALTER TABLE storyboard_projects ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_storyboard_projects_owner_updated ON storyboard_projects (owner_id, updated_at DESC);