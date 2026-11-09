-- ============================================================================
-- Sleep reflection themes, clarifying statements, and guided reflection sessions.
-- Themes are content rows. A guided session stores snapshots and is never reused
-- for a later theme, including a repeat of the same theme.
-- Run after 010_learning_modules.sql in the Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reflection_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key TEXT NOT NULL CHECK (theme_key ~ '^[A-Z0-9_]+$'),
  domain TEXT NOT NULL DEFAULT 'SLEEP' CHECK (domain ~ '^[A-Z0-9_]+$'),
  label TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  display_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  content_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (theme_key, locale)
);

CREATE TABLE IF NOT EXISTS public.reflection_clarifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES public.reflection_themes(id) ON DELETE CASCADE,
  clarifier_key TEXT NOT NULL CHECK (clarifier_key ~ '^[A-Z0-9_]+$'),
  body TEXT NOT NULL,
  allows_custom BOOLEAN NOT NULL DEFAULT false,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  display_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  content_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (theme_id, clarifier_key)
);

CREATE TABLE IF NOT EXISTS public.reflection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
  current_state TEXT NOT NULL DEFAULT 'THEME_INTRO' CHECK (current_state IN (
    'THEME_INTRO',
    'EVENING_PICTURE',
    'MORNING_PICTURE',
    'FRUSTRATION',
    'BREATHING',
    'RERATE',
    'EVENING_RETURN',
    'MORNING_RETURN',
    'PERSPECTIVE',
    'EVERYDAY_LIFE',
    'OBSERVATION',
    'NEXT_STEP'
  )),
  source_domain TEXT NOT NULL DEFAULT 'SLEEP',
  theme_id UUID REFERENCES public.reflection_themes(id) ON DELETE SET NULL,
  theme_key TEXT NOT NULL,
  theme_snapshot TEXT NOT NULL,
  clarifier_id UUID REFERENCES public.reflection_clarifiers(id) ON DELETE SET NULL,
  clarifier_snapshot TEXT NOT NULL DEFAULT '',
  custom_clarifier_text TEXT NOT NULL DEFAULT '',
  content_version TEXT NOT NULL DEFAULT '1.0',
  locale TEXT NOT NULL DEFAULT 'en',
  sleep_pattern_id TEXT,
  source_module_progress_id TEXT,
  breath_phase TEXT NOT NULL DEFAULT 'ask' CHECK (breath_phase IN ('ask', 'breathe', 'zero')),
  ratings SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
  perspective_text TEXT NOT NULL DEFAULT '',
  observation_choice TEXT NOT NULL DEFAULT '',
  observation_note TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflection_themes_domain
  ON public.reflection_themes (domain, locale, display_order);

CREATE INDEX IF NOT EXISTS idx_reflection_clarifiers_theme
  ON public.reflection_clarifiers (theme_id, display_order);

CREATE INDEX IF NOT EXISTS idx_reflection_sessions_user
  ON public.reflection_sessions (user_id, created_at DESC);

ALTER TABLE public.reflection_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_clarifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on reflection_themes" ON public.reflection_themes;
CREATE POLICY "Admin full access on reflection_themes"
  ON public.reflection_themes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Authenticated can view enabled reflection_themes" ON public.reflection_themes;
CREATE POLICY "Authenticated can view enabled reflection_themes"
  ON public.reflection_themes FOR SELECT
  TO authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS "Admin full access on reflection_clarifiers" ON public.reflection_clarifiers;
CREATE POLICY "Admin full access on reflection_clarifiers"
  ON public.reflection_clarifiers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Authenticated can view enabled reflection_clarifiers" ON public.reflection_clarifiers;
CREATE POLICY "Authenticated can view enabled reflection_clarifiers"
  ON public.reflection_clarifiers FOR SELECT
  TO authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM public.reflection_themes
      WHERE reflection_themes.id = reflection_clarifiers.theme_id
        AND reflection_themes.enabled = true
    )
  );

DROP POLICY IF EXISTS "Users read own reflection_sessions" ON public.reflection_sessions;
CREATE POLICY "Users read own reflection_sessions"
  ON public.reflection_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own reflection_sessions" ON public.reflection_sessions;
CREATE POLICY "Users insert own reflection_sessions"
  ON public.reflection_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reflection_sessions" ON public.reflection_sessions;
CREATE POLICY "Users update own reflection_sessions"
  ON public.reflection_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.reflection_themes TO service_role;
GRANT ALL ON public.reflection_clarifiers TO service_role;
GRANT ALL ON public.reflection_sessions TO service_role;

INSERT INTO public.reflection_themes (id, theme_key, domain, label, locale, display_order, enabled, content_version)
VALUES
  ('c1000000-0000-4000-8000-000000000001', 'PERSONAL_TIME', 'SLEEP', 'Personal Time', 'en', 1, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000002', 'UNFINISHED_TASKS', 'SLEEP', 'Unfinished Tasks', 'en', 2, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000003', 'TOMORROW_PLANNING', 'SLEEP', 'Tomorrow & Planning', 'en', 3, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000004', 'RESPONSIBILITIES', 'SLEEP', 'Responsibilities', 'en', 4, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000005', 'AVAILABILITY_TO_OTHERS', 'SLEEP', 'Being Available to Others', 'en', 5, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000006', 'DIFFICULTY_STOPPING', 'SLEEP', 'Difficulty Stopping', 'en', 6, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000007', 'PRODUCTIVITY', 'SLEEP', 'Productivity', 'en', 7, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000008', 'CONTROL_CHOICE', 'SLEEP', 'Control & Choice', 'en', 8, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000009', 'ANTICIPATION', 'SLEEP', 'Anticipation', 'en', 9, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000a', 'MENTAL_ACTIVITY', 'SLEEP', 'Mental Activity', 'en', 10, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000b', 'REPLAYING_DAY', 'SLEEP', 'Replaying the Day', 'en', 11, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000c', 'CLOCK_AWARENESS', 'SLEEP', 'Clock Awareness', 'en', 12, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000d', 'QUIET_SOLITUDE', 'SLEEP', 'Quiet & Solitude', 'en', 13, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000e', 'REWARD', 'SLEEP', 'Reward After a Demanding Day', 'en', 14, true, '1.0'),
  ('c1000000-0000-4000-8000-00000000000f', 'AUTONOMY', 'SLEEP', 'Autonomy', 'en', 15, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000010', 'TRANSITIONS', 'SLEEP', 'Transitions', 'en', 16, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000011', 'COMFORT', 'SLEEP', 'Comfort', 'en', 17, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000012', 'WAKING_MENTAL_ENGAGEMENT', 'SLEEP', 'Waking & Becoming Mentally Engaged', 'en', 18, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000013', 'RETURN_TO_SLEEP', 'SLEEP', 'Returning to Sleep', 'en', 19, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000014', 'REST_PERMISSION', 'SLEEP', 'Rest & Permission to Pause', 'en', 20, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000015', 'SLEEP_EXPECTATIONS', 'SLEEP', 'Expectations About Sleep', 'en', 21, true, '1.0'),
  ('c1000000-0000-4000-8000-000000000016', 'OTHER', 'SLEEP', 'Something Else', 'en', 22, true, '1.0')
ON CONFLICT (theme_key, locale) DO NOTHING;

INSERT INTO public.reflection_clarifiers (id, theme_id, clarifier_key, body, allows_custom, locale, display_order, enabled, content_version)
VALUES
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'PT_1', 'Late evening feels like time that belongs to me.', false, 'en', 1, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'PT_2', 'I enjoy having fewer demands at night.', false, 'en', 2, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'PT_3', 'I do not want the quiet part of my day to end.', false, 'en', 3, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 'PT_4', 'I use late evening as a reward after a demanding day.', false, 'en', 4, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 'PT_5', 'I continue an enjoyable activity even when I had planned to stop.', false, 'en', 5, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 'PT_6', 'I sometimes choose additional personal time even when I know I may feel tired the next morning.', false, 'en', 6, true, '1.0'),
  ('c2000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000001', 'CUSTOM', 'Something different feels more accurate for me.', true, 'en', 7, true, '1.0')
ON CONFLICT (theme_id, clarifier_key) DO NOTHING;

INSERT INTO public.reflection_clarifiers (id, theme_id, clarifier_key, body, allows_custom, locale, display_order, enabled, content_version)
SELECT
  ('c2100000-0000-4000-8000-' || lpad(display_order::text, 12, '0'))::uuid,
  id,
  'CUSTOM',
  'Something different feels more accurate for me.',
  true,
  locale,
  1,
  true,
  '1.0'
FROM public.reflection_themes
WHERE theme_key <> 'PERSONAL_TIME'
ON CONFLICT (theme_id, clarifier_key) DO NOTHING;
