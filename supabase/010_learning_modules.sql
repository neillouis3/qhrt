-- ============================================================================
-- QHRT learning modules
-- A module (QHRT Foundation, Sleep) holds numbered lessons.
-- A lesson is either a step-by-step guide or an existing assessment.
-- Run after 009_assessment_engine.sql in the Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  position INT NOT NULL CHECK (position > 0),
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('guide', 'assessment')),
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, position)
);

CREATE INDEX IF NOT EXISTS idx_module_lessons_module ON module_lessons(module_id, position);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on learning_modules" ON learning_modules;
CREATE POLICY "Admin full access on learning_modules"
  ON learning_modules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Authenticated can view active learning_modules" ON learning_modules;
CREATE POLICY "Authenticated can view active learning_modules"
  ON learning_modules FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access on module_lessons" ON module_lessons;
CREATE POLICY "Admin full access on module_lessons"
  ON module_lessons FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Authenticated can view active module_lessons" ON module_lessons;
CREATE POLICY "Authenticated can view active module_lessons"
  ON module_lessons FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM learning_modules
      WHERE learning_modules.id = module_lessons.module_id
        AND learning_modules.is_active = true
    )
  );

INSERT INTO learning_modules (id, slug, title, description, display_order)
VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    'qhrt-foundation',
    'QHRT Foundation',
    'The first module. Learn what QHRT is and what a session is like.',
    1
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'sleep',
    'Sleep',
    'Assessments about falling asleep, staying asleep, and waking up.',
    2
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_lessons (id, module_id, position, title, description, kind, steps)
VALUES (
  'b0000000-0000-4000-8000-000000000011',
  'b0000000-0000-4000-8000-000000000001',
  1,
  'Starting out with QHRT',
  'A step-by-step look at how a session works.',
  'guide',
  $steps$[
    {"title":"Welcome","paragraphs":["This guide explains what QHRT is, why it works, and what you can expect in a session."],"points":[]},
    {"title":"Why stress lives in the body","paragraphs":["Stress turns on your body's fight or flight system."],"points":["Over time, stress can stay in muscles and organs.","QHRT helps your body let go of these stored patterns."]},
    {"title":"How breathwork helps","paragraphs":["Breathing slowly and with intention calms your nervous system, eases tension, and helps your body feel safe.","You will learn a simple pattern."],"points":["Inhale for 3 counts.","Exhale for 5 counts."]},
    {"title":"Understanding somatic sensations","paragraphs":["During QHRT, you may notice tightness, heat, pressure, tingling, or movement.","These sensations are normal and part of the release process."],"points":[]},
    {"title":"The SUD scale","paragraphs":["You rate sensations from 1 to 10. This helps track your progress."],"points":["1 is very mild.","10 is very intense."]},
    {"title":"Archetypal emotions","paragraphs":["Your guide may say a word like one of these. The words help your body reach stored emotional patterns."],"points":["Blame","Shame","Fear","Abandonment"]},
    {"title":"What happens in a session","paragraphs":["You stay in full control the entire time."],"points":["Breathe in a steady rhythm.","Gently engage your core.","Focus on your guide's voice.","Scan your body.","Notice sensations.","Allow them to shift and release."]},
    {"title":"After your session","paragraphs":["You may feel lighter, calmer, tired, or more aware of your body. These are normal signs of release."],"points":[]},
    {"title":"Between sessions","paragraphs":["You will practice a few things that help the work settle."],"points":["Breathwork","Somatic noticing","Journaling"]}
  ]$steps$::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_lessons (id, module_id, position, title, description, kind, assessment_id, steps)
SELECT
  'b0000000-0000-4000-8000-000000000021',
  'b0000000-0000-4000-8000-000000000002',
  1,
  a.title,
  a.description,
  'assessment',
  a.id,
  '[]'::jsonb
FROM assessments a
WHERE a.slug = 'sleep'
ON CONFLICT (id) DO NOTHING;
