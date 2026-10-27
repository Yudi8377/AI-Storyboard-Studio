-- AI Storyboard Studio initial schema
-- Apply with a migration runner or Neon SQL editor.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.storyboard_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  brief text NOT NULL DEFAULT '' CHECK (char_length(brief) <= 20000),
  format text NOT NULL DEFAULT 'film' CHECK (format IN ('film','advertisement','social','documentary','animation','music_video')),
  visual_style text NOT NULL DEFAULT 'cinematic' CHECK (char_length(visual_style) <= 100),
  language text NOT NULL DEFAULT 'id' CHECK (char_length(language) BETWEEN 2 AND 12),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','generating','completed','failed','archived')),
  provider text,
  estimated_cost numeric(12,4),
  cost_approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.storyboard_shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.storyboard_projects(id) ON DELETE CASCADE,
  shot_number integer NOT NULL CHECK (shot_number BETWEEN 1 AND 100),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  scene_description text NOT NULL DEFAULT '' CHECK (char_length(scene_description) <= 10000),
  camera_direction text NOT NULL DEFAULT '' CHECK (char_length(camera_direction) <= 3000),
  composition text NOT NULL DEFAULT '' CHECK (char_length(composition) <= 3000),
  visual_prompt text NOT NULL DEFAULT '' CHECK (char_length(visual_prompt) <= 10000),
  narration text NOT NULL DEFAULT '' CHECK (char_length(narration) <= 5000),
  duration_seconds integer CHECK (duration_seconds BETWEEN 1 AND 3600),
  keyframe_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','generating','completed','failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, shot_number)
);

CREATE TABLE IF NOT EXISTS public.storyboard_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.storyboard_projects(id) ON DELETE CASCADE,
  provider text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('outline','shot_list','keyframe','export')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  estimated_cost numeric(12,4),
  actual_cost numeric(12,4),
  user_approved_at timestamptz,
  request_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_storyboard_projects_owner_updated
  ON public.storyboard_projects (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_storyboard_shots_project_number
  ON public.storyboard_shots (project_id, shot_number);
CREATE INDEX IF NOT EXISTS idx_storyboard_jobs_project_created
  ON public.storyboard_generation_jobs (project_id, created_at DESC);

-- Access control is intentionally enforced by the future server/API layer.
-- Do not expose Neon credentials or allow anonymous direct database access.
