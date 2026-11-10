/**
 * Sleep module 1: Sleep Education & Self-Observation.
 * The deck teaches sleep, then hands off to the Guided QHRT Reflection.
 * The older Daily Functioning self-check stays stored and is not shown.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_ID = 'b0000000-0000-4000-8000-000000000002';
const INTRO_ID = 'b0000000-0000-4000-8000-000000000022';
const ASSESSMENT_ID = 'b0000000-0000-4000-8000-000000000021';
const DECK_ID = 'b0000000-0000-4000-8000-000000000023';

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

const PAGE = '#f6f1e4';
const INK = '#292524';
const MUTED = '#44403c';
const GOLD = '#c4a574';
const PAPER = '#fffdf8';
const GOLD_CARD = '#e6d5a3';

let blockCount = 0;
function blockId() {
  blockCount += 1;
  return `sl${blockCount}`;
}

function text(x, y, w, h, value, extra = {}) {
  return {
    id: blockId(),
    type: 'text',
    x, y, w, h,
    text: value,
    fontFamily: 'georgia',
    fontSize: extra.size ?? 18,
    fontWeight: extra.weight ?? 400,
    color: extra.color ?? INK,
    align: extra.align ?? 'left',
    src: '',
    shape: 'rect',
    fill: 'transparent',
    stroke: 'transparent',
    radius: 0,
    arrow: false,
  };
}

function card(x, y, w, h, fill) {
  return {
    id: blockId(),
    type: 'shape',
    x, y, w, h,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: INK,
    align: 'left',
    src: '',
    shape: 'round',
    fill,
    stroke: 'transparent',
    radius: 6,
    arrow: false,
  };
}

function rule(x, y, w) {
  return {
    id: blockId(),
    type: 'shape',
    x, y, w, h: 8,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: INK,
    align: 'left',
    src: '',
    shape: 'line',
    fill: 'transparent',
    stroke: GOLD,
    radius: 0,
    arrow: false,
  };
}

function photo(src, x, y, w, h) {
  return {
    id: blockId(),
    type: 'image',
    x, y, w, h,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: INK,
    align: 'left',
    src,
    shape: 'rect',
    fill: 'transparent',
    stroke: 'transparent',
    radius: 0,
    arrow: false,
  };
}

function laidOut(key, title, voiceover, blocks) {
  return {
    key,
    section: 'Sleep Better, Live Better',
    title,
    paragraphs: [],
    points: [],
    voiceover,
    background: PAGE,
    blocks,
  };
}

function numbered(items, y = 230) {
  return items.flatMap((item, index) => {
    const x = 36 + index * (item.w ?? 296);
    const width = (item.w ?? 296) - 16;
    return [
      text(x, y, 80, 28, String(index + 1).padStart(2, '0'), { size: 14, weight: 600, color: MUTED }),
      text(x, y + 32, width, 36, item.title, { size: 18, weight: 600 }),
      text(x, y + 76, width, item.bodyH ?? 120, item.body, { size: 15 }),
    ];
  });
}

const slides = [
  laidOut(
    'welcome',
    'Sleep Better, Live Better',
    'Sleep Better, Live Better. Why sleep matters and practical steps to restore it. A friendly guide to better everyday rest.',
    [
      photo('/sleep/cover.jpg', 420, 0, 540, 540),
      text(48, 56, 340, 24, 'EVIDENCE-BASED WELLBEING', { size: 12, weight: 600, color: MUTED }),
      text(48, 220, 350, 140, 'Sleep Better,\nLive Better', { size: 40, weight: 600 }),
      rule(48, 380, 180),
      text(48, 404, 340, 64, 'Why sleep matters and practical steps to restore it', { size: 18 }),
      text(48, 478, 340, 32, 'A friendly guide to better everyday rest', { size: 15, color: MUTED }),
    ]
  ),
  laidOut(
    'active-repair',
    'Sleep Is Active Repair',
    'Sleep is not downtime. It is active repair. While you rest, your brain clears out waste, your body repairs itself, and your memories get sorted and stored.',
    [
      text(48, 36, 860, 24, 'BODY MAINTENANCE', { size: 12, weight: 600, color: MUTED }),
      text(48, 72, 820, 90, 'Sleep is not downtime,\nit is active repair', { size: 34, weight: 600 }),
      text(48, 180, 820, 80, 'While you rest, your brain clears out waste, your body repairs itself, and your memories get sorted and stored.', { size: 18 }),
      card(48, 290, 420, 170, PAPER),
      card(492, 290, 420, 170, GOLD_CARD),
      text(72, 310, 372, 28, '7+ hours nightly', { size: 18, weight: 600 }),
      text(72, 348, 372, 90, 'Most healthy adults need seven or more hours of uninterrupted sleep to fully recharge.', { size: 16 }),
      text(516, 310, 372, 28, 'Two-part approach', { size: 18, weight: 600 }),
      text(516, 348, 372, 90, 'We look at the research first, then simple changes you can make in everyday life.', { size: 16 }),
    ]
  ),
  laidOut(
    'ninety-minutes',
    'The 90-Minute Pattern',
    'A good night of sleep repeats in 90-minute rounds, mixing body repair with mind recharging. Light sleep, deep sleep, and dream sleep.',
    [
      text(48, 28, 860, 24, 'HOW SLEEP IS STRUCTURED', { size: 12, weight: 600, color: MUTED }),
      text(48, 56, 860, 40, 'Inside a night of sleep: the 90-minute pattern', { size: 26, weight: 600 }),
      text(48, 108, 820, 56, 'A good night’s sleep repeats in 90-minute rounds, mixing body repair with mind recharging.', { size: 16 }),
      card(36, 190, 420, 280, PAPER),
      card(476, 190, 448, 128, GOLD_CARD),
      card(476, 334, 448, 136, PAPER),
      text(56, 214, 380, 36, 'Light sleep', { size: 20, weight: 600 }),
      text(56, 260, 380, 160, 'Early stages. Your heart rate and body temperature slow down as you drift into deeper rest.', { size: 16 }),
      text(496, 206, 408, 28, 'Deep sleep', { size: 18, weight: 600 }),
      text(496, 240, 408, 64, 'Your body releases growth hormone to repair muscles, rebuild cells, and strengthen immunity.', { size: 15 }),
      text(496, 350, 408, 28, 'Dream sleep', { size: 18, weight: 600 }),
      text(496, 384, 408, 70, 'Brain activity picks up, helping you store what you learned and work through emotions.', { size: 15 }),
    ]
  ),
  laidOut(
    'body-clock',
    'Your Body Clock',
    'Two built-in systems control when you feel alert and when you feel ready for sleep: the 24-hour cycle, and sleep pressure.',
    [
      text(48, 28, 860, 24, 'YOUR BODY CLOCK', { size: 12, weight: 600, color: MUTED }),
      text(48, 56, 860, 40, 'Your body clock sets the internal schedule', { size: 26, weight: 600 }),
      text(48, 108, 820, 52, 'Two built-in systems control when you feel alert and when you feel ready for sleep.', { size: 16 }),
      card(36, 180, 440, 300, PAPER),
      card(492, 180, 432, 300, GOLD_CARD),
      text(56, 200, 400, 48, 'The 24-hour cycle', { size: 18, weight: 600 }),
      text(56, 252, 400, 200, 'A master clock in the brain follows light, controlling hormone release and body temperature.\n\nMorning sunshine tells your body it is time to be awake. Darkness triggers the evening sleepy-hormone rise that signals bedtime.', { size: 15 }),
      text(512, 200, 392, 48, 'Sleep pressure', { size: 18, weight: 600 }),
      text(512, 252, 392, 200, 'A sleepiness signal builds up the longer you are awake, creating a steady pull toward rest.\n\nSleep clears that signal away. Caffeine only masks it for a while, without reducing the sleep you still owe.', { size: 15 }),
    ]
  ),
  laidOut(
    'brain',
    'Sleep Protects the Brain',
    'While you sleep, your brain runs its own clean-up and sorting system. It stores memories, supports focus, and steadies emotional balance.',
    [
      text(48, 28, 860, 24, 'BRAIN HEALTH', { size: 12, weight: 600, color: MUTED }),
      text(48, 56, 700, 80, 'Sleep protects and\nsharpens the brain', { size: 32, weight: 600 }),
      text(48, 150, 820, 48, 'While you sleep, your brain runs its own clean-up and sorting system.', { size: 16 }),
      text(48, 220, 80, 28, '01', { size: 14, weight: 600, color: MUTED }),
      text(48, 248, 800, 28, 'Storing memories', { size: 18, weight: 600 }),
      text(48, 280, 820, 36, 'Things you learned during the day move into long-term memory, locking them in.', { size: 16 }),
      text(48, 330, 80, 28, '02', { size: 14, weight: 600, color: MUTED }),
      text(48, 358, 800, 28, 'Focus and creative thinking', { size: 18, weight: 600 }),
      text(48, 390, 820, 36, 'A rested brain solves problems and makes decisions more easily.', { size: 16 }),
      text(48, 420, 80, 28, '03', { size: 14, weight: 600, color: MUTED }),
      text(48, 448, 800, 28, 'Emotional balance', { size: 18, weight: 600 }),
      text(48, 480, 860, 40, 'Sleep calms the brain’s stress response, so small setbacks feel less overwhelming and your mood stays steadier.', { size: 16 }),
    ]
  ),
  laidOut(
    'body',
    'Sleep Protects the Body',
    'During deep sleep, blood pressure drops, fullness and hunger signals stay steadier, and the body makes infection-fighting cells.',
    [
      text(36, 36, 320, 24, 'PHYSICAL HEALTH', { size: 12, weight: 600, color: MUTED }),
      text(36, 80, 320, 160, 'Sleep\nprotects\nthe body', { size: 36, weight: 600 }),
      text(400, 48, 520, 28, 'Heart health and blood pressure', { size: 16, weight: 600 }),
      text(400, 80, 520, 56, 'During deep sleep, blood pressure naturally drops 10% to 20%, easing strain on your blood vessels and heart.', { size: 15 }),
      text(400, 140, 520, 20, 'HEART RECOVERY', { size: 12, weight: 600, color: MUTED }),
      text(400, 180, 520, 28, 'Blood sugar and appetite', { size: 16, weight: 600 }),
      text(400, 212, 520, 56, 'Good sleep keeps your fullness signal working and calms hunger, helping prevent the blood sugar problems that sleep loss can cause.', { size: 15 }),
      text(400, 276, 520, 20, 'HORMONE BALANCE', { size: 12, weight: 600, color: MUTED }),
      text(400, 316, 520, 28, 'Immune defence and cell repair', { size: 16, weight: 600 }),
      text(400, 348, 520, 56, 'During deep sleep, your body makes and spreads infection-fighting cells, strengthening your defences against germs.', { size: 15 }),
      text(400, 420, 520, 20, 'STRONGER DEFENCES', { size: 12, weight: 600, color: MUTED }),
    ]
  ),
  laidOut(
    'cost',
    'What Short Sleep Costs',
    'Getting too little sleep slowly wears down thinking speed, mood control, and long-term health. Findings are drawn from large sleep studies and performance tests.',
    [
      text(48, 28, 860, 24, 'THE HIDDEN SLEEP DEBT', { size: 12, weight: 600, color: MUTED }),
      text(48, 56, 860, 40, 'What short sleep actually costs', { size: 28, weight: 600 }),
      text(48, 108, 820, 56, 'Getting too little sleep slowly wears down your thinking speed, mood control, and long-term health, often faster than you notice.', { size: 16 }),
      card(36, 190, 288, 250, PAPER),
      card(336, 190, 288, 250, PAPER),
      card(636, 190, 288, 250, GOLD_CARD),
      text(52, 206, 256, 36, '3×', { size: 28, weight: 600 }),
      text(52, 248, 256, 44, 'Slower reactions', { size: 16, weight: 600 }),
      text(52, 300, 256, 120, 'Losing two hours of sleep can slow you down about as much as legal alcohol, raising the risk of drowsy driving.', { size: 14 }),
      text(352, 206, 256, 36, '+60%', { size: 28, weight: 600 }),
      text(352, 248, 256, 44, 'Mood swings', { size: 16, weight: 600 }),
      text(352, 300, 256, 120, 'Without enough sleep, your emotional center runs hot, leading to irritability, anxiety, and less ability to bounce back.', { size: 14 }),
      text(652, 206, 256, 36, '48%', { size: 28, weight: 600 }),
      text(652, 248, 256, 44, 'Higher health risk', { size: 16, weight: 600 }),
      text(652, 300, 256, 120, 'Studies link regularly short sleep to higher risks of high blood pressure, weight gain, and body-wide inflammation.', { size: 14 }),
      text(48, 470, 860, 32, 'Findings drawn from large sleep studies and performance tests.', { size: 14, color: MUTED }),
    ]
  ),
  laidOut(
    'signs',
    'Is Your Sleep Falling Short?',
    'Check waking difficulty, energy crashes, and broken sleep to see whether your sleep is meeting your body’s needs.',
    [
      text(48, 24, 860, 24, 'SELF-ASSESSMENT', { size: 12, weight: 600, color: MUTED }),
      text(48, 52, 860, 40, 'Is your sleep falling short?', { size: 30, weight: 600 }),
      text(48, 100, 820, 48, 'Check these common everyday signs to see whether your sleep is meeting your body’s needs.', { size: 16 }),
      text(48, 168, 180, 24, 'Signal', { size: 13, weight: 600, color: MUTED }),
      text(240, 168, 300, 24, 'What you notice', { size: 13, weight: 600, color: MUTED }),
      text(560, 168, 360, 24, 'What it may mean', { size: 13, weight: 600, color: MUTED }),
      rule(48, 198, 860),
      text(48, 214, 180, 70, 'Waking difficulty', { size: 15, weight: 600 }),
      text(240, 214, 300, 80, 'Needing an alarm and multiple snoozes before feeling able to stand.', { size: 14 }),
      text(560, 214, 360, 90, 'Feeling very groggy on waking, a sign you did not get enough deep sleep or are running a sleep debt.', { size: 14 }),
      text(48, 320, 180, 50, 'Energy crashes', { size: 15, weight: 600 }),
      text(240, 320, 300, 80, 'Persistent afternoon slumps and relying heavily on caffeine to stay alert.', { size: 14 }),
      text(560, 320, 360, 80, 'A build-up of sleepiness overpowering your natural wake-up rhythm.', { size: 14 }),
      text(48, 420, 180, 50, 'Broken sleep', { size: 15, weight: 600 }),
      text(240, 420, 300, 80, 'Taking over 30 minutes to drift off or waking repeatedly during the night.', { size: 14 }),
      text(560, 420, 360, 90, 'Your body is too alert at night, your schedule is irregular, or your bedtime habits need work.', { size: 14 }),
    ]
  ),
  laidOut(
    'toolkit',
    'Everyday Changes for Better Rest',
    'Sleep habits. Simple changes to your bedroom and daily routine that can make a real difference to your nights.',
    [
      text(48, 80, 500, 24, 'PRACTICAL TOOLKIT', { size: 12, weight: 600, color: MUTED }),
      text(48, 140, 700, 180, 'Sleep habits:\neveryday changes\nfor better rest', { size: 40, weight: 600 }),
      rule(48, 360, 220),
      text(48, 390, 700, 64, 'Simple changes to your bedroom and daily routine that can make a real difference to your nights.', { size: 18 }),
    ]
  ),
  laidOut(
    'schedule',
    'Keep a Consistent Schedule',
    'Waking up at the same time every day sets your body clock. Pick a realistic wake time that allows 7 to 8 hours in bed, and hold it steady for two weeks.',
    [
      text(48, 24, 860, 24, 'FOUNDATION HABIT', { size: 12, weight: 600, color: MUTED }),
      text(48, 52, 860, 40, 'Keep a consistent schedule: your daily anchor', { size: 24, weight: 600 }),
      text(48, 104, 820, 52, 'Waking up at the same time every day sets your body clock and gives you a steady daily rhythm.', { size: 16 }),
      ...numbered([
        { title: 'Fixed wake time', body: 'Anchor your wake time seven days a week. Morning daylight helps reset your body clock each day.' },
        { title: 'Limit weekend shifts', body: 'Keep weekend lie-ins within an hour of your weekday wake time to avoid social jetlag, that groggy Monday feeling.' },
        { title: 'Reinforce sleep drive', body: 'A steady wake-up time builds up your sleepiness at a predictable pace, so falling asleep at night feels easier.' },
      ], 190),
      card(48, 430, 864, 72, GOLD_CARD),
      text(68, 448, 824, 40, 'Action step: Pick a realistic wake time that allows 7 to 8 hours in bed, and hold it steady for two weeks.', { size: 16 }),
    ]
  ),
  laidOut(
    'bedroom',
    'Build a Sleep-Friendly Bedroom',
    'Your bedroom should signal one thing: it is time to rest. Keep it cool, dark, and quiet. Block light and noise. Get comfortable. Keep the bed for sleep.',
    [
      text(48, 24, 860, 24, 'YOUR BEDROOM', { size: 12, weight: 600, color: MUTED }),
      text(48, 52, 860, 40, 'Build a sleep-friendly bedroom', { size: 28, weight: 600 }),
      text(48, 104, 820, 36, 'Your bedroom should signal one thing: it’s time to rest.', { size: 16 }),
      ...numbered([
        { w: 228, title: 'Cool, dark, and quiet', body: 'A cooler room with little light and noise makes it easier to fall asleep and stay asleep.', bodyH: 140 },
        { w: 228, title: 'Block light and noise', body: 'Use blackout curtains, and an eye mask or earplugs if you need them.', bodyH: 140 },
        { w: 228, title: 'Get comfortable', body: 'A mattress and pillows that suit you make a real difference to how you rest.', bodyH: 140 },
        { w: 228, title: 'Keep the bed for sleep', body: 'Limit work and screens in bed so your brain links the bed with sleep.', bodyH: 140 },
      ], 180),
    ]
  ),
  laidOut(
    'light',
    'Use Light to Set Your Body Clock',
    'Light is the strongest signal for your body clock. Get daylight in the morning, dim the lights at night, and step outside at midday.',
    [
      text(48, 28, 860, 24, 'LIGHT AND TIMING', { size: 12, weight: 600, color: MUTED }),
      text(48, 60, 860, 40, 'Use light to set your body clock', { size: 30, weight: 600 }),
      text(48, 116, 820, 52, 'Light is the strongest signal for your body clock, so use it on purpose.', { size: 16 }),
      ...numbered([
        { title: 'Get daylight in the morning', body: 'Aim for bright daylight within an hour of waking up.' },
        { title: 'Dim the lights at night', body: 'In the last hour before bed, lower the lights in your home.' },
        { title: 'Step outside at midday', body: 'A short walk outside in the middle of the day helps keep your rhythm steady.' },
      ], 210),
    ]
  ),
  laidOut(
    'screens',
    'Wind Down from Screens',
    'Screens keep your mind busy as well as your eyes awake. Stop screens 30 to 60 minutes early, pick calmer content, and swap in a calm activity.',
    [
      text(48, 28, 860, 24, 'EVENING ROUTINE', { size: 12, weight: 600, color: MUTED }),
      text(48, 60, 860, 40, 'Wind down from screens', { size: 30, weight: 600 }),
      text(48, 116, 820, 56, 'Screens keep your mind busy as well as your eyes awake, so give yourself a break before bed.', { size: 16 }),
      ...numbered([
        { title: 'Stop screens early', body: 'Put phones, tablets, and TVs away 30 to 60 minutes before you get into bed.' },
        { title: 'Pick calmer content', body: 'Exciting shows, games, and news keep your mind alert, even with the lights dimmed.' },
        { title: 'Swap in a calm activity', body: 'Try reading, gentle stretching, or quiet music instead.' },
      ], 210),
    ]
  ),
  laidOut(
    'food',
    'Caffeine, Alcohol, and Late Meals',
    'What you eat and drink during the day affects how well you sleep at night. Set an afternoon caffeine cutoff, and keep dinner moderate.',
    [
      text(48, 36, 860, 24, 'FOOD AND DRINK', { size: 12, weight: 600, color: MUTED }),
      text(48, 72, 860, 48, 'Watch caffeine, alcohol, and late meals', { size: 28, weight: 600 }),
      text(48, 136, 820, 56, 'What you eat and drink during the day affects how well you sleep at night.', { size: 16 }),
      card(48, 220, 864, 80, PAPER),
      card(48, 316, 864, 80, PAPER),
      card(48, 412, 864, 80, GOLD_CARD),
      text(72, 240, 816, 48, 'Caffeine stays in your body for hours, so set an afternoon cutoff.', { size: 18 }),
      text(72, 336, 816, 48, 'Alcohol may help you drift off, but it breaks up your sleep later in the night.', { size: 18 }),
      text(72, 432, 816, 48, 'Big meals close to bedtime can keep you awake, so keep dinner moderate and eat a few hours before bed.', { size: 18 }),
    ]
  ),
  laidOut(
    'body-mind',
    'Move Your Body, Calm Your Mind',
    'Regular movement and a calm routine both make it easier to fall asleep. If you are still awake after about 20 minutes, get up and return when you feel sleepy.',
    [
      text(48, 28, 860, 24, 'BODY AND MIND', { size: 12, weight: 600, color: MUTED }),
      text(48, 60, 860, 40, 'Move your body, calm your mind', { size: 28, weight: 600 }),
      text(48, 116, 820, 52, 'Regular movement and a calm routine both make it easier to fall asleep.', { size: 16 }),
      ...numbered([
        { title: 'Exercise regularly', body: 'Regular activity helps you sleep more deeply. Avoid intense workouts right before bed.' },
        { title: 'Build a nightly routine', body: 'Try slow breathing, a bit of gratitude journaling, or a warm shower to signal that the day is done.' },
        { title: 'Get up if you can’t sleep', body: 'If you are still awake after about 20 minutes, get up, relax somewhere dim, and go back to bed when you feel sleepy.' },
      ], 200),
    ]
  ),
  laidOut(
    'reset',
    'Your 7-Day Sleep Reset',
    'You do not need to change everything at once. Pick two habits, track your sleep, and talk with a doctor if problems continue.',
    [
      text(48, 28, 860, 24, 'NEXT STEPS', { size: 12, weight: 600, color: MUTED }),
      text(48, 60, 860, 40, 'Your 7-day sleep reset', { size: 30, weight: 600 }),
      text(48, 116, 820, 52, 'You don’t need to change everything at once. Start small and build from there.', { size: 16 }),
      ...numbered([
        { title: 'Pick two habits', body: 'Choose two habits from this toolkit to start this week.' },
        { title: 'Track your sleep', body: 'Note your bedtime, wake time, and how you feel each morning.' },
        { title: 'Get help if needed', body: 'If problems continue, talk with a doctor about a possible sleep disorder.' },
      ], 190),
      card(48, 440, 864, 64, GOLD_CARD),
      text(68, 456, 824, 36, 'Action step: choose your two habits today and write them down.', { size: 16 }),
    ]
  ),
  laidOut(
    'sources',
    'Sources and Resources',
    'Sources and resources. Sleep Foundation. CDC Sleep. American Academy of Sleep Medicine. NIH National Heart, Lung, and Blood Institute.',
    [
      text(48, 48, 860, 48, 'Sources and Resources', { size: 32, weight: 600 }),
      text(48, 140, 800, 280, 'Sleep Foundation (sleepfoundation.org)\n\nCDC Sleep (cdc.gov/sleep)\n\nAmerican Academy of Sleep Medicine (aasm.org)\n\nNIH National Heart, Lung, and Blood Institute (nhlbi.nih.gov)', { size: 20 }),
    ]
  ),
];

loadEnv('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error('Missing Supabase URL or secret key');
  process.exit(1);
}

const supabase = createClient(url, key, {
  global: { fetch: fetchWithoutOpaqueBearer(key) },
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = new Date().toISOString();

const listed = await supabase
  .from('module_lessons')
  .select('id, position, title, kind')
  .eq('module_id', MODULE_ID)
  .order('position');
if (listed.error) {
  console.error('Could not list Sleep modules:', listed.error.message);
  process.exit(1);
}

const lessons = listed.data ?? [];
const used = new Set(lessons.map((lesson) => lesson.position));

async function moveTo(id, position, extra = {}) {
  const saved = await supabase
    .from('module_lessons')
    .update({ position, updated_at: now, ...extra })
    .eq('id', id)
    .select('id, position, title');
  if (saved.error) {
    console.error(`Could not move ${id} to position ${position}:`, saved.error.message);
    process.exit(1);
  }
  return saved.data?.[0];
}

const foundations = lessons.find((lesson) => lesson.id === INTRO_ID);
if (foundations && foundations.position === 1) {
  let parked = 90;
  while (used.has(parked)) parked += 1;
  used.delete(foundations.position);
  used.add(parked);
  const parkedRow = await moveTo(INTRO_ID, parked, { is_active: false });
  console.log(`Parked the earlier opening at position ${parkedRow?.position}.`);
}

const deckOccupant = lessons.find((lesson) => lesson.position === 1 && lesson.id !== DECK_ID && lesson.id !== INTRO_ID);
if (deckOccupant) {
  let parked = 91;
  while (used.has(parked)) parked += 1;
  used.add(parked);
  await moveTo(deckOccupant.id, parked);
}

const row = {
  id: DECK_ID,
  module_id: MODULE_ID,
  position: 1,
  title: 'Sleep Better, Live Better',
  description: 'Why sleep matters and practical steps to restore it.\nA friendly guide to better everyday rest.',
  steps: slides,
  assessment_id: null,
  is_active: true,
  updated_at: now,
};

let saved = await supabase.from('module_lessons').upsert({ ...row, kind: 'presentation' }, { onConflict: 'id' });
if (saved.error) {
  saved = await supabase.from('module_lessons').upsert({ ...row, kind: 'guide' }, { onConflict: 'id' });
}
if (saved.error) {
  console.error('Could not save Sleep Better, Live Better:', saved.error.message);
  process.exit(1);
}

const dailyFunctioning = await supabase
  .from('module_lessons')
  .update({
    title: 'Sleep, Daily Functioning & Quality of Life',
    description: 'A QHRT Self-Directed Learning Experience',
    is_active: false,
    updated_at: now,
  })
  .eq('id', ASSESSMENT_ID)
  .select('id, position, title');
if (dailyFunctioning.error) {
  console.error('Could not close the separate Daily Functioning module:', dailyFunctioning.error.message);
  process.exit(1);
}

const moduleSave = await supabase
  .from('learning_modules')
  .update({
    description: 'Learn about sleep and notice what seems relevant. Then explore one theme at a time in the Guided QHRT Reflection.',
    updated_at: now,
  })
  .eq('id', MODULE_ID);
if (moduleSave.error) {
  console.error('Could not update the Sleep lesson:', moduleSave.error.message);
  process.exit(1);
}

const check = await supabase
  .from('module_lessons')
  .select('position, title, kind')
  .eq('module_id', MODULE_ID)
  .eq('is_active', true)
  .order('position');
console.log(check.error ? check.error.message : JSON.stringify(check.data));
console.log(`Sleep Better, Live Better saved with ${slides.length} slides.`);
