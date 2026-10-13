-- ============================================================================
-- QHRT Assessment Engine v1.0
-- Admin-authored assessments: questions, scoring, and workbook routing.
-- Questions and outcomes are JSONB documents validated by the app
-- (see lib/assessments/validate.ts for the shape).
-- Run after 008_diary_entries.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. workbooks — destinations an assessment outcome can route to
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on workbooks"
  ON workbooks FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Authenticated can view active workbooks"
  ON workbooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 2. assessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  disclaimer TEXT,
  cover_image TEXT,
  scoring_method TEXT NOT NULL DEFAULT 'sum'
    CHECK (scoring_method IN ('sum', 'mean', 'top_category')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Authenticated can view active assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 3. assessment_submissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment submissions"
  ON assessment_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assessment submissions"
  ON assessment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin full access on assessment_submissions"
  ON assessment_submissions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_user ON assessment_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment ON assessment_submissions(assessment_id);

-- ============================================================================
-- Seed data — starter workbooks (links are placeholders; edit in admin)
-- ============================================================================
INSERT INTO workbooks (id, title, description, url, display_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Advanced Goal-Setting & Habit Optimization Masterclass', 'Stretch goals and systems when perceived stress is already low.', '/journeys', 1),
  ('a0000000-0000-4000-8000-000000000002', 'Weekly Routine Reset', 'Rebuild rhythm when stress is noticeable but manageable.', '/diary', 2),
  ('a0000000-0000-4000-8000-000000000003', 'The Overcoming Overwhelm & Boundaries Playbook', 'Prioritize limits and recovery when load feels high.', '/journeys', 3),
  ('a0000000-0000-4000-8000-000000000004', 'Foundations of Mental Toughness: Daily Bounce-Back Routine', 'Small daily reps to strengthen recovery after setbacks.', '/diary', 4),
  ('a0000000-0000-4000-8000-000000000005', 'Your coaching dashboard', 'Keep going with focus areas, diary, and Home suggestions.', '/home', 5),
  ('a0000000-0000-4000-8000-000000000006', 'Leadership & Elite Mindset Trajectories', 'Challenge-tier workbook when bounce-back is already strong.', '/journeys', 6),
  ('a0000000-0000-4000-8000-000000000007', 'The Assertive ''No'' Workbook', 'Practice saying no when your energy is depleted.', '/diary', 7),
  ('a0000000-0000-4000-8000-000000000008', 'Workplace Wind-Down Boundaries', 'Protect your evenings from work messages and email.', '/diary', 8),
  ('a0000000-0000-4000-8000-000000000009', 'The Digital Sunset Checklist for Quality Rest', 'Screen habits for the last 30 minutes before sleep.', '/breathe', 9),
  ('a0000000-0000-4000-8000-000000000010', 'Self-Care vs. Overwork Tradeoffs', 'Rebalance movement, meals, and time outdoors.', '/diary', 10),
  ('a0000000-0000-4000-8000-000000000011', 'Wind-Down Routine Builder', 'Habit stacks for the hour before bed.', '/breathe', 11),
  ('a0000000-0000-4000-8000-000000000012', 'Night Waking Reset', 'What to try when you wake in the night.', '/breathe', 12),
  ('a0000000-0000-4000-8000-000000000013', 'Morning Anchors', 'Steady your day after a short or broken night.', '/diary', 13),
  ('a0000000-0000-4000-8000-000000000014', 'Sleep Quality Basics', 'Focus on feeling refreshed, not a perfect night.', '/diary', 14),
  ('a0000000-0000-4000-8000-000000000015', 'Busy Mind at Bedtime', 'Worry windows and thought parking before sleep.', '/diary', 15),
  ('a0000000-0000-4000-8000-000000000016', 'Calm Body Before Bed', 'Gentle movement and breathing to settle physical restlessness.', '/breathe', 16),
  ('a0000000-0000-4000-8000-000000000017', 'Sleep Environment Checklist', 'Small tweaks to light, sound, and temperature.', '/diary', 17),
  ('a0000000-0000-4000-8000-000000000018', 'Explore focus areas', 'Pick another assessment that matches what you want to work on.', '/assessments', 18)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed data — assessments
-- ============================================================================

-- Sleep habits (ported from the Sleep knowledge model, including its branching)
INSERT INTO assessments (slug, title, description, instructions, disclaimer, cover_image, scoring_method, display_order, questions, outcomes)
VALUES (
  'sleep',
  'Sleep habits check-in',
  'How falling asleep, staying asleep, and waking up have been going lately.',
  'Answer based on a typical night over the past few weeks. Some questions only appear when they apply.',
  'Educational self-check only. This is not a sleep study or a diagnosis, and it does not replace professional care.',
  '/sleep-assessment.jpg',
  'top_category',
  1,
  $json$[
    {"key": "sleep_story", "text": "Tell us a little about your sleep.", "type": "text", "required": false},
    {"key": "falling_asleep_difficulty", "text": "Do you have difficulty falling asleep?", "type": "choice", "category": "falling_asleep",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "falling_asleep_time", "text": "Approximately how long does it usually take you to fall asleep?", "type": "choice", "category": "falling_asleep",
     "showIf": {"questionKey": "falling_asleep_difficulty", "values": ["yes"]},
     "options": [{"value": "under_15_min", "label": "Less than 15 minutes", "score": 0}, {"value": "15_to_30_min", "label": "15 to 30 minutes", "score": 1}, {"value": "30_to_60_min", "label": "30 to 60 minutes", "score": 2}, {"value": "over_60_min", "label": "More than 60 minutes", "score": 3}]},
    {"key": "falling_asleep_frequency", "text": "How often does this happen?", "type": "choice", "category": "falling_asleep",
     "showIf": {"questionKey": "falling_asleep_difficulty", "values": ["yes"]},
     "options": [{"value": "rarely", "label": "Rarely (1-2 times per month)", "score": 0}, {"value": "occasionally", "label": "Occasionally (1-2 times per week)", "score": 1}, {"value": "frequently", "label": "Frequently (3-5 times per week)", "score": 2}, {"value": "almost_nightly", "label": "Almost every night", "score": 3}]},
    {"key": "night_waking", "text": "Do you wake during the night?", "type": "choice", "category": "staying_asleep",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "night_waking_count", "text": "Approximately how many times?", "type": "choice", "category": "staying_asleep",
     "showIf": {"questionKey": "night_waking", "values": ["yes"]},
     "options": [{"value": "once", "label": "Once", "score": 0}, {"value": "twice", "label": "Twice", "score": 1}, {"value": "three_to_four", "label": "Three to four times", "score": 2}, {"value": "more_than_four", "label": "More than four times", "score": 3}]},
    {"key": "night_waking_times", "text": "Do you remember approximately what time(s)?", "type": "choice", "required": false,
     "showIf": {"questionKey": "night_waking", "values": ["yes"]},
     "options": [{"value": "yes", "label": "Yes", "score": null}, {"value": "no", "label": "No", "score": null}, {"value": "unknown", "label": "I don't know", "score": null}]},
    {"key": "back_to_sleep", "text": "Can you usually get back to sleep?", "type": "choice", "category": "staying_asleep",
     "showIf": {"questionKey": "night_waking", "values": ["yes"]},
     "options": [{"value": "easily", "label": "Yes, easily", "score": 0}, {"value": "sometimes", "label": "Sometimes, with difficulty", "score": 1}, {"value": "no", "label": "No, I usually cannot", "score": 2}]},
    {"key": "awake_duration", "text": "Approximately how long are you awake?", "type": "choice", "category": "staying_asleep",
     "showIf": {"questionKey": "night_waking", "values": ["yes"]},
     "options": [{"value": "under_15_min", "label": "Less than 15 minutes total", "score": 0}, {"value": "15_to_30_min", "label": "15 to 30 minutes total", "score": 1}, {"value": "30_to_60_min", "label": "30 to 60 minutes total", "score": 2}, {"value": "over_60_min", "label": "More than 60 minutes total", "score": 3}]},
    {"key": "wake_time", "text": "What time do you usually wake for the day?", "type": "text", "required": false},
    {"key": "get_up_immediately", "text": "Do you usually get up immediately?", "type": "choice", "category": "mornings",
     "options": [{"value": "yes", "label": "Yes", "score": 0}, {"value": "no", "label": "No", "score": 1}]},
    {"key": "time_in_bed", "text": "Approximately how long do you remain in bed?", "type": "choice", "category": "mornings",
     "showIf": {"questionKey": "get_up_immediately", "values": ["no"]},
     "options": [{"value": "under_10_min", "label": "Less than 10 minutes", "score": 0}, {"value": "10_to_30_min", "label": "10 to 30 minutes", "score": 1}, {"value": "30_to_60_min", "label": "30 to 60 minutes", "score": 2}, {"value": "over_60_min", "label": "More than 60 minutes", "score": 3}]},
    {"key": "overall_quality", "text": "How would you describe your sleep overall?", "type": "choice", "category": "quality",
     "options": [{"value": "very_good", "label": "Very good", "score": 0}, {"value": "good", "label": "Good", "score": 1}, {"value": "fair", "label": "Fair", "score": 2}, {"value": "poor", "label": "Poor", "score": 3}, {"value": "very_poor", "label": "Very poor", "score": 4}]},
    {"key": "wake_refreshed", "text": "Do you usually wake feeling refreshed?", "type": "choice", "category": "quality",
     "options": [{"value": "yes", "label": "Yes", "score": 0}, {"value": "sometimes", "label": "Sometimes", "score": 1}, {"value": "no", "label": "No", "score": 2}]},
    {"key": "nightmares", "text": "Do you experience nightmares?", "type": "choice", "category": "busy_mind",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "wake_anxious", "text": "Do you wake feeling anxious?", "type": "choice", "category": "busy_mind",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "wake_racing_heart", "text": "Do you wake with rapid breathing or a racing heart?", "type": "choice", "category": "busy_mind",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "move_at_night", "text": "Do you move around a lot during the night?", "type": "choice", "category": "restless_body",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "legs_move", "text": "Do your legs move during sleep?", "type": "choice", "category": "restless_body",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "messy_sheets", "text": "Are your bed sheets usually messy when you wake?", "type": "choice", "category": "restless_body",
     "options": [{"value": "yes", "label": "Yes", "score": 1}, {"value": "no", "label": "No", "score": 0}]},
    {"key": "sleep_position", "text": "Which position do you usually fall asleep in?", "type": "choice", "required": false,
     "options": [{"value": "back", "label": "On my back", "score": null}, {"value": "stomach", "label": "On my stomach", "score": null}, {"value": "side", "label": "On my side", "score": null}, {"value": "varies", "label": "It varies", "score": null}]}
  ]$json$::jsonb,
  $json$[
    {"key": "falling_asleep", "label": "Falling asleep", "summary": "Settling down at night stood out most. A steady wind-down routine is a good place to start.", "match": "top_category", "category": "falling_asleep", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000011", "a0000000-0000-4000-8000-000000000009"]},
    {"key": "staying_asleep", "label": "Staying asleep", "summary": "Night waking stood out most. Try a few habits for getting back to rest.", "match": "top_category", "category": "staying_asleep", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000012"]},
    {"key": "mornings", "label": "Mornings", "summary": "Getting going in the morning stood out most. Simple morning anchors can help.", "match": "top_category", "category": "mornings", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000013"]},
    {"key": "quality", "label": "Feeling rested", "summary": "Overall rest quality stood out most. Start with the basics of feeling refreshed.", "match": "top_category", "category": "quality", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000014"]},
    {"key": "busy_mind", "label": "Busy mind at night", "summary": "A busy or unsettled mind around sleep stood out most.", "match": "top_category", "category": "busy_mind", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000015"]},
    {"key": "restless_body", "label": "Restless body", "summary": "Physical restlessness at night stood out most.", "match": "top_category", "category": "restless_body", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000016"]},
    {"key": "steady", "label": "Steady rest", "summary": "No single area stood out. Keep your routine steady and fine-tune your environment.", "match": "fallback", "workbookIds": ["a0000000-0000-4000-8000-000000000017"]}
  ]$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Perceived Stress Scale (PSS-10, Cohen)
INSERT INTO assessments (slug, title, description, instructions, disclaimer, scoring_method, display_order, questions, outcomes)
VALUES (
  'pss-10',
  'Perceived Stress Scale (PSS-10)',
  'How stressful the past month has felt to you.',
  'For each question, choose how often you felt this way in the last month.',
  'Educational self-check only. This is not a medical or mental health diagnosis and does not replace professional care.',
  'sum',
  2,
  $json$[
    {"key": "pss_1", "text": "In the last month, how often have you been upset because of something that happened unexpectedly?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_2", "text": "In the last month, how often have you felt that you were unable to control the important things in your life?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_3", "text": "In the last month, how often have you felt nervous and \"stressed\"?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_4", "text": "In the last month, how often have you felt confident about your ability to handle your personal problems?", "type": "choice", "reverse": true, "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_5", "text": "In the last month, how often have you felt that things were going your way?", "type": "choice", "reverse": true, "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_6", "text": "In the last month, how often have you found that you could not cope with all the things that you had to do?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_7", "text": "In the last month, how often have you been able to control irritations in your life?", "type": "choice", "reverse": true, "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_8", "text": "In the last month, how often have you felt that you were on top of things?", "type": "choice", "reverse": true, "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_9", "text": "In the last month, how often have you been angered because of things that were outside of your control?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]},
    {"key": "pss_10", "text": "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", "type": "choice", "options": [{"value": "0", "label": "Never", "score": 0}, {"value": "1", "label": "Almost never", "score": 1}, {"value": "2", "label": "Sometimes", "score": 2}, {"value": "3", "label": "Fairly often", "score": 3}, {"value": "4", "label": "Very often", "score": 4}]}
  ]$json$::jsonb,
  $json$[
    {"key": "low", "label": "Lower perceived stress", "summary": "Your answers suggest lower perceived stress this month — a good time to optimize goals and habits.", "match": "score_range", "min": 0, "max": 13, "workbookIds": ["a0000000-0000-4000-8000-000000000001"]},
    {"key": "moderate", "label": "Moderate perceived stress", "summary": "Your answers suggest moderate perceived stress — a routine reset may help.", "match": "score_range", "min": 14, "max": 26, "workbookIds": ["a0000000-0000-4000-8000-000000000002"]},
    {"key": "high", "label": "Higher perceived stress", "summary": "Your answers suggest higher perceived stress — prioritize boundaries and overwhelm tools.", "match": "score_range", "min": 27, "max": 40, "workbookIds": ["a0000000-0000-4000-8000-000000000003"]}
  ]$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Brief Resilience Scale (BRS, Smith et al. 2008)
INSERT INTO assessments (slug, title, description, instructions, disclaimer, scoring_method, display_order, questions, outcomes)
VALUES (
  'brs',
  'Brief Resilience Scale (BRS)',
  'How easily you bounce back after hard times.',
  'Rate how much you agree with each statement.',
  'Educational self-check only. This measures self-reported resilience for content routing — not a clinical assessment.',
  'mean',
  3,
  $json$[
    {"key": "brs_1", "text": "I tend to bounce back quickly after hard times.", "type": "choice", "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]},
    {"key": "brs_2", "text": "I have a hard time making it through stressful events.", "type": "choice", "reverse": true, "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]},
    {"key": "brs_3", "text": "It does not take me long to recover from a stressful event.", "type": "choice", "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]},
    {"key": "brs_4", "text": "It is hard for me to snap back when something bad happens.", "type": "choice", "reverse": true, "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]},
    {"key": "brs_5", "text": "I usually come through difficult times with little trouble.", "type": "choice", "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]},
    {"key": "brs_6", "text": "I tend to take a long time to get over setbacks in my life.", "type": "choice", "reverse": true, "options": [{"value": "1", "label": "Strongly disagree", "score": 1}, {"value": "2", "label": "Disagree", "score": 2}, {"value": "3", "label": "Neutral", "score": 3}, {"value": "4", "label": "Agree", "score": 4}, {"value": "5", "label": "Strongly agree", "score": 5}]}
  ]$json$::jsonb,
  $json$[
    {"key": "low", "label": "Building resilience", "summary": "Your average suggests room to build daily bounce-back routines.", "match": "score_range", "min": 1, "max": 2.99, "workbookIds": ["a0000000-0000-4000-8000-000000000004"]},
    {"key": "typical", "label": "Typical resilience", "summary": "Your average is in a typical range — keep using your dashboard and focus areas.", "match": "score_range", "min": 3, "max": 4.3, "workbookIds": ["a0000000-0000-4000-8000-000000000005"]},
    {"key": "high", "label": "Strong resilience", "summary": "Your average suggests strong bounce-back — try a challenge-tier workbook if you want to go deeper.", "match": "score_range", "min": 4.31, "max": 5, "workbookIds": ["a0000000-0000-4000-8000-000000000006"]}
  ]$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Lifestyle & Energy Audit (QHRT original)
INSERT INTO assessments (slug, title, description, instructions, disclaimer, scoring_method, display_order, questions, outcomes)
VALUES (
  'lifestyle-energy',
  'Lifestyle & Energy Audit',
  'Habit patterns in a typical week that drain your energy.',
  'Rate how often each of these happens in your typical week.',
  'This audit routes you to a standard workbook by topic. It does not diagnose burnout or any medical condition.',
  'top_category',
  4,
  $json$[
    {"key": "life_boundaries", "text": "I say \"yes\" to requests from others even when my energy is completely depleted.", "type": "choice", "category": "boundaries", "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Frequently", "score": 2}]},
    {"key": "life_workplace", "text": "I reply to text messages or emails during my designated winding-down hours.", "type": "choice", "category": "workplace", "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Frequently", "score": 2}]},
    {"key": "life_sleep", "text": "I scroll through my smartphone or work on a computer screen within 30 minutes of attempting to fall asleep.", "type": "choice", "category": "sleep", "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Frequently", "score": 2}]},
    {"key": "life_selfcare", "text": "I sacrifice exercise, meal-prep, or outdoor movement to fit more work tasks into my day.", "type": "choice", "category": "selfcare", "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Frequently", "score": 2}]}
  ]$json$::jsonb,
  $json$[
    {"key": "boundaries", "label": "Boundaries", "summary": "Saying yes when you are depleted showed up most often.", "match": "top_category", "category": "boundaries", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000007"]},
    {"key": "workplace", "label": "Work wind-down", "summary": "Work creeping into your wind-down hours showed up most often.", "match": "top_category", "category": "workplace", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000008"]},
    {"key": "sleep", "label": "Screens before sleep", "summary": "Screens right before bed showed up most often.", "match": "top_category", "category": "sleep", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000009"]},
    {"key": "selfcare", "label": "Self-care", "summary": "Trading self-care for work tasks showed up most often.", "match": "top_category", "category": "selfcare", "min": 2, "workbookIds": ["a0000000-0000-4000-8000-000000000010"]},
    {"key": "balanced", "label": "Balanced week", "summary": "No single habit showed up frequently. Pick any focus area that fits what you want to learn.", "match": "fallback", "workbookIds": ["a0000000-0000-4000-8000-000000000018"]}
  ]$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;
