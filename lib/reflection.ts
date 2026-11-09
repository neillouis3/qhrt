/** Participant copy and voice scripts for Guided QHRT Reflection. */

export const REFLECTION_PATH = '/reflection';
export const SLEEP_THEME_PATH = '/modules/sleep/themes';
export const REFLECTION_CONTENT_VERSION = '1.0';
export const REFLECTION_SOURCE_DOMAIN = 'SLEEP';

export const REFLECTION_STATES = [
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
  'NEXT_STEP',
] as const;

export type ReflectionState = (typeof REFLECTION_STATES)[number];

export function isReflectionState(value: string): value is ReflectionState {
  return (REFLECTION_STATES as readonly string[]).includes(value);
}

export function screenForState(state: string): number {
  const index = REFLECTION_STATES.indexOf(state as ReflectionState);
  return index >= 0 ? index + 1 : 1;
}

export function stateForScreen(screen: number): ReflectionState {
  return REFLECTION_STATES[screen - 1] ?? 'THEME_INTRO';
}

export const PERSONAL_TIME_THEME = 'Personal Time';

export const PERSONAL_TIME_STATEMENTS = [
  'I can enjoy personal time and still choose when I want my evening to end.',
  'I can enjoy one episode and leave the next one for tomorrow.',
  'I can create personal time earlier in my day.',
  'I can decide what amount of evening time feels right for me.',
] as const;

export const REFLECTION_CUES = [
  'selected',
  'evening',
  'morning',
  'frustration',
  'after-rating',
  'breathing',
  'rerate',
  'still-above',
  'reached-zero',
  'evening-return',
  'morning-return',
  'perspective',
  'daily-life',
  'noticed',
  'next',
] as const;

export type ReflectionCue = (typeof REFLECTION_CUES)[number];

export const OBSERVATION_OUTCOMES = [
  {
    id: 'noticeably-different',
    title: 'Noticeably Different',
    body: 'I noticed a meaningful difference in my evening choices or next-morning experience.',
  },
  {
    id: 'some-differences',
    title: 'Some Differences',
    body: 'Some parts felt different and others remained similar.',
  },
  {
    id: 'similar',
    title: 'Similar to Before',
    body: 'I did not notice much difference.',
  },
  {
    id: 'variable',
    title: 'Variable',
    body: 'My experience differed from evening to evening.',
  },
  {
    id: 'something-new',
    title: 'Something New Became Noticeable',
    body: 'I noticed another theme or pattern I may want to explore.',
  },
  {
    id: 'not-enough',
    title: 'Not Enough Information Yet',
    body: 'I would like more observation time.',
  },
] as const;

export type ObservationOutcomeId = (typeof OBSERVATION_OUTCOMES)[number]['id'];

export const NEXT_STEPS = [
  {
    id: 'observe',
    title: 'Continue Observing',
    body: 'Keep noticing this experience in everyday life.',
  },
  {
    id: 'sleep',
    title: 'Return to Sleep Education & Self-Observation',
    body: 'Review what you have noticed and choose another QHRT Reflection Theme if something else feels relevant.',
  },
  {
    id: 'another',
    title: 'Explore Another Theme',
    body: 'Return to your previously identified themes and select another one.',
  },
] as const;

export type NextStepId = (typeof NEXT_STEPS)[number]['id'];

const MAX_FIELD = 240;
const MAX_NOTE = 800;

export function cleanReflectionField(value: string, max = MAX_FIELD): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function cleanReflectionNote(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE);
}

export function reflectionCue(
  screen: number,
  breathPhase: 'ask' | 'breathe' | 'zero'
): ReflectionCue | null {
  switch (screen) {
    case 1:
      return 'selected';
    case 2:
      return 'evening';
    case 3:
      return 'morning';
    case 4:
      return 'frustration';
    case 5:
      return 'breathing';
    case 6:
      return breathPhase === 'breathe' ? 'still-above' : breathPhase === 'zero' ? 'reached-zero' : 'rerate';
    case 7:
      return 'evening-return';
    case 8:
      return 'morning-return';
    case 9:
      return 'perspective';
    case 10:
      return 'daily-life';
    case 11:
      return 'noticed';
    case 12:
      return 'next';
    default:
      return null;
  }
}

export function isPersonalTimeTheme(theme: string): boolean {
  return cleanReflectionField(theme).toLowerCase() === PERSONAL_TIME_THEME.toLowerCase();
}

export function reflectionSpeech(cue: ReflectionCue, theme: string, statement: string): string {
  const selectedTheme = cleanReflectionField(theme);
  const selectedStatement = cleanReflectionField(statement);
  switch (cue) {
    case 'selected':
      return `You selected ${selectedTheme} as something that feels relevant to your own sleep experience. You also selected the statement: ${selectedStatement}. You are not trying to determine why anything is happening. You are simply exploring something you have already noticed in your own experience. When you are ready, continue.`;
    case 'evening':
      return 'Bring to mind one evening that represents the theme you selected. Find one specific moment. Now imagine that moment as a still-frame photograph. Notice where you are. Notice what you are doing. Notice the choice you are making. You do not need to analyze the picture. Simply see the moment clearly. When you have your evening picture, continue.';
    case 'morning':
      return 'Now move forward to the following morning. Create another still-frame photograph. Picture yourself waking that morning. Notice what you look like. Notice how the morning feels to you. Notice what stands out about the experience. Hold that picture clearly in your mind. When you have your morning picture, continue.';
    case 'frustration':
      return 'Keep only the picture of the following morning in your mind. Notice yourself in that picture. Now notice any frustration you feel about having made the evening choice that you associate with this morning experience. Do not analyze the frustration. Simply notice how strong it feels.';
    case 'after-rating':
      return 'Remember your number. Keep the morning picture gently in mind. We will now use the QHRT breathing sequence.';
    case 'breathing':
      return 'Keep the morning picture gently in your awareness. Notice the frustration attached to that picture. Now inhale gently through your nose. One. Two. Three. Exhale gently through your mouth. One. Two. Three. Four. Five. As you exhale, gently engage your lower abdominal muscles. Again. Inhale. One. Two. Three. Exhale. One. Two. Three. Four. Five. Continue following the breathing rhythm. Keep the morning picture in your awareness. There is nothing you need to analyze. Simply continue breathing and noticing.';
    case 'rerate':
      return 'Bring your attention again to the frustration connected with the morning picture. How strong does it feel now?';
    case 'still-above':
      return 'Notice the number without judging it. Return to the breathing sequence. Keep the same morning picture gently in mind.';
    case 'reached-zero':
      return 'Your frustration rating is now zero. Let the morning picture rest for a moment. When you are ready, we will look again at the original evening picture.';
    case 'evening-return':
      return 'Return now to the original evening picture. See the same evening scene again. Notice yourself in the picture. Notice what you are doing. Notice the choice you are making. Do not deliberately change the picture. Simply look at it again. Notice whatever is there. There is no need to decide what it means. When you are ready, continue.';
    case 'morning-return':
      return 'Now return to the original morning picture. See yourself waking the following morning. Look at the picture again. What do you notice now? Compare these pictures with the ones you began with. Notice the evening picture. Notice the morning picture. Notice what is different. Notice what is similar. Notice anything new. There is nothing you need to explain. Simply observe the pictures as they appear now.';
    case 'perspective':
      return 'Look at the change you noticed in your evening and morning pictures. Which perspective best reflects that shift? Choose the statement that feels most accurate to you. Or create your own.';
    case 'daily-life':
      return 'You have completed this QHRT Reflection. Return now to your usual daily life. There is nothing you need to force yourself to do differently. Simply notice what happens. Notice your evening choices. Notice whether the activity you explored feels the same or different. Notice when you choose to end your evening. And notice how you experience the following morning. Let your actual experience provide the information.';
    case 'noticed':
      return 'When you return, choose the description that fits best. Noticeably different. Some differences. Similar to before. Variable. Something new became noticeable. Or not enough information yet. What did you notice about your evening choices and your next-morning experience? You may write a note, or leave it blank. When you are ready, continue.';
    case 'next':
      return `You have completed this Guided QHRT Reflection for ${selectedTheme}. You may continue observing. You may return to Sleep Education and Self-Observation. Or you may explore another theme. Work with one theme at a time. Observe what you notice in real life. Return whenever another aspect of your sleep experience feels worth exploring.`;
  }
}
