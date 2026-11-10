/**
 * Sleep module 2: Observe, Choose, and Experiment.
 * Source: Sleep, Daily Functioning & Quality of Life (30 pages).
 * The Guided QHRT Reflection stays the next module. The last slide opens theme selection.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_ID = 'b0000000-0000-4000-8000-000000000002';
const DECK_ID = 'b0000000-0000-4000-8000-000000000025';
const REFLECTION_ID = 'b0000000-0000-4000-8000-000000000024';

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

function slide(key, section, title, paragraphs, points = []) {
  return { key, section, title, paragraphs, points, voiceover: '' };
}

const slides = [
  slide('cover', 'Sleep, Daily Functioning & Quality of Life', 'A QHRT Self-Directed Learning Experience', [
    'Learn about your sleep patterns, explore personal choices and build a nighttime routine that supports the quality of life you want to create.',
  ]),
  slide('daily-picture', 'Daily life', 'Sleep Is Part of the Daily Quality-of-Life Picture', [
    'Sleep is one part of the rhythm of daily life. People often notice relationships between their nighttime experience and how they experience the following day.',
    'Learning about your sleep experience can help you understand your own patterns and make more informed choices about your daily routine.',
  ], [
    'Energy & Attention: energy, attention, concentration',
    'Mind & Memory: memory and learning, decision-making, motivation',
    'Patience & Participation: patience, participation in everyday activities',
    'Enjoyment & Well-Being: enjoyment, overall sense of well-being',
  ]),
  slide('whole-experience', 'The whole night', 'Look at the Whole Sleep Experience', [
    'Rather than judging a night as "good" or "bad," observe the different parts of the experience and notice patterns over time.',
  ], [
    'Sleep Opportunity: How much time did I allow for sleep?',
    'Sleep Continuity: How settled or interrupted did the night feel?',
    'Sleep Timing: When did I go to sleep and wake?',
    'Next-Day Experience: How did I experience my energy, attention and everyday functioning afterward?',
  ]),
  slide('everyday-habits', 'Starting point', 'Start With Everyday Habits', [
    'Everyday routines and environmental choices can be explored as part of learning about the nighttime experience.',
    'Explore through learning, self-observation and personal experimentation.',
    'You do not need to change everything. Begin by noticing what your current routine looks like.',
  ]),
  slide('timing', 'Timing', 'Explore Your Timing', [
    'What do I notice about the timing of my current sleep routine?',
  ], [
    'Usual Bedtime: What time do I typically go to bed?',
    'Usual Waking Time: What time do I typically wake?',
    'Weekday vs. Weekend: Do my sleep times differ across the week?',
    'Predictability: How predictable does the schedule feel?',
    'Evening Transition: Is there a recognizable transition from day to night?',
  ]),
  slide('transition', 'Evening', 'Explore the Transition From Day to Night', [
    'What does the last part of your evening typically look like?',
    'The goal is not a perfect routine. The goal is to learn what kind of transition fits you best.',
  ], [
    'continuing work',
    'household tasks',
    'television',
    'phone use',
    'preparation for tomorrow',
    'socializing',
    'reading',
    'quiet personal time',
    'Optional experiments: lower stimulation, dimmer lighting, finish planning earlier, a predictable wind-down period, a clearer ending to the active part of the day',
  ]),
  slide('environment', 'Environment', 'Observe Your Environment', [
    'What do I notice about the environment in which I usually sleep?',
    'Is there anything I would like to experiment with changing?',
  ], [
    'Light & Sound: light, sound, devices',
    'Temperature & Comfort: temperature, bedding, comfort',
    'Interruptions: interruptions, pets, privacy',
  ]),
  slide('habits', 'Everyday habits', 'Observe Everyday Habits', [
    'Do I notice any relationship between parts of my day and my nighttime experience?',
  ], [
    'Caffeine timing',
    'Alcohol',
    'Meal timing',
    'Physical activity',
    'Daytime light exposure',
    'Evening screens',
    'Naps',
    'Late work',
    'Stimulating activities',
    'Schedule changes',
  ]),
  slide('choose-explore', 'Experiments', 'Choose 2–3 Things to Explore', [
    'The purpose of an experiment is to learn, not to prove that a particular change will work.',
  ], [
    'Consistent Waking Time: Wake at a steady time across the week.',
    'Earlier Evening Transition: Start winding down earlier than usual.',
    'Screen Use Before Bed: Try less screen use right before bed.',
    'Sleep Environment: Prepare the bedroom earlier in the evening.',
    'Caffeine Timing: Vary when caffeine is consumed during the day.',
    'Nighttime Routine: Create a short, repeatable bedtime routine.',
  ]),
  slide('seven-nights', 'Observation', 'Become an Observer of Your Own Experience', [
    'For seven nights, record the following in your Personal Observation journal.',
  ], [
    'Bedtime & Sleep Onset: approximate bedtime, approximate time you believe you fell asleep',
    'Awakenings: remembered awakenings, longest remembered awake period',
    'Morning: final waking time, getting-out-of-bed time, how rested you felt',
    'Day & Routine: daytime energy, evening routine used, anything unusual about the day or night',
  ]),
  slide('patterns', 'Patterns', 'What Type of Pattern Do You Notice?', [
    'Noticing a pattern helps you decide what you would like to learn more about next.',
  ], [
    'Taking longer than preferred to transition into sleep',
    'Waking several times, remaining awake after waking',
    'Waking earlier than preferred',
    'Delaying bedtime, changing sleep times considerably from day to day',
    'Sleeping but not feeling as refreshed as preferred',
    'More than one pattern',
  ]),
  slide('angles', 'Angles', 'Explore the Experience From Different Angles', [
    'These are prompts for your own exploration. You decide which, if any, to follow.',
  ], [
    'Environment: What do I notice about light, sound, temperature, interruptions and comfort?',
    'Timing & Routine: What do I notice about bedtime, waking time, transitions, consistency and evening activity?',
    'Personal Comfort: What do I notice about comfort while settling for the night?',
    'Thought Activity: What do I notice myself thinking about?',
    'Familiar Perspectives: Do I notice familiar perspectives about responsibility, productivity, stopping, personal time, alertness or rest?',
  ]),
  slide('learning-process', 'One process', 'One Consistent Learning Process', [
    'This learning process helps you understand your own sleep patterns, consider optional perspectives, make personal choices, try small real-world experiments and record what you notice. You remain the observer and decision-maker throughout.',
  ], [
    'Teach: Learn about the topic.',
    'Observe: Notice your own experience.',
    'Reflect: Consider optional questions and perspectives.',
    'Choose: Choose an alternative perspective, if you wish.',
    'Experiment: Try one small, voluntary real-world experiment.',
    'Record: Record what you notice.',
    'Learn: Decide what to keep, modify, explore or observe next.',
  ]),
  slide('learning-target', 'One target', 'Choose One Learning Target', [
    'As you begin, you might notice: thoughts, feelings, physical sensations, urges, alertness, restlessness, nothing in particular.',
    'There is no required response. The aim is simply to observe your starting experience.',
  ], [
    'I want to learn more about what I notice when I transition from my waking day toward sleep.',
    'I want to observe what I notice when I wake during the night.',
    'I want to learn more about what I notice when I stay awake later than I intended.',
  ]),
  slide('familiar-perspective', 'Perspectives', 'What Familiar Perspective Do I Notice?', [
    'Does any familiar perspective like this describe something I notice in myself?',
    'You might answer: Yes, No, Unsure, Something different.',
    'A familiar perspective is something to notice and reflect on. You decide what, if anything, you would like to explore.',
  ], [
    'I like to finish everything before I stop.',
    'I prefer to stay ahead of tomorrow.',
    'I often keep thinking about responsibilities.',
    'Late evening feels like my personal time.',
    'I tend to remain mentally engaged until very late.',
  ]),
  slide('evening-appearance', 'Observation', 'How Does That Perspective Appear in My Evening?', [
    'The purpose is simply to notice whether a perspective shows up in your evening.',
  ], [
    'Perspective: "I prefer to stay ahead of tomorrow." Observation: "When I go to bed, I often begin planning the next day."',
    'Perspective: "Late evening feels like my personal time." Observation: "I often continue activities later than I originally intended."',
  ]),
  slide('try-instead', 'A different perspective', 'What Would I Like to Try Instead?', [
    'Choose any perspective you would like to try, or write your own. It is your choice.',
  ], [
    'Instead of finishing everything first: "I can decide what is enough for today and continue tomorrow."',
    'Instead of late evening as the only personal time: "I would like to create personal time elsewhere in my day as well."',
    'Instead of keeping tomorrow in mind: "I can write down tomorrow\'s priorities and return to them tomorrow."',
  ]),
  slide('one-experiment', 'One experiment', 'Choose One Small Real-World Experiment', [
    'The experiment gives you something concrete to observe. It does not promise a particular outcome.',
  ], [
    'Chosen perspective: "I can decide what is enough for today and continue tomorrow." Finish planning at a chosen time. Write unfinished tasks down. Begin the evening transition afterward. Observe what the evening feels like.',
    'Chosen perspective: "I would like to create personal time elsewhere in my day." Schedule a short period of personal time earlier. Keep your usual bedtime. Notice whether the late-evening experience feels different or similar.',
  ]),
  slide('voluntary', 'Your choice', 'Make the Experiment Voluntary', [
    'For this experiment, I am willing to try the perspective I have chosen and notice what happens.',
  ], [
    'For tonight, I am willing to leave unfinished tasks for tomorrow.',
    'For tonight, I am willing to end the active part of my day at the time I chose.',
    'For this experiment, I am willing to see what I notice when personal time has a different place in my day.',
    'A conscious choice',
    'An experiment',
    'Temporary, if you wish',
    'Completely voluntary',
  ]),
  slide('record', 'Record', 'Record the Experience', [
    'For the next several nights, record what happened with your original learning target, what felt different, what felt similar, what was easier, what was harder, whether something new became noticeable, and what you would like to try next.',
    'There is no required outcome. Every observation can contribute to further learning.',
  ], [
    'Noticeably Different: I noticed a meaningful difference.',
    'Some Differences: Some parts felt different and others did not.',
    'Similar to Before: I did not notice much difference.',
    'Variable: My experience differed from night to night.',
    'Not Enough Information Yet: I would like more observation time.',
  ]),
  slide('similar', 'Still information', 'Similar Is Still Information', [
    'If you notice little or no difference:',
    'QHRT is a learning loop. You can keep observing, choosing and experimenting at your own pace.',
  ], [
    'Record what you explored.',
    'Record the perspective you chose.',
    'Record the experiment you tried.',
    'Note that the experience felt similar.',
    'Return to the QHRT Sleep Exploration Map.',
    'Choose another area to observe, if you wish.',
    'Design another small experiment.',
    'Observe again.',
  ]),
  slide('day-ends', 'When the day ends', 'What Do I Notice When the Waking Day Ends?', [
    'I want to understand what I notice when I transition from my waking day toward sleep.',
    'What do I notice myself doing, thinking or expecting at this point in my evening?',
    'Then follow the QHRT learning sequence: Teach, Observe, Reflect, Choose, Experiment, Record, Learn.',
  ], [
    'unfinished tasks come to mind',
    'planning tomorrow',
    'replaying conversations',
    'checking the clock',
    'wanting more personal time',
    'beginning another activity',
    'reluctance to stop',
    'increased mental activity',
  ]),
  slide('waking-sequence', 'After waking', 'Observe the Sequence', [
    'You are simply observing a sequence, step by step.',
    'Which part of this sequence, if any, would I like to experiment with changing?',
  ], [
    'What I noticed when I woke: sound, temperature, position, wanting to use the bathroom, dream, environmental interruption, nothing obvious',
    'What I noticed myself doing afterward: wake, check time, think about how much nighttime remains, think about tomorrow, notice increased mental activity',
  ]),
  slide('earlier-waking', 'Earlier waking', 'What Do I Notice Next?', [
    'When you wake earlier than you intended, you might notice thoughts about responsibilities, planning, clock checking, beginning the day mentally, expectations about getting started, and familiar waking-time habits.',
    'What do I notice myself thinking or doing when I wake earlier than I intended?',
    'Is there another response I would like to experiment with?',
  ]),
  slide('value-awake', 'Staying awake', 'What Do I Value About Staying Awake?', [
    'What do I enjoy, value or experience during the time I remain awake?',
    'Is there something I value about this time that I would like to explore further?',
  ], [
    'personal time',
    'entertainment',
    'unfinished tasks',
    'autonomy',
    'quiet',
    'reward after a demanding day',
    'continued activity',
  ]),
  slide('learning-loop', 'Your choices', 'Your Learning Loop, Your Choices', [
    'QHRT helps participants learn about their own patterns, consider optional perspectives, make personal choices, try small real-world experiments and record what they notice.',
    'You remain the observer and decision-maker throughout.',
  ], [
    'Teach: Learn about the topic.',
    'Observe: Notice your own experience.',
    'Reflect: Consider optional questions and perspectives.',
    'Choose: Choose a perspective you would like to try.',
    'Experiment: Try one small, voluntary experiment.',
    'Record: Write down what you notice.',
    'Learn: Decide what to keep, modify, explore or observe next.',
  ]),
  slide('relevant', 'Theme selection', 'What Seems Most Relevant to Your Experience?', [
    'You have now learned about different parts of the sleep experience and observed your own nighttime and next-day patterns. Consider what seems most relevant to the experience you would like to explore further.',
    'Which theme feels most relevant to something I have noticed in my own experience?',
  ], [
    'Personal Time',
    'Unfinished Tasks',
    'Tomorrow & Planning',
    'Responsibilities',
    'Being Available to Others',
    'Difficulty Stopping',
    'Productivity',
    'Control & Choice',
    'Anticipation',
    'Mental Activity',
    'Replaying the Day',
    'Clock Awareness',
    'Quiet & Solitude',
    'Reward After a Demanding Day',
    'Autonomy',
    'Transitions',
    'Comfort',
    'Waking & Becoming Mentally Engaged',
    'Returning to Sleep',
    'Rest & Permission to Pause',
    'Expectations About Sleep',
    'Something Else',
  ]),
  slide('one-theme', 'Theme selection', 'Choose One Theme to Explore', [
    'Choose one theme that best reflects something you have noticed. The purpose is not to decide that this theme is causing your sleep experience. It is simply something that feels personally relevant to explore.',
    'Which statement comes closest to what you notice in your own experience?',
  ], [
    'Example, Personal Time: Late evening feels like time that belongs to me.',
    'I enjoy having fewer demands at night.',
    'I do not want the quiet part of my day to end.',
    'I use late evening as a reward after a demanding day.',
    'I continue an enjoyable activity even when I had planned to stop.',
    'I sometimes choose additional personal time even when I know I may feel tired the next morning.',
    'Something different feels more accurate for me.',
  ]),
  slide('references', 'References', 'References', [
    'General sleep information on these slides is supported by the following public sources.',
    'Program content and reflection prompts were provided by the QHRT program. This presentation is an educational, self-paced learning experience. It is not a diagnostic, assessment or treatment tool.',
  ], [
    'Brigham and Women\'s Hospital. (2016). Sleep diary. Healthy Sleep, Brigham Sleep Health Institute. https://healthysleep.bwh.harvard.edu/wp-content/uploads/2016/12/Sleep-Diary.pdf',
    'Centers for Disease Control and Prevention. (n.d.). About sleep. https://www.cdc.gov/sleep/about/',
    'Centers for Disease Control and Prevention. (2024, July 19). About sleep and your heart health. https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html',
    'Harvard Health. (2015, August 1). Restructure your day to get a better night\'s sleep. https://www.harvardhealth.org/sleep/restructure-your-day-to-get-a-better-nights-sleep',
    'Johns Hopkins Medicine. (n.d.). Seven ways to get a healthier night\'s sleep. https://www.hopkinsmedicine.org/health/wellness-and-prevention/seven-ways-to-get-a-healthier-nights-sleep',
    'Johns Hopkins Medicine. (n.d.). Sleep answers from sleep expert Charlene Gamaldo. https://www.hopkinsmedicine.org/health/wellness-and-prevention/sleep-answers-from-sleep-expert',
    'Johns Hopkins Medicine. (n.d.). Your bedroom for better sleep. https://www.hopkinsmedicine.org/health/wellness-and-prevention/your-bedroom-for-better-sleep',
    'National Heart, Lung, and Blood Institute. (n.d.). How sleep works: Why is sleep important? https://www.nhlbi.nih.gov/health/sleep/why-sleep-important',
    'National Heart, Lung, and Blood Institute. (n.d.). Sleep deprivation and deficiency: How sleep affects your health. https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects',
  ]),
  slide('guided-reflection', 'Guided QHRT Reflection', 'Continue With Your Selected Theme', [
    'You have selected something you would like to explore further.',
    'Your chosen theme can now be used in the separate Guided QHRT Reflection.',
    'The guided experience will take you step by step through a structured QHRT reflection using your selected theme.',
    'Afterward, return to your everyday routine and notice what happens naturally.',
    'You can return to this Sleep Education & Self-Observation module later and select another theme if you would like to explore something else.',
    'Explore one theme at a time. Observe what you notice. Return whenever another aspect of your sleep experience feels worth exploring.',
  ]),
];
