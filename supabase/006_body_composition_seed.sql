-- ============================================================================
-- QHRT Therapeutic Engine — Body Composition Proof-of-Concept Seed Data
-- Run after 005_therapeutic_engine_schema.sql in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Phase Templates (the 8 universal phases)
-- ============================================================================

INSERT INTO phase_templates (phase_order, phase_key, name, description, client_script, practitioner_protocol, transition_rule_description)
VALUES
  (1, 'conscious_regulatory_activation',
   'Conscious Regulatory Activation',
   'Initial regulatory activation to prepare the conscious mind for therapeutic engagement.',
   'Take a moment to settle into this space. We will begin by activating your conscious awareness and preparing you for the work ahead.',
   'Phase 1: Conscious Regulatory Activation — Activate the client''s conscious regulatory system. Guide them through initial awareness establishment. Ensure the nervous system is prepared for therapeutic engagement before proceeding to AEE resolution.',
   'No prerequisites. This is the entry phase.'),

  (2, 'aee_resolution',
   'Archetypal Emotional Energetic Resolution',
   'Resolution of the assigned Archetypal Emotional Energetic pattern.',
   'We will now work with an emotional energetic pattern that may be influencing your experience. Follow the guidance provided and allow yourself to engage fully with this process.',
   'Phase 2: AEE Resolution — Process the assigned Archetypal Emotional Energetic. Use resolution prompts from the selected AEE entry. Confirm completion before allowing transition to reversal phases.',
   'Requires Phase 1 (Conscious Regulatory Activation) to be completed.'),

  (3, 'universal_reverse_sequential',
   'Universal Reverse Sequential Organizational Implementation',
   'Universal-level reversal of organizational patterns (3A).',
   'We will now begin a universal reorganization process. This works at the foundational level to address broad organizational patterns.',
   'Phase 3A: Universal Reverse Sequential Organizational Implementation — Execute universal-level reversal protocols. Address broad organizational patterns before moving to domain-specific work.',
   'Requires AEE completion to be confirmed.'),

  (4, 'fd_reverse_sequential',
   'Functional Domain Reverse Sequential Organizational Implementation',
   'Domain-specific reversal of organizational patterns (3B).',
   'We will now focus on reorganization specific to your area of focus. This builds on the universal work and applies it to your specific needs.',
   'Phase 3B: Functional Domain Reverse Sequential Organizational Implementation — Execute domain-specific reversal protocols using content from the loaded Functional Domain Protocol.',
   'Requires Phase 3A (Universal Reverse Sequential) to be completed.'),

  (5, 'current_conscious_program',
   'Current Conscious Organizational Program',
   'Addressing current conscious organizational programming.',
   'We will now work with your current organizational patterns. This phase helps establish new conscious frameworks for how you relate to your focus area.',
   'Phase 5: Current Conscious Organizational Program — Establish new conscious organizational frameworks. Build on completed reversal work from phases 3A and 3B.',
   'Requires both Phase 3A and Phase 3B (reversal phases) to be completed.'),

  (6, 'universal_activation',
   'Universal Organizational Implementation Activation',
   'Universal-level activation of new organizational patterns.',
   'We will now activate the universal organizational changes we have established. This ensures the foundational shifts are integrated.',
   'Phase 6: Universal Organizational Implementation Activation — Activate universal-level organizational implementation. Ensure foundational integration before domain-specific activation.',
   'Requires Phase 5 (Current Conscious Organizational Program) to be completed.'),

  (7, 'fd_activation',
   'Functional Domain Implementation Activation',
   'Domain-specific activation of new patterns.',
   'We will now activate the specific changes related to your focus area. This completes the implementation work for your session.',
   'Phase 7: Functional Domain Implementation Activation — Activate domain-specific implementation using content from the loaded Functional Domain Protocol and Personal Implementation Program.',
   'Requires Functional Domain and Personal Program activation to be complete.'),

  (8, 'conscious_release',
   'Conscious Release',
   'Final conscious release and integration.',
   'We will now bring this session to a close with a conscious release. Take a moment to integrate the work we have done together.',
   'Phase 8: Conscious Release — Guide client through final release and integration. Prepare for observation capture. Do not transition to observation until this phase is complete.',
   'Requires Phase 7 (Functional Domain Implementation Activation) to be completed.');

-- ============================================================================
-- 2. Functional Domain Protocol — Body Composition
-- ============================================================================

INSERT INTO functional_domain_protocols (id, name, description, delivery_content, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Body Composition',
  'Functional Domain Protocol for body composition-related therapeutic work. Addresses organizational patterns related to body image, weight management, metabolic health, and physical well-being.',
  '{
    "universal_reverse_sequential": {
      "client_script": "We will now address universal organizational patterns related to your body composition experience. Allow yourself to release any foundational beliefs that no longer serve you.",
      "prompts": [
        {"key": "bc_universal_release", "text": "Notice any deep-seated beliefs about your body that feel ready to be released.", "response_type": "free_text"}
      ]
    },
    "fd_reverse_sequential": {
      "client_script": "We will now focus specifically on body composition patterns. This work addresses the organizational structures that influence how you relate to your physical well-being.",
      "prompts": [
        {"key": "bc_domain_focus", "text": "What specific aspect of your body composition experience would you like to address most deeply?", "response_type": "free_text"}
      ]
    },
    "current_conscious_program": {
      "client_script": "We will now establish new conscious frameworks for how you relate to your body and physical well-being.",
      "prompts": [
        {"key": "bc_new_framework", "text": "Describe how you would like to experience your relationship with your body moving forward.", "response_type": "free_text"}
      ]
    },
    "fd_activation": {
      "client_script": "We will now activate the specific changes for your body composition work. Feel these new patterns integrating into your experience.",
      "prompts": [
        {"key": "bc_activation_confirm", "text": "Notice any shifts in how you feel about your body and physical well-being.", "response_type": "free_text"}
      ]
    }
  }',
  true
);

-- ============================================================================
-- 3. Archetypal Emotional Energetics — Sample Entries
-- ============================================================================

INSERT INTO archetypal_emotional_energetics (id, name, description, resolution_prompts, is_active)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010',
    'Grief / Loss',
    'Addresses emotional energetic patterns related to grief, loss, and the processing of significant life transitions.',
    '{
      "resolution_intro": "We will now work with the emotional energy of grief and loss. This is a natural part of the human experience, and we will honor it fully.",
      "resolution_prompts": [
        {"key": "aee_grief_acknowledge", "text": "Acknowledge any loss or grief that may be present in your experience right now.", "response_type": "free_text"},
        {"key": "aee_grief_release", "text": "Allow yourself to release the weight of this grief, knowing it has been honored and processed.", "response_type": "free_text"}
      ],
      "resolution_close": "The emotional energy of grief has been acknowledged and resolved. You may now move forward with clarity."
    }',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    'Fear / Uncertainty',
    'Addresses emotional energetic patterns related to fear, anxiety, and uncertainty about the future.',
    '{
      "resolution_intro": "We will now work with the emotional energy of fear and uncertainty. These feelings are valid, and we will address them with care.",
      "resolution_prompts": [
        {"key": "aee_fear_identify", "text": "Identify any fear or uncertainty that is present in your experience.", "response_type": "free_text"},
        {"key": "aee_fear_transform", "text": "Transform this fear into a sense of grounded certainty and inner strength.", "response_type": "free_text"}
      ],
      "resolution_close": "The emotional energy of fear has been transformed. You may now move forward with confidence."
    }',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    'Anger / Frustration',
    'Addresses emotional energetic patterns related to anger, frustration, and unexpressed tension.',
    '{
      "resolution_intro": "We will now work with the emotional energy of anger and frustration. This energy holds important information that we will honor.",
      "resolution_prompts": [
        {"key": "aee_anger_acknowledge", "text": "Acknowledge any anger or frustration that has been present in your experience.", "response_type": "free_text"},
        {"key": "aee_anger_release", "text": "Release this tension and allow it to transform into constructive energy.", "response_type": "free_text"}
      ],
      "resolution_close": "The emotional energy of anger has been acknowledged and released. You may now move forward with peace."
    }',
    true
  );

-- ============================================================================
-- 4. Personal Implementation Programs — Body Composition
-- ============================================================================

INSERT INTO personal_implementation_programs (id, functional_domain_id, name, description, delivery_content, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440001',
  'Personal Body Composition Implementation Program',
  'A personalized implementation program for body composition therapeutic work. Guides the client through specific activation steps tailored to their individual needs.',
  '{
    "current_conscious_program": {
      "client_script": "We will now personalize the organizational framework for your specific body composition goals.",
      "prompts": [
        {"key": "pip_bc_goal", "text": "What is your primary goal for this body composition work?", "response_type": "free_text"}
      ]
    },
    "fd_activation": {
      "client_script": "We will now activate your personalized implementation plan. Feel these changes integrating into your daily experience.",
      "prompts": [
        {"key": "pip_bc_integration", "text": "Describe how you envision these changes supporting you in your daily life.", "response_type": "free_text"}
      ]
    }
  }',
  true
);

-- ============================================================================
-- Notes:
-- - Body Composition Functional Domain ID: 550e8400-e29b-41d4-a716-446655440001
-- - Grief/Loss AEE ID: 550e8400-e29b-41d4-a716-446655440010
-- - Personal BC Program ID: 550e8400-e29b-41d4-a716-446655440020
-- - All 8 phase templates are seeded with client scripts and practitioner protocols
-- - Delivery content is structured as JSONB keyed by phase_key for easy composition
-- ============================================================================
