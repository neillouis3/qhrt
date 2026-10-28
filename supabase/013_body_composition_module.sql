-- ============================================================================
-- Body Composition module
-- Ports Jack Ryan's Body Composition domain (006) into learning modules
-- and an assessment the current app can actually show.
-- Run after 010_learning_modules.sql (and 009). Safe to re-run.
-- ============================================================================

INSERT INTO workbooks (id, title, description, url, display_order) VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'Notice your body in the diary',
    'Write how it felt to live in your body today, without fixing it.',
    '/diary',
    30
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'A short practice',
    'Settle, breathe, or release a muscle group when the body feels loud.',
    '/practice',
    31
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'Body Composition module',
    'Return to the Body Composition lessons when you want the full path.',
    '/modules/body-composition',
    32
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessments (slug, title, description, instructions, disclaimer, scoring_method, display_order, questions, outcomes)
VALUES (
  'body-composition',
  'Body composition check-in',
  'How it feels to live in your body lately — image, energy, and the stories you carry.',
  'There are no right answers. Pause for the practices when they appear. Skip any prompt that does not fit.',
  'Educational self-check only. This is not a diet, a body-mass program, or medical advice, and it does not replace professional care.',
  'top_category',
  5,
  $json$[
    {"key": "bc_story", "text": "How has it felt to live in your body lately?", "type": "text", "required": false},
    {"key": "bc_arrive", "text": "Settle", "type": "practice", "practiceId": "settle", "required": true},
    {"key": "bc_image", "text": "How often do thoughts about how you look take over the day?", "type": "choice", "category": "image",
     "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Often", "score": 2}]},
    {"key": "bc_eating", "text": "How often does eating, movement, or control around food feel like a fight?", "type": "choice", "category": "eating",
     "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Often", "score": 2}]},
    {"key": "bc_energy", "text": "How often does your body feel unable to keep up — heavy, depleted, or at war with rest?", "type": "choice", "category": "energy",
     "options": [{"value": "0", "label": "Rarely / never", "score": 0}, {"value": "1", "label": "Sometimes", "score": 1}, {"value": "2", "label": "Often", "score": 2}]},
    {"key": "bc_universal_release", "text": "Notice any old story about your body that feels ready to loosen. What is it?", "type": "text", "required": false},
    {"key": "bc_domain_focus", "text": "What part of this would you like to sit with most today?", "type": "text", "required": false},
    {"key": "bc_feeling", "text": "If a feeling is sitting with this, which is closest?", "type": "choice", "required": false,
     "options": [
       {"value": "grief", "label": "Grief or loss", "score": null},
       {"value": "fear", "label": "Fear or uncertainty", "score": null},
       {"value": "anger", "label": "Anger or frustration", "score": null},
       {"value": "none", "label": "None of these, or not now", "score": null}
     ]},
    {"key": "bc_grief", "text": "Name any loss or grief that is here with your body. You do not have to solve it.", "type": "text", "required": false,
     "showIf": {"questionKey": "bc_feeling", "values": ["grief"]}},
    {"key": "bc_fear", "text": "Name any fear or uncertainty that is here with your body.", "type": "text", "required": false,
     "showIf": {"questionKey": "bc_feeling", "values": ["fear"]}},
    {"key": "bc_anger", "text": "Name any anger or frustration that is here with your body.", "type": "text", "required": false,
     "showIf": {"questionKey": "bc_feeling", "values": ["anger"]}},
    {"key": "bc_breathe", "text": "Breathe", "type": "practice", "practiceId": "breathe", "required": true},
    {"key": "bc_new_framework", "text": "How would you like to experience your relationship with your body, moving forward?", "type": "text", "required": false},
    {"key": "bc_goal", "text": "What is one small thing you want this work to support in daily life?", "type": "text", "required": false},
    {"key": "bc_integration", "text": "Where in a normal day could that show up — morning, meals, movement, rest?", "type": "text", "required": false},
    {"key": "bc_shift", "text": "Notice any shift, even a small one, in how you feel toward your body right now.", "type": "text", "required": false}
  ]$json$::jsonb,
  $json$[
    {"key": "image", "label": "Body image", "summary": "How you see yourself stood out most. Keep noticing, without rushing to fix.", "match": "top_category", "category": "image", "min": 2, "workbookIds": ["c0000000-0000-4000-8000-000000000001", "c0000000-0000-4000-8000-000000000002"]},
    {"key": "eating", "label": "Eating and movement", "summary": "Eating, movement, or control stood out most. Small, kind routines help more than an overhaul.", "match": "top_category", "category": "eating", "min": 2, "workbookIds": ["c0000000-0000-4000-8000-000000000001", "c0000000-0000-4000-8000-000000000003"]},
    {"key": "energy", "label": "Energy and capacity", "summary": "Energy and how the body keeps up stood out most. Rest and practice can sit beside any longer-term goal.", "match": "top_category", "category": "energy", "min": 2, "workbookIds": ["c0000000-0000-4000-8000-000000000002", "c0000000-0000-4000-8000-000000000001"]},
    {"key": "steady", "label": "Stay with the body", "summary": "No single angle stood out. Return to the module when you want, and write a line in the diary if that helps.", "match": "fallback", "workbookIds": ["c0000000-0000-4000-8000-000000000003", "c0000000-0000-4000-8000-000000000001"]}
  ]$json$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_modules (id, slug, title, description, display_order)
VALUES (
  'b0000000-0000-4000-8000-000000000003',
  'body-composition',
  'Body Composition',
  'A path for how you relate to your body — image, energy, and the stories you carry. Not a diet plan.',
  3
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_lessons (id, module_id, position, title, description, kind, steps)
VALUES (
  'b0000000-0000-4000-8000-000000000031',
  'b0000000-0000-4000-8000-000000000003',
  1,
  'Arrive',
  'What this module is, and the shape of the work.',
  'guide',
  $steps$[
    {"title":"This is not a diet","paragraphs":["Body composition here means how it feels to live in your body: image, energy, hunger, rest, and the stories you tell about all of that.","QHRT does not prescribe food or training. It helps you notice patterns in the body and give them a little room."],"points":[]},
    {"title":"Arrive first","paragraphs":["Before you think about changing anything, settle. A short practice is enough. The nervous system does better work when it does not feel hunted."],"points":["Sit or lie down.","Let the breath be ordinary.","You can stop at any time."]},
    {"title":"Name what is here","paragraphs":["Sometimes grief, fear, or anger is sitting with the body. Naming it is enough. You do not have to fix the feeling in this session."],"points":[]},
    {"title":"Old stories, then a new frame","paragraphs":["You will be asked what you would like to loosen, and how you would rather relate to your body. Write as little or as much as you want."],"points":[]},
    {"title":"Take one thing with you","paragraphs":["The last prompts ask for one small place this could show up in a normal day. That is the whole plan."],"points":[]}
  ]$steps$::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_lessons (id, module_id, position, title, description, kind, assessment_id, steps)
SELECT
  'b0000000-0000-4000-8000-000000000032',
  'b0000000-0000-4000-8000-000000000003',
  2,
  a.title,
  a.description,
  'assessment',
  a.id,
  '[]'::jsonb
FROM assessments a
WHERE a.slug = 'body-composition'
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_lessons (id, module_id, position, title, description, kind, steps)
VALUES (
  'b0000000-0000-4000-8000-000000000033',
  'b0000000-0000-4000-8000-000000000003',
  3,
  'Close',
  'Let the session end. Carry one small thing, not the whole project.',
  'guide',
  $steps$[
    {"title":"You can stop here","paragraphs":["If you did the check-in, you already did the work. Nothing else is required today."],"points":[]},
    {"title":"A line in the diary","paragraphs":["If something shifted — or if nothing did — one sentence in the diary is enough to mark it."],"points":[]},
    {"title":"If the body is still loud","paragraphs":["Use Practice. Breathe, settle, or tense and release. Come back to this module another day."],"points":[]}
  ]$steps$::jsonb
)
ON CONFLICT (id) DO NOTHING;
