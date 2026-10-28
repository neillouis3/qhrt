-- ============================================================================
-- QHRT — module lesson completions
--
-- One row per user per lesson when they finish a guide. Assessment lessons
-- still use assessment_submissions.
-- Run after supabase/010_learning_modules.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.module_lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.module_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_module_lesson_completions_user
  ON public.module_lesson_completions (user_id, completed_at DESC);

ALTER TABLE public.module_lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own module lesson completions" ON public.module_lesson_completions;
CREATE POLICY "Users can view own module lesson completions"
  ON public.module_lesson_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own module lesson completions" ON public.module_lesson_completions;
CREATE POLICY "Users can insert own module lesson completions"
  ON public.module_lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access on module lesson completions" ON public.module_lesson_completions;
CREATE POLICY "Admin full access on module lesson completions"
  ON public.module_lesson_completions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

GRANT SELECT, INSERT ON public.module_lesson_completions TO authenticated;
GRANT ALL ON public.module_lesson_completions TO service_role;
