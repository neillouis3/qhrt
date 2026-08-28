-- ============================================================================
-- QHRT Content Layer Seed — Assessment Questions & Progress Metrics
-- Run this in Supabase SQL Editor after the main schema is in place.
-- Seeds 5 conditions with assessment questions and progress metrics.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: Get condition IDs by name (idempotent — skips if already seeded)
-- ----------------------------------------------------------------------------

-- Anxiety
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Anxiety';

  IF v_condition_id IS NOT NULL THEN
    -- Assessment Questions for Anxiety
    INSERT INTO assessment_questions (condition_id, question_text, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Rate your overall anxiety level over the past 7 days.', '0-10', 0, 10, 1),
      (v_condition_id, 'How often have you experienced worry or tension that was hard to control?', '0-10', 0, 10, 2),
      (v_condition_id, 'Rate the intensity of physical symptoms (racing heart, tight chest, shallow breathing).', '0-10', 0, 10, 3),
      (v_condition_id, 'How much has anxiety interfered with your daily activities?', '0-10', 0, 10, 4)
    ON CONFLICT DO NOTHING;

    -- Progress Metrics for Anxiety
    INSERT INTO progress_metrics (condition_id, metric_name, metric_description, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Symptom Severity', 'Overall intensity of anxiety symptoms.', '0-10', 0, 10, 1),
      (v_condition_id, 'Symptom Frequency', 'How often anxiety episodes occur.', '0-10', 0, 10, 2),
      (v_condition_id, 'Emotional Impact', 'Effect on mood and emotional well-being.', '0-10', 0, 10, 3),
      (v_condition_id, 'Life Functioning', 'Ability to engage in daily activities and relationships.', '0-10', 0, 10, 4),
      (v_condition_id, 'Resilience', 'Capacity to cope with stressors and recover from setbacks.', '0-10', 0, 10, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Poor Sleep
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Poor Sleep';

  IF v_condition_id IS NOT NULL THEN
    -- Assessment Questions for Poor Sleep
    INSERT INTO assessment_questions (condition_id, question_text, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Rate your overall sleep quality over the past 7 days.', '0-10', 0, 10, 1),
      (v_condition_id, 'How difficult has it been to fall asleep?', '0-10', 0, 10, 2),
      (v_condition_id, 'How often have you woken up during the night and struggled to return to sleep?', '0-10', 0, 10, 3),
      (v_condition_id, 'Rate how rested you feel upon waking in the morning.', '0-10', 0, 10, 4)
    ON CONFLICT DO NOTHING;

    -- Progress Metrics for Poor Sleep
    INSERT INTO progress_metrics (condition_id, metric_name, metric_description, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Sleep Quality', 'Overall restfulness and depth of sleep.', '0-10', 0, 10, 1),
      (v_condition_id, 'Sleep Onset', 'Time and ease of falling asleep.', '0-10', 0, 10, 2),
      (v_condition_id, 'Night Awakenings', 'Frequency and duration of nighttime interruptions.', '0-10', 0, 10, 3),
      (v_condition_id, 'Morning Energy', 'Level of energy and alertness upon waking.', '0-10', 0, 10, 4),
      (v_condition_id, 'Daytime Functioning', 'Ability to function well during the day despite sleep issues.', '0-10', 0, 10, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Low Back Pain
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Low Back Pain';

  IF v_condition_id IS NOT NULL THEN
    -- Assessment Questions for Low Back Pain
    INSERT INTO assessment_questions (condition_id, question_text, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Rate your current low back pain intensity.', '0-10', 0, 10, 1),
      (v_condition_id, 'How much does back pain limit your physical activities?', '0-10', 0, 10, 2),
      (v_condition_id, 'Rate the level of muscle tension in your lower back and hips.', '0-10', 0, 10, 3),
      (v_condition_id, 'How often do you experience pain flare-ups?', '0-10', 0, 10, 4)
    ON CONFLICT DO NOTHING;

    -- Progress Metrics for Low Back Pain
    INSERT INTO progress_metrics (condition_id, metric_name, metric_description, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Pain Intensity', 'Overall severity of back pain.', '0-10', 0, 10, 1),
      (v_condition_id, 'Mobility', 'Range of motion and ease of movement.', '0-10', 0, 10, 2),
      (v_condition_id, 'Physical Impact', 'Effect on daily physical tasks and exercise.', '0-10', 0, 10, 3),
      (v_condition_id, 'Muscle Tension', 'Level of tightness and tension in the back region.', '0-10', 0, 10, 4),
      (v_condition_id, 'Pain Frequency', 'How often pain episodes occur.', '0-10', 0, 10, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Stress & Overwhelm
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Stress & Overwhelm';

  IF v_condition_id IS NOT NULL THEN
    -- Assessment Questions for Stress & Overwhelm
    INSERT INTO assessment_questions (condition_id, question_text, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Rate your overall stress level over the past 7 days.', '0-10', 0, 10, 1),
      (v_condition_id, 'How often have you felt overwhelmed by your responsibilities?', '0-10', 0, 10, 2),
      (v_condition_id, 'Rate your ability to relax and unwind during the day.', '0-10', 0, 10, 3),
      (v_condition_id, 'How much has stress affected your emotional well-being?', '0-10', 0, 10, 4)
    ON CONFLICT DO NOTHING;

    -- Progress Metrics for Stress & Overwhelm
    INSERT INTO progress_metrics (condition_id, metric_name, metric_description, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Stress Level', 'Overall perceived stress intensity.', '0-10', 0, 10, 1),
      (v_condition_id, 'Emotional Impact', 'Effect on mood and emotional stability.', '0-10', 0, 10, 2),
      (v_condition_id, 'Life Functioning', 'Ability to manage daily tasks and responsibilities.', '0-10', 0, 10, 3),
      (v_condition_id, 'Relaxation Capacity', 'Ability to unwind and find calm throughout the day.', '0-10', 0, 10, 4),
      (v_condition_id, 'Resilience', 'Capacity to bounce back from stressful events.', '0-10', 0, 10, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Chronic Fatigue
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Chronic Fatigue';

  IF v_condition_id IS NOT NULL THEN
    -- Assessment Questions for Chronic Fatigue
    INSERT INTO assessment_questions (condition_id, question_text, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Rate your overall fatigue level over the past 7 days.', '0-10', 0, 10, 1),
      (v_condition_id, 'How much has low energy affected your daily activities?', '0-10', 0, 10, 2),
      (v_condition_id, 'Rate your mental clarity and focus throughout the day.', '0-10', 0, 10, 3),
      (v_condition_id, 'How often do you need extended rest or naps to function?', '0-10', 0, 10, 4)
    ON CONFLICT DO NOTHING;

    -- Progress Metrics for Chronic Fatigue
    INSERT INTO progress_metrics (condition_id, metric_name, metric_description, scale_type, minimum_value, maximum_value, display_order)
    VALUES
      (v_condition_id, 'Energy Level', 'Overall vitality and stamina throughout the day.', '0-10', 0, 10, 1),
      (v_condition_id, 'Mental Clarity', 'Sharpness of thought and ability to concentrate.', '0-10', 0, 10, 2),
      (v_condition_id, 'Physical Impact', 'Effect on physical activities and exercise capacity.', '0-10', 0, 10, 3),
      (v_condition_id, 'Life Functioning', 'Ability to engage in work, social, and personal activities.', '0-10', 0, 10, 4),
      (v_condition_id, 'Recovery & Resilience', 'Speed and quality of recovery after exertion.', '0-10', 0, 10, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Also seed a few symptoms for these conditions
-- ----------------------------------------------------------------------------

-- Anxiety symptoms
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Anxiety';
  IF v_condition_id IS NOT NULL THEN
    INSERT INTO condition_symptoms (condition_id, symptom_name, display_order)
    VALUES
      (v_condition_id, 'Worry and rumination', 1),
      (v_condition_id, 'Physical tension', 2),
      (v_condition_id, 'Panic symptoms', 3),
      (v_condition_id, 'Sleep disturbance', 4),
      (v_condition_id, 'Hypervigilance', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Poor Sleep symptoms
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Poor Sleep';
  IF v_condition_id IS NOT NULL THEN
    INSERT INTO condition_symptoms (condition_id, symptom_name, display_order)
    VALUES
      (v_condition_id, 'Difficulty falling asleep', 1),
      (v_condition_id, 'Frequent night waking', 2),
      (v_condition_id, 'Non-restorative sleep', 3),
      (v_condition_id, 'Daytime fatigue', 4),
      (v_condition_id, 'Racing thoughts at bedtime', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Low Back Pain symptoms
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Low Back Pain';
  IF v_condition_id IS NOT NULL THEN
    INSERT INTO condition_symptoms (condition_id, symptom_name, display_order)
    VALUES
      (v_condition_id, 'Dull ache in lower back', 1),
      (v_condition_id, 'Sharp pain with movement', 2),
      (v_condition_id, 'Muscle stiffness and tightness', 3),
      (v_condition_id, 'Reduced range of motion', 4),
      (v_condition_id, 'Radiating pain to legs or hips', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Stress & Overwhelm symptoms
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Stress & Overwhelm';
  IF v_condition_id IS NOT NULL THEN
    INSERT INTO condition_symptoms (condition_id, symptom_name, display_order)
    VALUES
      (v_condition_id, 'Feeling overwhelmed', 1),
      (v_condition_id, 'Irritability and mood swings', 2),
      (v_condition_id, 'Difficulty concentrating', 3),
      (v_condition_id, 'Physical tension in shoulders and jaw', 4),
      (v_condition_id, 'Inability to relax', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Chronic Fatigue symptoms
DO $$
DECLARE
  v_condition_id UUID;
BEGIN
  SELECT id INTO v_condition_id FROM conditions WHERE name = 'Chronic Fatigue';
  IF v_condition_id IS NOT NULL THEN
    INSERT INTO condition_symptoms (condition_id, symptom_name, display_order)
    VALUES
      (v_condition_id, 'Persistent tiredness', 1),
      (v_condition_id, 'Brain fog and mental fatigue', 2),
      (v_condition_id, 'Lack of motivation', 3),
      (v_condition_id, 'Physical weakness', 4),
      (v_condition_id, 'Need for extended rest', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
