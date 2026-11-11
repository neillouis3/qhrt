/**
 * Stores the Guided QHRT Reflection screens on each lesson that uses them.
 * The player keeps the sequence. Admins edit the screens on the lesson.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SLEEP_ID = 'b0000000-0000-4000-8000-000000000002';
const LIFE_ID = 'b0000000-0000-4000-8000-000000000004';
const ASSESSMENT_ID = 'b0000000-0000-4000-8000-000000000021';
const SLEEP_REFLECTION_ID = 'b0000000-0000-4000-8000-000000000024';
const LIFE_REFLECTION_ID = 'b0000000-0000-4000-8000-000000000043';

function loadEnv(file) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function fetchWithoutOpaqueBearer(apiKey) {
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (
      (apiKey.startsWith('sb_publishable_') || apiKey.startsWith('sb_secret_')) &&
      headers.get('Authorization') === `Bearer ${apiKey}`
    ) {
      headers.delete('Authorization');
    }
    return fetch(input, { ...init, headers });
  };
}

function screen(key, title, paragraphs, points = [], section = 'Continue', voiceover = '', domain = null) {
  return { key, title, paragraphs, points, section, voiceover, domain };
}

function screens(closing) {
  return [
    screen(
      'reflection-selected',
      'Guided QHRT Reflection',
      [
        'You chose this because it feels relevant to something you have noticed in your own experience.',
        'You are not trying to determine why anything is happening.',
        'You are simply exploring something you have noticed.',
      ],
      [],
      'Begin Guided Reflection',
      'You selected {theme}. You also selected: {statement}. You chose this because it feels relevant to something you have noticed in your own experience. You are not trying to determine why anything is happening. You are simply exploring something you have noticed.',
      closing.domain
    ),
    screen(
      'reflection-evening',
      'Picture One Specific Evening',
      [
        'Bring to mind one real evening that represents the theme you selected.',
        'Create a single still-frame picture of that moment.',
        'Notice where you are, what you are doing, and the choice you are making.',
        'If your theme is Personal Time, you might picture yourself watching a recorded show, enjoying an alcoholic drink, and deciding to continue watching rather than ending the evening. Your picture may be completely different. Do not analyze it. Simply see the moment clearly.',
      ],
      ['where you are', 'what you are doing', 'the choice you are making'],
      'I Have My Evening Picture',
      'Bring to mind one real evening that represents the theme you selected. Create a single still-frame picture of that moment. Notice where you are, what you are doing, and the choice you are making. Do not analyze it. Simply see the moment clearly. When you have your evening picture, continue.'
    ),
    screen(
      'reflection-morning',
      'Picture the Following Morning',
      [
        'Now create a second still-frame picture.',
        'Picture yourself the following morning.',
        'Simply create the picture.',
      ],
      [
        'waking tired',
        'wanting to remain in bed',
        'moving more slowly than you would prefer',
        'wishing you felt more refreshed',
        'noticing frustration about the choice you made the evening before',
      ],
      'I Have My Morning Picture',
      'Now create a second still-frame picture of yourself the following morning. You might notice yourself waking tired, wanting to remain in bed, moving more slowly than you would prefer, wishing you felt more refreshed, or noticing frustration about the choice you made the evening before. Simply create the picture. When you have your morning picture, continue.'
    ),
    screen(
      'reflection-frustration',
      'Hold Only the Morning Picture',
      [
        'Let the evening picture go for now.',
        'Keep only the next-morning still-frame picture in mind.',
        'Notice any frustration you feel about having made the evening choice you now associate with this next-morning experience.',
        'How strong does this frustration feel right now?',
      ],
      ['0 = No frustration', '10 = Extremely strong frustration'],
      'Continue',
      'Let the evening picture go for now. Keep only the next-morning still-frame picture in mind. Notice any frustration you feel about having made the evening choice you now associate with this next-morning experience. How strong does this frustration feel right now? Zero is no frustration. Ten is extremely strong frustration.'
    ),
    screen(
      'reflection-breathing',
      'Keep the Morning Picture in Mind',
      [
        'Continue holding only the morning still-frame picture.',
        'Inhale gently through your nose for 3.',
        'Exhale gently through your mouth for 5.',
        'As you exhale, gently engage your lower abdominal muscles. Continue comfortably.',
      ],
      [
        'the breathing rhythm',
        'the gentle abdominal engagement',
        'the morning picture',
        'the frustration you noticed',
      ],
      'Continue When Ready',
      'Continue holding only the morning still-frame picture. Inhale gently through your nose for three. Exhale gently through your mouth for five. As you exhale, gently engage your lower abdominal muscles. Keep your attention on the breathing rhythm, the gentle abdominal engagement, the morning picture, and the frustration you noticed. Continue comfortably.'
    ),
    screen(
      'reflection-rerate',
      'What Do You Notice Now?',
      [
        'Keep the same morning picture in mind.',
        'How strong does the frustration feel now?',
        'If the number is above 0, return to the QHRT breathing sequence and repeat.',
        'If the number is 0, continue to the next step.',
      ],
      [],
      'Continue',
      'Keep the same morning picture in mind. How strong does the frustration feel now? If the number is above zero, return to the QHRT breathing sequence and repeat. If the number is zero, continue to the next step.'
    ),
    screen(
      'reflection-evening-return',
      'Look at the Evening Picture Again',
      [
        'Bring the original evening still-frame picture back to mind.',
        'Notice it without trying to make anything happen.',
        'What do I notice now when I picture this evening?',
        'Do not choose a new perspective yet. Simply notice the picture.',
      ],
      [
        'your choice in the picture has shifted',
        'the timing has shifted',
        'what you are doing has shifted',
        'the amount of time you continue has shifted',
        'something else feels different',
        'the picture remains similar',
      ],
      'Continue',
      'Bring the original evening still-frame picture back to mind. Notice it without trying to make anything happen. Do not choose a new perspective yet. Simply notice the picture.'
    ),
    screen(
      'reflection-morning-return',
      'Look at the Morning Picture Again',
      [
        'Bring the original morning still-frame picture back to mind.',
        'Notice it without trying to make anything happen.',
        'What do I notice now when I picture this morning?',
        'Compare it with the original morning picture. Notice how the evening and morning pictures may have shifted.',
        'In the evening picture, you may now see yourself making a different choice. In the morning picture, you may now picture yourself waking without the tiredness that appeared in your original picture.',
        'There is no need to force either picture to change. Simply notice what is different, similar, or new.',
      ],
      ['different', 'similar', 'new'],
      'Continue',
      'Bring the original morning still-frame picture back to mind. Notice it without trying to make anything happen. There is no need to force either picture to change. Simply notice what is different, similar, or new.'
    ),
    screen(
      'reflection-perspective',
      'What Fits the Pictures Now?',
      [
        'Consider the change you noticed in the evening and morning pictures.',
        'Which statement best reflects what you noticed?',
      ],
      [],
      'Continue',
      'Consider the change you noticed in the evening and morning pictures. Which statement best reflects what you noticed? You can also enter something different.'
    ),
    screen(
      'reflection-daily-life',
      'Notice What Happens Naturally',
      [
        'You have completed this Guided QHRT Reflection.',
        'There is nothing you need to force yourself to do differently.',
        'Over the next several evenings, simply notice what happens.',
        'Let your everyday experience provide the information.',
      ],
      [
        'what choices you make',
        'when you choose to end the evening',
        'whether the activity feels different',
        'whether your chosen perspective feels relevant',
        'what you notice the following morning',
        'whether something new becomes noticeable',
      ],
      'Begin Observation',
      'You have completed this Guided QHRT Reflection. There is nothing you need to force yourself to do differently. Over the next several evenings, simply notice your choices, when you end the evening, and what you notice the following morning. Let your everyday experience provide the information.'
    ),
    screen(
      'reflection-noticed',
      'What Did You Notice?',
      [
        'When you return, choose the description that fits your experience best.',
        'What did I notice about my evening choices and my next-morning experience?',
      ],
      [],
      'Continue',
      'When you return, choose the description that fits your experience best. What did you notice about your evening choices and your next-morning experience?'
    ),
    screen(
      'reflection-next',
      'Your QHRT Reflection Is Complete',
      [
        'You can now choose what you would like to do next.',
        closing.note,
      ],
      closing.points,
      'Continue',
      closing.voiceover
    ),
  ];
}
