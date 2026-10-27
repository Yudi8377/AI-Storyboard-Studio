CREATE TABLE IF NOT EXISTS storyboard_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'Iklan 15 detik',
  style TEXT NOT NULL DEFAULT 'Sinematik realistis',
  language TEXT NOT NULL DEFAULT 'Indonesia',
  shot_count INTEGER NOT NULL DEFAULT 6,
  shots JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)