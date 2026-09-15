-- ============================================================================
-- QHRT Sleep Knowledge Model Seed Data v1.0
-- First reference implementation for the Conversation Framework
-- Run after 003_conversation_framework_schema.sql
-- ============================================================================

DO $$
DECLARE
  v_km_id UUID;
  v_dim_initiation UUID;
  v_dim_maintenance UUID;
  v_dim_termination UUID;
  v_dim_quality UUID;
  v_dim_emotional UUID;
  v_dim_physiological UUID;
  v_dim_position UUID;
BEGIN
  -- ============================================================================
  -- 1. Create the Sleep Knowledge Model
  -- ============================================================================
  INSERT INTO knowledge_models (name, description, version, is_active)
  VALUES ('Sleep Assessment', 'How falling asleep, staying asleep, and waking up have been going — including restlessness, dreams, and how your body feels at night.', '1.0', true)
  RETURNING id INTO v_km_id;

  IF v_km_id IS NULL THEN
    SELECT id INTO v_km_id FROM knowledge_models WHERE name = 'Sleep Assessment' LIMIT 1;
  END IF;

  -- ============================================================================
  -- 2. Evidence Dimensions (7 dimensions, priority ordered)
  -- ============================================================================

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Sleep Initiation', 'Difficulty falling asleep, sleep latency, and frequency of initiation problems.', 1, true, true)
  RETURNING id INTO v_dim_initiation;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Sleep Maintenance', 'Night waking patterns, frequency of awakenings, and ability to return to sleep.', 2, true, true)
  RETURNING id INTO v_dim_maintenance;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Sleep Termination', 'Morning wake time and behavior upon waking.', 3, true, true)
  RETURNING id INTO v_dim_termination;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Sleep Quality', 'Overall sleep quality and refreshment upon waking.', 4, true, true)
  RETURNING id INTO v_dim_quality;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Emotional State', 'Nightmares, anxiety, and physiological arousal upon waking.', 5, true, true)
  RETURNING id INTO v_dim_emotional;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Physiological Activity', 'Physical movement during sleep and restlessness indicators.', 6, true, true)
  RETURNING id INTO v_dim_physiological;

  INSERT INTO evidence_dimensions (knowledge_model_id, name, description, priority, is_required, is_active)
  VALUES (v_km_id, 'Sleep Position', 'Preferred sleep position at onset.', 7, true, true)
  RETURNING id INTO v_dim_position;

  -- ============================================================================
  -- 3. Prompts
  -- ============================================================================

  -- P001: Opening narrative prompt (no dimension — free-floating opener)
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, NULL, 'P001', 'Tell me about your sleep.', 'free_text', 0, true);

  -- --- Sleep Initiation Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_initiation, 'P002', 'Do you have difficulty falling asleep?', 'single_choice', 1, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_initiation, 'P003', 'Approximately how long does it usually take you to fall asleep?', 'single_choice', 2, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_initiation, 'P004', 'How often does this happen?', 'single_choice', 3, true);

  -- --- Sleep Maintenance Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_maintenance, 'P005', 'Do you wake during the night?', 'single_choice', 4, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_maintenance, 'P006', 'Approximately how many times?', 'single_choice', 5, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_maintenance, 'P007', 'Do you remember approximately what time(s)?', 'single_choice', 6, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_maintenance, 'P008', 'Can you usually get back to sleep?', 'single_choice', 7, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_maintenance, 'P009', 'Approximately how long are you awake?', 'single_choice', 8, true);

  -- --- Sleep Termination Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_termination, 'P010', 'What time do you usually wake for the day?', 'free_text', 9, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_termination, 'P011', 'Do you usually get up immediately?', 'single_choice', 10, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_termination, 'P012', 'If not, approximately how long do you remain in bed?', 'single_choice', 11, true);

  -- --- Sleep Quality Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_quality, 'P013', 'How would you describe your sleep overall?', 'single_choice', 12, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_quality, 'P014', 'Do you usually wake feeling refreshed?', 'single_choice', 13, true);

  -- --- Emotional State Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_emotional, 'P015', 'Do you experience nightmares?', 'single_choice', 14, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_emotional, 'P016', 'Do you wake feeling anxious?', 'single_choice', 15, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_emotional, 'P017', 'Do you wake with rapid breathing or a racing heart?', 'single_choice', 16, true);

  -- --- Physiological Activity Prompts ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_physiological, 'P018', 'Do you move around a lot during the night?', 'single_choice', 17, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_physiological, 'P019', 'Do your legs move during sleep?', 'single_choice', 18, true);

  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_physiological, 'P020', 'Are your bed sheets usually messy when you wake?', 'single_choice', 19, true);

  -- --- Sleep Position Prompt ---
  INSERT INTO prompts (knowledge_model_id, evidence_dimension_id, prompt_key, prompt_text, response_type, display_order, is_active)
  VALUES (v_km_id, v_dim_position, 'P021', 'Which position do you usually fall asleep in?', 'single_choice', 20, true);

  -- ============================================================================
  -- 4. Prompt Response Options
  -- ============================================================================

  -- P002: Do you have difficulty falling asleep?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P002' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P002' AND knowledge_model_id = v_km_id;

  -- P003: How long to fall asleep?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Less than 15 minutes', 'under_15_min', 1 FROM prompts WHERE prompt_key = 'P003' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '15 to 30 minutes', '15_to_30_min', 2 FROM prompts WHERE prompt_key = 'P003' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '30 to 60 minutes', '30_to_60_min', 3 FROM prompts WHERE prompt_key = 'P003' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'More than 60 minutes', 'over_60_min', 4 FROM prompts WHERE prompt_key = 'P003' AND knowledge_model_id = v_km_id;

  -- P004: How often does this happen?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Rarely (1-2 times per month)', 'rarely', 1 FROM prompts WHERE prompt_key = 'P004' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Occasionally (1-2 times per week)', 'occasionally', 2 FROM prompts WHERE prompt_key = 'P004' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Frequently (3-5 times per week)', 'frequently', 3 FROM prompts WHERE prompt_key = 'P004' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Almost every night', 'almost_nightly', 4 FROM prompts WHERE prompt_key = 'P004' AND knowledge_model_id = v_km_id;

  -- P005: Do you wake during the night?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P005' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P005' AND knowledge_model_id = v_km_id;

  -- P006: Approximately how many times?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Once', 'once', 1 FROM prompts WHERE prompt_key = 'P006' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Twice', 'twice', 2 FROM prompts WHERE prompt_key = 'P006' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Three to four times', 'three_to_four', 3 FROM prompts WHERE prompt_key = 'P006' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'More than four times', 'more_than_four', 4 FROM prompts WHERE prompt_key = 'P006' AND knowledge_model_id = v_km_id;

  -- P007: Do you remember approximately what time(s)? (optional per spec)
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P007' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P007' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'I don''t know', 'unknown', 3 FROM prompts WHERE prompt_key = 'P007' AND knowledge_model_id = v_km_id;

  -- P008: Can you usually get back to sleep?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes, easily', 'easily', 1 FROM prompts WHERE prompt_key = 'P008' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Sometimes, with difficulty', 'sometimes', 2 FROM prompts WHERE prompt_key = 'P008' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No, I usually cannot', 'no', 3 FROM prompts WHERE prompt_key = 'P008' AND knowledge_model_id = v_km_id;

  -- P009: Approximately how long are you awake?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Less than 15 minutes total', 'under_15_min', 1 FROM prompts WHERE prompt_key = 'P009' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '15 to 30 minutes total', '15_to_30_min', 2 FROM prompts WHERE prompt_key = 'P009' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '30 to 60 minutes total', '30_to_60_min', 3 FROM prompts WHERE prompt_key = 'P009' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'More than 60 minutes total', 'over_60_min', 4 FROM prompts WHERE prompt_key = 'P009' AND knowledge_model_id = v_km_id;

  -- P011: Do you usually get up immediately?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P011' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P011' AND knowledge_model_id = v_km_id;

  -- P012: How long do you remain in bed?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Less than 10 minutes', 'under_10_min', 1 FROM prompts WHERE prompt_key = 'P012' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '10 to 30 minutes', '10_to_30_min', 2 FROM prompts WHERE prompt_key = 'P012' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, '30 to 60 minutes', '30_to_60_min', 3 FROM prompts WHERE prompt_key = 'P012' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'More than 60 minutes', 'over_60_min', 4 FROM prompts WHERE prompt_key = 'P012' AND knowledge_model_id = v_km_id;

  -- P013: How would you describe your sleep overall?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Very good', 'very_good', 1 FROM prompts WHERE prompt_key = 'P013' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Good', 'good', 2 FROM prompts WHERE prompt_key = 'P013' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Fair', 'fair', 3 FROM prompts WHERE prompt_key = 'P013' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Poor', 'poor', 4 FROM prompts WHERE prompt_key = 'P013' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Very poor', 'very_poor', 5 FROM prompts WHERE prompt_key = 'P013' AND knowledge_model_id = v_km_id;

  -- P014: Do you usually wake feeling refreshed?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P014' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Sometimes', 'sometimes', 2 FROM prompts WHERE prompt_key = 'P014' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 3 FROM prompts WHERE prompt_key = 'P014' AND knowledge_model_id = v_km_id;

  -- P015: Do you experience nightmares?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P015' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P015' AND knowledge_model_id = v_km_id;

  -- P016: Do you wake feeling anxious?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P016' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P016' AND knowledge_model_id = v_km_id;

  -- P017: Do you wake with rapid breathing or a racing heart?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P017' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P017' AND knowledge_model_id = v_km_id;

  -- P018: Do you move around a lot during the night?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P018' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P018' AND knowledge_model_id = v_km_id;

  -- P019: Do your legs move during sleep?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P019' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P019' AND knowledge_model_id = v_km_id;

  -- P020: Are your bed sheets usually messy when you wake?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'Yes', 'yes', 1 FROM prompts WHERE prompt_key = 'P020' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'No', 'no', 2 FROM prompts WHERE prompt_key = 'P020' AND knowledge_model_id = v_km_id;

  -- P021: Which position do you usually fall asleep in?
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'On my back', 'back', 1 FROM prompts WHERE prompt_key = 'P021' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'On my stomach', 'stomach', 2 FROM prompts WHERE prompt_key = 'P021' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'On my side', 'side', 3 FROM prompts WHERE prompt_key = 'P021' AND knowledge_model_id = v_km_id;
  INSERT INTO prompt_response_options (prompt_id, option_label, option_value, display_order)
  SELECT id, 'It varies', 'varies', 4 FROM prompts WHERE prompt_key = 'P021' AND knowledge_model_id = v_km_id;

  -- ============================================================================
  -- 5. Branch Rules
  -- ============================================================================

  -- P002: If "no" difficulty → skip to next dimension (P005)
  INSERT INTO branch_rules (prompt_id, condition_expression, target_prompt_id, priority, is_active)
  SELECT p.id, '{"response_value": "no", "operator": "equals"}'::jsonb, t.id, 0, true
  FROM prompts p
  JOIN prompts t ON t.prompt_key = 'P005' AND t.knowledge_model_id = v_km_id
  WHERE p.prompt_key = 'P002' AND p.knowledge_model_id = v_km_id;

  -- P005: If "no" night waking → skip to next dimension (P010)
  INSERT INTO branch_rules (prompt_id, condition_expression, target_prompt_id, priority, is_active)
  SELECT p.id, '{"response_value": "no", "operator": "equals"}'::jsonb, t.id, 0, true
  FROM prompts p
  JOIN prompts t ON t.prompt_key = 'P010' AND t.knowledge_model_id = v_km_id
  WHERE p.prompt_key = 'P005' AND p.knowledge_model_id = v_km_id;

  -- P011: If "yes" get up immediately → skip P012, go to next dimension (P013)
  INSERT INTO branch_rules (prompt_id, condition_expression, target_prompt_id, priority, is_active)
  SELECT p.id, '{"response_value": "yes", "operator": "equals"}'::jsonb, t.id, 0, true
  FROM prompts p
  JOIN prompts t ON t.prompt_key = 'P013' AND t.knowledge_model_id = v_km_id
  WHERE p.prompt_key = 'P011' AND p.knowledge_model_id = v_km_id;

  -- ============================================================================
  -- 6. Completion Rules
  -- ============================================================================

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P002", "P003", "P004"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Sleep Initiation';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P005", "P006", "P008", "P009"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Sleep Maintenance';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P010", "P011", "P012"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Sleep Termination';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P013", "P014"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Sleep Quality';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P015", "P016", "P017"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Emotional State';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P018", "P019", "P020"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Physiological Activity';

  INSERT INTO completion_rules (evidence_dimension_id, rule_expression, is_active)
  SELECT id, '{"required_prompt_keys": ["P021"]}'::jsonb, true
  FROM evidence_dimensions WHERE knowledge_model_id = v_km_id AND name = 'Sleep Position';

  -- ============================================================================
  -- 7. Evidence Field Mappings
  -- ============================================================================

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, NULL, 'sleep_narrative', 'text'
  FROM prompts p WHERE p.prompt_key = 'P001' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'sleep_initiation_difficulty', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Initiation'
  WHERE p.prompt_key = 'P002' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'sleep_latency', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Initiation'
  WHERE p.prompt_key = 'P003' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'sleep_initiation_frequency', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Initiation'
  WHERE p.prompt_key = 'P004' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'night_waking', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Maintenance'
  WHERE p.prompt_key = 'P005' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'night_waking_count', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Maintenance'
  WHERE p.prompt_key = 'P006' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'wake_time_awareness', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Maintenance'
  WHERE p.prompt_key = 'P007' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'return_to_sleep_ability', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Maintenance'
  WHERE p.prompt_key = 'P008' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'awake_duration', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Maintenance'
  WHERE p.prompt_key = 'P009' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'morning_wake_time', 'text'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Termination'
  WHERE p.prompt_key = 'P010' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'morning_behavior', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Termination'
  WHERE p.prompt_key = 'P011' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'bed_dwell_time', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Termination'
  WHERE p.prompt_key = 'P012' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'overall_sleep_quality', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Quality'
  WHERE p.prompt_key = 'P013' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'morning_refreshment', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Quality'
  WHERE p.prompt_key = 'P014' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'nightmares', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Emotional State'
  WHERE p.prompt_key = 'P015' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'waking_anxiety', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Emotional State'
  WHERE p.prompt_key = 'P016' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'waking_physiological_arousal', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Emotional State'
  WHERE p.prompt_key = 'P017' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'night_movement', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Physiological Activity'
  WHERE p.prompt_key = 'P018' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'leg_movement_during_sleep', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Physiological Activity'
  WHERE p.prompt_key = 'P019' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'bed_sheet_disorder', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Physiological Activity'
  WHERE p.prompt_key = 'P020' AND p.knowledge_model_id = v_km_id;

  INSERT INTO evidence_fields (prompt_id, evidence_dimension_id, field_name, field_type)
  SELECT p.id, d.id, 'sleep_position', 'categorical'
  FROM prompts p JOIN evidence_dimensions d ON d.knowledge_model_id = v_km_id AND d.name = 'Sleep Position'
  WHERE p.prompt_key = 'P021' AND p.knowledge_model_id = v_km_id;

END $$;
