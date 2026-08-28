-- ============================================================================
-- QHRT — user_roles & user_progress (idempotent)
-- ----------------------------------------------------------------------------
-- These two tables + the app_role enum exist in the live database but were never
-- captured in a migration. This file reproduces them so a fresh Supabase project
-- can be built from migrations alone.
--
-- IDEMPOTENT: safe to run on the live DB (tables already exist) and on fresh DBs.
--   - CREATE TYPE is guarded by an existence check.
--   - CREATE TABLE IF NOT EXISTS is a no-op when the table already exists.
--   - Policies use DROP POLICY IF EXISTS + CREATE POLICY so re-runs don't fail.
--
-- FRESH-DB ORDERING:
--   The RLS policies in 001 / 003 / 005 reference `user_roles` (e.g.
--   `user_roles.role = 'admin'`). On a FRESH database those policies are created
--   before this file runs, so `user_roles` must exist first. Run this file BEFORE
--   001/003/005 on a fresh project (or run it first and re-apply the others).
--   On the LIVE database the tables already exist, so ordering is a non-issue.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. app_role enum (required by user_roles.role)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    WHERE t.typname = 'app_role' AND t.typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin');
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 2. user_roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL,
  role    public.app_role NOT NULL,
  PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role (used by the app to resolve the current role).
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.user_roles;
CREATE POLICY "Enable users to view their own data only"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. user_progress
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id                    UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  intake_completed           BOOLEAN      NOT NULL DEFAULT false,
  presenting_concern         TEXT,
  presenting_concern_other   TEXT,
  stress_before              SMALLINT,
  emotional_intensity_before SMALLINT,
  body_tension_before        SMALLINT,
  regulation_issue           TEXT,
  regulation_issue_other     TEXT,
  sleep_quality              TEXT,
  goals                      TEXT,
  intake_date                TIMESTAMPTZ,
  -- Aggregate columns: read by analytics/dashboard, written by a follow-up
  -- trigger/function (not yet implemented). Defaults keep them safe to read.
  sessions_completed         SMALLINT     NOT NULL DEFAULT 0,
  last_session_date          TIMESTAMPTZ,
  avg_stress_before          DOUBLE PRECISION,
  avg_stress_after           DOUBLE PRECISION,
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_intake_completed
  ON public.user_progress (intake_completed);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress.
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own progress (intake upsert).
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress.
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
