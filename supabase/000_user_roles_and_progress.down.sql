-- ============================================================================
-- QHRT — 000 rollback (down migration)
-- ----------------------------------------------------------------------------
-- Drops the tables and enum created by 000_user_roles_and_progress.sql.
--
-- WARNING:
--   - Dropping `user_roles` breaks the RLS policies in 001/003/005 that reference
--     it (expected on rollback — those policies will error until re-created).
--   - This destroys role + progress data. Only run on a disposable/dev database.
-- ============================================================================

DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.user_roles;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    WHERE t.typname = 'app_role' AND t.typnamespace = 'public'::regnamespace
  ) THEN
    DROP TYPE public.app_role;
  END IF;
END
$$;
