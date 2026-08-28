-- ============================================================================
-- Down migration for 007_mood_logs_and_ratings.sql
-- Drops the two tables (and their RLS policies + indexes) created by 007.
-- ============================================================================

DROP TABLE IF EXISTS public.session_ratings;
DROP TABLE IF EXISTS public.mood_logs;
