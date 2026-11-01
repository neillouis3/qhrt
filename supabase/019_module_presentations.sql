-- ============================================================================
-- Presentation lessons (introductory slide decks with optional voiceover)
-- Reusable for every module. Sleep is the first intro deck.
-- Run after 010_learning_modules.sql.
-- ============================================================================

ALTER TABLE public.module_lessons DROP CONSTRAINT IF EXISTS module_lessons_kind_check;
ALTER TABLE public.module_lessons
  ADD CONSTRAINT module_lessons_kind_check
  CHECK (kind IN ('guide', 'assessment', 'presentation'));

CREATE TABLE IF NOT EXISTS public.lesson_voice_cache (
  cache_key TEXT PRIMARY KEY,
  mime TEXT NOT NULL DEFAULT 'audio/mpeg',
  audio_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_voice_cache ENABLE ROW LEVEL SECURITY;

UPDATE public.learning_modules
SET
  description = 'An opening, then why sleep matters and practical steps to restore it.',
  updated_at = now()
WHERE id = 'b0000000-0000-4000-8000-000000000002';

-- Keep the sleep assessment after the introduction.
UPDATE public.module_lessons
SET position = 90, updated_at = now()
WHERE id = 'b0000000-0000-4000-8000-000000000021'
  AND position = 1;

INSERT INTO public.module_lessons (id, module_id, position, title, description, kind, steps)
VALUES (
  'b0000000-0000-4000-8000-000000000022',
  'b0000000-0000-4000-8000-000000000002',
  1,
  'The Foundations of Sleep',
  'A short opening: what this lesson is, and how to move through it.',
  'presentation',
  $slides$[
    {
      "key": "welcome",
      "section": "Welcome",
      "title": "The Foundations of Sleep",
      "paragraphs": [
        "A short opening to the Sleep lesson.",
        "What this work is, and how to move through it at a pace that feels manageable."
      ],
      "points": [],
      "voiceover": "Welcome to the Sleep module. This introduction is the same kind of opening every QHRT module will have. For now, we start with sleep. It takes a few minutes. You can pause or leave whenever you need to."
    },
    {
      "key": "why_first",
      "section": "Welcome",
      "title": "Why this comes first",
      "paragraphs": [
        "Each module opens with a short deck like this, so you know what you are walking into."
      ],
      "points": [],
      "voiceover": "Every module in QHRT begins with a short introduction. Sleep is the first path written in this form. The aim is simple. You should know what this work is, what it is not, and how to move through it at a pace that feels manageable."
    },
    {
      "key": "what_it_is",
      "section": "What this is",
      "title": "What this module is",
      "paragraphs": [
        "A self-paced look at how falling asleep, staying asleep, and waking have been going."
      ],
      "points": [
        "Education and noticing",
        "Questions you can answer in your own time",
        "Practices you can repeat or skip"
      ],
      "voiceover": "This module is a self-paced look at how falling asleep, staying asleep, and waking have been going. It is education and noticing. You will answer a few questions, then you can use practices that fit what showed up. Nothing here has to be finished in one sitting."
    },
    {
      "key": "what_it_is_not",
      "section": "What this is",
      "title": "What this module is not",
      "paragraphs": [
        "QHRT does not diagnose or treat a sleep condition."
      ],
      "points": [
        "Not a sleep study",
        "Not a diagnosis",
        "Not a replacement for personal or professional support"
      ],
      "voiceover": "This is not a sleep study, not a diagnosis, and not a replacement for care. QHRT is educational. If nights feel unsafe, unmanageable, or beyond what you want to hold alone, additional personal support is the right next step."
    },
    {
      "key": "sleep_in_the_body",
      "section": "Sleep and QHRT",
      "title": "Sleep in the body",
      "paragraphs": [
        "Rest is not only the hours you spend in bed."
      ],
      "points": [
        "The day's residue can follow you into night",
        "A busy mind and held tension often show up together",
        "Noticing is enough to begin"
      ],
      "voiceover": "Rest is not only the hours you spend in bed. The day's residue, a busy mind, and tension held in the body can follow you into the night. QHRT looks at those pieces together. You do not have to force anything. Noticing is enough to begin."
    },
    {
      "key": "how_qhrt_looks",
      "section": "Sleep and QHRT",
      "title": "How QHRT looks at sleep",
      "paragraphs": [
        "We start with a few questions. Then you choose what to practice."
      ],
      "points": [
        "You stay in control",
        "You can pause, stop, or return",
        "Suggestions follow your answers, not a script you must finish"
      ],
      "voiceover": "We start with a short self-check. Your answers point toward matching suggestions, such as a wind-down, a breathing practice, or a line in the diary. You stay in control. Pause, stop, or return whenever you need to."
    },
    {
      "key": "path_ahead",
      "section": "The path",
      "title": "What comes after this introduction",
      "paragraphs": [
        "Sleep Better, Live Better is next. It covers why sleep matters and practical steps to restore it."
      ],
      "points": [
        "How a night of sleep is structured",
        "What short sleep costs",
        "Everyday habits you can try"
      ],
      "voiceover": "When you continue, Sleep Better, Live Better is next. It looks at why sleep matters, what short sleep costs, and simple changes you can try. You do not have to do all of it today."
    },
    {
      "key": "how_to_move",
      "section": "The path",
      "title": "How to move through it",
      "paragraphs": [
        "One piece at a time. A pace that feels manageable."
      ],
      "points": [
        "One screen at a time, like this deck",
        "Leave and come back",
        "Skip what does not fit tonight"
      ],
      "voiceover": "Move through this module one piece at a time, the same way these slides move. Leave and come back. Skip what does not fit tonight. There is no score for finishing quickly."
    },
    {
      "key": "pause_reset",
      "section": "Using the work",
      "title": "Pause, reset, return",
      "paragraphs": [
        "If a question or a practice feels like too much, stop."
      ],
      "points": [
        "Use pause",
        "Write a line in the diary if you want a record",
        "Return when you have more room"
      ],
      "voiceover": "If a question or a practice feels like too much, stop. Use pause. You can write a line in the diary if you want a record of what you noticed. Return when you have more room. That is part of the work, not a failure of it."
    },
    {
      "key": "support",
      "section": "Using the work",
      "title": "Support around the work",
      "paragraphs": [
        "This program is not monitored in real time."
      ],
      "points": [
        "People you trust",
        "Additional support if nights feel beyond what you want to hold",
        "In the United States: 988 for crisis support, 911 if you or someone else is in immediate danger"
      ],
      "voiceover": "Responses through this website are not monitored in real time. Keep people you trust close at hand. If nights, mood, or safety feel beyond what you want to hold alone, seek additional outside support. In the United States, call or text 988 for crisis support. Call 911 if you or someone else is in immediate danger."
    },
    {
      "key": "ready",
      "section": "Ready",
      "title": "Ready to begin",
      "paragraphs": [
        "When you continue, Sleep Better, Live Better is next. You can return to this introduction any time."
      ],
      "points": [],
      "voiceover": "When you continue, Sleep Better, Live Better is next. You can leave this introduction and return any time. Take a breath, and begin when you are ready."
    }
  ]$slides$::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  kind = EXCLUDED.kind,
  steps = EXCLUDED.steps,
  is_active = true,
  updated_at = now();

UPDATE public.module_lessons
SET
  title = 'Observe, Choose, and Experiment',
  description = 'Sleep, Daily Functioning & Quality of Life',
  updated_at = now()
WHERE id = 'b0000000-0000-4000-8000-000000000021';
