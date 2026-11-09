/**
 * Adds the Life Transitions lesson: two education modules, plus reflection perspectives.
 * Guided QHRT Reflection is the first module in the participant lesson page.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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

const PAGE = '#f6f1e4';
const INK = '#292524';
const MUTED = '#44403c';
const GOLD = '#c4a574';
const PAPER = '#fffdf8';
const GOLD_CARD = '#e6d5a3';

let blockCount = 0;
function blockId() {
  blockCount += 1;
  return `lt${blockCount}`;
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
    x, y, w, h: 10,
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

function pin(x, y) {
  return {
    id: blockId(),
    type: 'shape',
    x, y, w: 12, h: 12,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: INK,
    align: 'left',
    src: '',
    shape: 'ellipse',
    fill: GOLD,
    stroke: GOLD,
    radius: 0,
    arrow: false,
  };
}

function stepCard(x, y, w, h, label, body) {
  return [
    card(x, y, w, h, PAPER),
    text(x + 16, y + 14, w - 32, 24, label, { size: 13, weight: 600 }),
    text(x + 16, y + 42, w - 32, h - 56, body, { size: 16 }),
  ];
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
    radius: 8,
    arrow: false,
  };
}

function laidOut(key, title, voiceover, blocks) {
  return {
    key,
    section: 'Life Transitions & Continuity',
    title,
    paragraphs: [],
    points: [],
    voiceover,
    background: PAGE,
    blocks,
  };
}

const understanding = [
  laidOut(
    'welcome',
    'Life Transitions & Continuity',
    'Life Transitions and Continuity. Understanding Change, Loss, and What We Carry Forward. A self-paced educational wellness module.',
    [
      photo('/life-transitions/m1-cover.jpg', 0, 0, 960, 540),
      text(72, 140, 760, 120, 'Life Transitions\n& Continuity', { size: 44, weight: 600 }),
      rule(72, 272, 280),
      text(72, 296, 680, 80, 'Understanding Change, Loss,\nand What We Carry Forward', { size: 22, weight: 600 }),
      text(72, 388, 560, 36, 'A self-paced educational wellness module', { size: 16, color: MUTED }),
    ]
  ),
  laidOut(
    'many-ways',
    'Life Changes in Many Ways',
    'Life transitions change something important in our circumstances, relationships, roles, routines, expectations, or direction. They may be planned or unexpected. Different transitions affect different people in different ways.',
    [
      photo('/life-transitions/m1-doorway.jpg', 700, 28, 220, 460),
      text(48, 28, 630, 48, 'Life Changes in Many Ways', { size: 30, weight: 600 }),
      text(48, 86, 630, 84, 'Life transitions change something important in our circumstances, relationships, roles, routines, expectations, or direction. They may be planned or unexpected.', { size: 16 }),
      rule(48, 186, 280),
      rule(360, 186, 280),
      text(48, 204, 290, 200, '•  a relationship changing or ending\n•  retirement\n•  moving\n•  a career or role change\n•  changes within a family', { size: 16 }),
      text(360, 204, 310, 220, '•  children leaving home\n•  changes in friendships or social circles\n•  the death of someone important\n•  financial or lifestyle changes\n•  beginning a new stage of life', { size: 16 }),
      text(48, 460, 620, 36, 'Different transitions affect different people in different ways.', { size: 16 }),
    ]
  ),
  laidOut(
    'wider',
    'One Change Can Affect Many Parts of Life',
    'A significant transition rarely changes only one thing. Understanding the wider landscape of change can make a transition easier to understand.',
    [
      photo('/life-transitions/m1-street.jpg', 36, 36, 220, 450),
      text(280, 28, 640, 96, 'One Change Can Affect\nMany Parts of Life', { size: 30, weight: 600 }),
      text(280, 136, 640, 56, 'A significant transition rarely changes only one thing. It may also change:', { size: 16 }),
      rule(280, 206, 280),
      rule(580, 206, 320),
      text(280, 224, 280, 180, '•  familiar routines\n•  shared activities\n•  responsibilities\n•  social connections\n•  traditions', { size: 16 }),
      text(580, 224, 340, 180, '•  places that felt familiar\n•  plans and expectations\n•  how we spend our time\n•  the roles we occupied\n•  the future we imagined', { size: 16 }),
      text(280, 460, 640, 48, 'Understanding the wider landscape of change can make a transition easier to understand.', { size: 16 }),
    ]
  ),
  laidOut(
    'not-easy',
    'Not Every Loss Is Easy to See',
    'Not every loss is easy to see. Some changes are visible, and some are less visible. Both can be meaningful parts of a life transition.',
    [
      text(48, 32, 860, 52, 'Not Every Loss Is Easy to See', { size: 34, weight: 600 }),
      card(48, 120, 420, 310, PAPER),
      card(492, 120, 420, 310, GOLD_CARD),
      pin(246, 114),
      text(72, 148, 360, 36, 'Visible Changes', { size: 22, weight: 600 }),
      text(72, 196, 370, 200, '•  a person is no longer present\n•  a home changes\n•  a job ends\n•  a routine stops\n•  a family structure changes', { size: 18 }),
      text(516, 148, 370, 36, 'Less-Visible Changes', { size: 22, weight: 600 }),
      text(516, 196, 370, 210, '•  an expected future\n•  a familiar identity or role\n•  a sense of belonging\n•  shared traditions\n•  assumptions about what would happen next\n•  a particular way of living', { size: 18 }),
      text(48, 468, 860, 36, 'Both visible and less-visible changes can be meaningful parts of a life transition.', { size: 18 }),
    ]
  ),
  laidOut(
    'not-straight',
    'Life Transition Is Not a Straight Line',
    'Adjusting to change does not necessarily happen in a predictable sequence. Past and present can naturally overlap while life is changing.',
    [
      photo('/life-transitions/m1-chair.jpg', 650, 36, 270, 460),
      text(48, 32, 580, 96, 'Life Transition Is\nNot a Straight Line', { size: 32, weight: 600 }),
      text(48, 148, 580, 180, 'Adjusting to change does not necessarily happen in a predictable sequence. A person may feel settled one day and unexpectedly reminded of the previous chapter another day.\n\nA familiar place, song, date, photograph, conversation, activity, or ordinary moment may bring the past to mind. This does not automatically mean that anything is wrong.', { size: 16 }),
      card(48, 360, 560, 110, GOLD_CARD),
      text(72, 384, 512, 70, 'Past and present can naturally overlap while life is changing.', { size: 18 }),
    ]
  ),
  laidOut(
    'memory',
    'What Can a Memory Represent?',
    'A memory may represent more than the event we remember. Sometimes understanding what a memory represents tells us more than simply remembering what happened.',
    [
      photo('/life-transitions/m1-garden.jpg', 710, 36, 210, 450),
      text(48, 28, 640, 48, 'What Can a Memory Represent?', { size: 30, weight: 600 }),
      text(48, 88, 640, 40, 'A memory may represent more than the event we remember:', { size: 16 }),
      rule(48, 146, 280),
      rule(360, 146, 300),
      text(48, 166, 290, 220, '•  who we were at that time\n•  where we felt we belonged\n•  people who shared that period with us\n•  familiar routines', { size: 16 }),
      text(360, 166, 320, 220, '•  hopes and expectations\n•  a sense of home\n•  companionship, love, possibility\n•  a version of the future we once imagined', { size: 16 }),
      text(48, 450, 640, 56, 'Sometimes understanding what a memory represents tells us more than simply remembering what happened.', { size: 16 }),
    ]
  ),
  laidOut(
    'expected',
    'The Future We Once Imagined',
    'People naturally create expectations about what their lives may look like. A significant transition can create a difference between the life you expected and the life that is unfolding.',
    [
      text(48, 32, 860, 48, 'The Future We Once Imagined', { size: 34, weight: 600 }),
      text(48, 96, 860, 64, 'People naturally create expectations about what their lives may look like. A significant transition can create a difference between:', { size: 18 }),
      card(48, 190, 420, 180, PAPER),
      card(492, 190, 420, 180, GOLD_CARD),
      pin(246, 184),
      text(72, 230, 372, 100, 'THE LIFE\nI EXPECTED', { size: 32, weight: 600 }),
      text(516, 230, 372, 100, 'THE LIFE THAT\nIS UNFOLDING', { size: 32, weight: 600 }),
      text(48, 420, 860, 72, 'Recognizing that difference does not require deciding that one life is valuable and the other is not. It simply acknowledges that life sometimes takes a different form than expected.', { size: 18 }),
    ]
  ),
  laidOut(
    'lesser',
    'A Different Future Is Not Automatically a Lesser Future',
    'When an expected future changes, it can be difficult to imagine something that does not yet exist. An unknown future does not need to compete with a known past.',
    [
      photo('/life-transitions/m1-hills.jpg', 0, 0, 960, 150),
      text(48, 168, 860, 72, 'A Different Future Is Not Automatically a Lesser Future', { size: 28, weight: 600 }),
      text(48, 252, 500, 200, 'When an expected future changes, it can be difficult to imagine something that does not yet exist. The previous chapter is familiar. The future is not.\n\nThat difference can make the past feel more complete, vivid, or meaningful simply because we already know what it contained.', { size: 16 }),
      card(560, 268, 352, 140, GOLD_CARD),
      text(584, 292, 308, 100, 'An unknown future does not need to compete with a known past.', { size: 18 }),
    ]
  ),
  laidOut(
    'replace',
    'Something New Does Not Have to Replace What Came Before',
    'A new chapter does not have to erase or recreate an earlier one. The next chapter can be meaningful in its own right.',
    [
      photo('/life-transitions/m1-open-door.jpg', 36, 36, 230, 450),
      text(290, 36, 630, 100, 'Something New Does Not Have\nto Replace What Came Before', { size: 28, weight: 600 }),
      text(290, 156, 630, 200, 'A new relationship, opportunity, role, home, friendship, activity, or life experience does not have to erase or recreate an earlier one. Different chapters can have different meanings.\n\nSomething from the past can remain important without becoming the standard that everything in the future must reproduce.', { size: 16 }),
      text(290, 420, 620, 48, 'The next chapter can be meaningful in its own right.', { size: 18 }),
    ]
  ),
  laidOut(
    'continuity',
    'What Does Continuity Mean?',
    'Continuity does not mean that life remains unchanged. It means recognizing that some things continue even as circumstances change.',
    [
      photo('/life-transitions/m1-tree.jpg', 710, 36, 210, 450),
      text(48, 28, 640, 48, 'What Does Continuity Mean?', { size: 30, weight: 600 }),
      text(48, 88, 640, 90, 'Continuity does not mean that life remains unchanged. It means recognizing that some things continue even as circumstances change.', { size: 16 }),
      rule(48, 190, 280),
      rule(360, 190, 300),
      text(48, 210, 290, 160, '•  memories, knowledge, values\n•  interests and abilities\n•  relationships that remain', { size: 16 }),
      text(360, 210, 320, 180, '•  traditions we choose to continue\n•  lessons learned, qualities developed\n•  our capacity for love, connection, enjoyment, curiosity, and meaning', { size: 16 }),
      text(48, 450, 640, 56, 'Change can alter the structure of life without removing everything that came before it.', { size: 16 }),
    ]
  ),
  laidOut(
    'travel',
    'Some Things Belong to a Chapter',
    'Some things belong to a chapter. Some things travel with you. Continuity allows the past to remain part of your story without requiring the future to reproduce it.',
    [
      text(48, 24, 860, 90, 'Some Things Belong to a Chapter.\nSome Things Travel With You.', { size: 30, weight: 600 }),
      card(48, 130, 420, 270, PAPER),
      card(492, 130, 420, 270, GOLD_CARD),
      pin(246, 124),
      text(72, 150, 370, 32, 'That Chapter', { size: 22, weight: 600 }),
      text(72, 194, 370, 180, '•  particular routines\n•  particular circumstances\n•  shared roles\n•  specific plans\n•  a particular version of everyday life', { size: 18 }),
      text(516, 150, 370, 32, 'What Can Continue With Me', { size: 20, weight: 600 }),
      text(516, 194, 370, 190, '•  what I learned; what I value\n•  qualities I developed\n•  memories I choose to keep\n•  interests I still enjoy\n•  my capacity to connect\n•  my ability to create meaning\n•  possibilities that have not yet taken shape', { size: 16 }),
      text(48, 430, 860, 56, 'Continuity allows the past to remain part of your story without requiring the future to reproduce it.', { size: 18 }),
    ]
  ),
  laidOut(
    'both',
    'More Than One Truth',
    'More than one truth can exist at the same time. A chapter can have ended, and it can still have mattered. Life transitions often involve making room for more than one truth.',
    [
      text(48, 28, 860, 80, 'More Than One Truth Can Exist at the Same Time', { size: 30, weight: 600 }),
      card(48, 130, 420, 140, PAPER),
      card(492, 130, 420, 140, PAPER),
      card(48, 292, 420, 140, PAPER),
      card(492, 292, 420, 140, PAPER),
      pin(246, 124),
      pin(690, 124),
      pin(246, 286),
      pin(690, 286),
      text(72, 156, 372, 96, 'A chapter can have ended\nAND\nit can still have mattered.', { size: 20, weight: 600 }),
      text(516, 156, 372, 96, 'I can miss something\nAND\nremain interested in what comes next.', { size: 20, weight: 600 }),
      text(72, 318, 372, 96, 'I can value my previous life\nAND\nparticipate in my present life.', { size: 20, weight: 600 }),
      text(516, 318, 372, 96, 'My future can be different\nAND\nstill become meaningful.', { size: 20, weight: 600 }),
      text(48, 468, 860, 36, 'Life transitions often involve making room for more than one truth.', { size: 18 }),
    ]
  ),
  laidOut(
    'pace',
    'There Is No Required Pace',
    'People adapt to significant change differently. There is no universal timetable. This program does not ask you to arrive at a particular feeling or conclusion.',
    [
      photo('/life-transitions/m1-forest.jpg', 650, 36, 270, 460),
      text(48, 32, 580, 48, 'There Is No Required Pace', { size: 30, weight: 600 }),
      text(48, 96, 580, 56, 'People adapt to significant change differently. There is no universal timetable for:', { size: 16 }),
      text(72, 164, 540, 180, '•  when memories should feel different\n•  when routines should change\n•  when something new should begin\n•  how important a previous chapter should remain\n•  when the future should become clear', { size: 16 }),
      card(48, 370, 560, 100, GOLD_CARD),
      text(72, 394, 512, 60, 'This program does not ask you to arrive at a particular feeling or conclusion.', { size: 18 }),
    ]
  ),
  laidOut(
    'curious',
    'Becoming Curious About Your Own Experience',
    'The next module invites you to notice, reflect, choose, experiment, observe, and record. This is a preview of the next module, not an exercise.',
    [
      photo('/life-transitions/m1-gate.jpg', 24, 24, 150, 490),
      text(200, 24, 720, 80, 'The Next Step: Becoming Curious\nAbout Your Own Experience', { size: 26, weight: 600 }),
      text(200, 112, 720, 48, 'Understanding life transition provides a foundation. The next module will invite you to explore your own experience through:', { size: 15 }),
      rule(200, 176, 220),
      rule(440, 176, 220),
      rule(680, 176, 220),
      text(200, 192, 220, 110, '01\nNOTICE\nWhat stands out in everyday life?', { size: 15, weight: 600 }),
      text(440, 192, 220, 110, '02\nREFLECT\nWhat does it represent to you?', { size: 15, weight: 600 }),
      text(680, 192, 240, 130, '03\nCHOOSE\nIs there a perspective you would like to experiment with?', { size: 15, weight: 600 }),
      rule(200, 340, 220),
      rule(440, 340, 220),
      rule(680, 340, 220),
      text(200, 356, 220, 110, '04\nEXPERIMENT\nWhat small real-world choice could you try?', { size: 15, weight: 600 }),
      text(440, 356, 220, 90, '05\nOBSERVE\nWhat happens?', { size: 15, weight: 600 }),
      text(680, 356, 220, 90, '06\nRECORD\nWhat did you notice?', { size: 15, weight: 600 }),
      text(200, 490, 700, 28, 'A preview of the next module only, not an exercise.', { size: 16, color: MUTED }),
    ]
  ),
  laidOut(
    'close',
    'Continuity and Change',
    'Your life story can hold both continuity and change. You can carry forward what belongs to you while remaining open to what comes next. Continue when you feel ready for the next Life Transition and Continuity education module.',
    [
      photo('/life-transitions/m1-beach.jpg', 0, 0, 960, 540),
      text(72, 64, 800, 100, 'Your Life Story Can Hold\nBoth Continuity and Change', { size: 34, weight: 600 }),
      text(72, 180, 780, 140, 'A meaningful chapter does not become meaningless because it ended. Moving forward does not require erasing what came before. What happened can remain part of your story while your life continues to develop in ways that are not yet known.\n\nYou can carry forward what belongs to you while remaining open to what comes next.', { size: 18 }),
      rule(72, 350, 280),
      text(72, 376, 760, 64, 'Continue when you feel ready for the next Life Transition & Continuity education module.', { size: 18 }),
    ]
  ),
  laidOut(
    'sources',
    'Sources',
    'Sources. Stroebe, Schut, and Boerner, 2010, Continuing bonds in adaptation to bereavement. Schlossberg, 1981, A model for analyzing human adaptation to transition. William Bridges Associates, Bridges Transition Model.',
    [
      text(48, 36, 400, 48, 'Sources', { size: 34, weight: 600 }),
      text(48, 120, 860, 220, 'Stroebe, M., Schut, H., & Boerner, K. (2010). Continuing bonds in adaptation to bereavement: Toward theoretical integration. Clinical Psychology Review.\n\nSchlossberg, N. K. (1981). A model for analyzing human adaptation to transition. The Counseling Psychologist, 9(2).\n\nWilliam Bridges Associates. Bridges Transition Model.', { size: 18 }),
    ]
  ),
];

const exploring = [
  laidOut(
    'welcome',
    'Exploring Your Experience',
    'Life Transitions and Continuity. Exploring Your Experience and What You Want to Carry Forward. A self-paced educational wellness module.',
    [
      photo('/life-transitions/m2-01.jpg', 0, 0, 960, 540),
      text(72, 140, 760, 80, 'Life Transitions\n& Continuity', { size: 44, weight: 600 }),
      rule(72, 248, 280),
      text(72, 276, 760, 90, 'Exploring Your Experience and\nWhat You Want to Carry Forward', { size: 22, weight: 600 }),
      text(72, 388, 640, 36, 'A self-paced educational wellness module', { size: 16, color: MUTED }),
    ]
  ),
  laidOut(
    'understand-explore',
    'From Understanding to Exploration',
    'In the first module, we explored how significant life changes can affect many parts of everyday life. Now you are invited to become curious about your own experience. Use six simple steps: Notice, Reflect, Choose, Experiment, Observe, and Record. There is no required answer and no required outcome.',
    [
      text(48, 28, 860, 48, 'From Understanding to Exploration', { size: 32, weight: 600 }),
      text(48, 88, 860, 72, 'In the first module, we explored how significant life changes can affect many parts of everyday life.\nNow you are invited to become curious about your own experience.', { size: 16 }),
      text(48, 168, 400, 28, 'Use six simple steps:', { size: 16 }),
      ...stepCard(48, 206, 280, 108, 'NOTICE', 'What stands out?'),
      ...stepCard(340, 206, 280, 108, 'REFLECT', 'What does it represent to you?'),
      ...stepCard(632, 206, 280, 108, 'CHOOSE', 'Is there a perspective you would like to explore?'),
      ...stepCard(48, 326, 280, 108, 'EXPERIMENT', 'What small everyday choice could you try?'),
      ...stepCard(340, 326, 280, 108, 'OBSERVE', 'What happens?'),
      ...stepCard(632, 326, 280, 108, 'RECORD', 'What did you notice?'),
      text(48, 460, 820, 36, 'There is no required answer and no required outcome.', { size: 18 }),
    ]
  ),
  laidOut(
    'notice',
    'Step 1 — Notice',
    'Begin with everyday observation. You do not need to search for anything. Simply notice what naturally catches your attention. What has been standing out to me lately?',
    [
      photo('/life-transitions/m2-02.jpg', 690, 0, 270, 540),
      text(48, 28, 620, 48, 'Step 1 — Notice', { size: 32, weight: 600 }),
      text(48, 92, 620, 100, 'Begin with everyday observation.\nYou do not need to search for anything.\nSimply notice what naturally catches your attention.', { size: 16 }),
      text(48, 210, 400, 28, 'Examples may include:', { size: 16, color: MUTED }),
      rule(48, 246, 260),
      rule(340, 246, 280),
      text(48, 264, 270, 180, '•  a memory\n•  a photograph\n•  a song\n•  a place\n•  an anniversary or date\n•  an old routine', { size: 15 }),
      text(340, 264, 310, 200, '•  an activity you once shared\n•  something you miss\n•  something that has changed\n•  something you expected would still be part of your life\n•  a thought about the future', { size: 15 }),
      text(48, 480, 620, 32, 'What has been standing out to me lately?', { size: 16, weight: 600 }),
    ]
  ),
  laidOut(
    'describe',
    'Describe Before You Interpret',
    'Start by describing what happened as simply as possible. Begin with the experience itself. You can explore what it represents afterward.',
    [
      text(48, 32, 860, 48, 'Describe Before You Interpret', { size: 34, weight: 600 }),
      text(48, 100, 820, 36, 'Start by describing what happened as simply as possible.', { size: 18 }),
      text(48, 156, 200, 28, 'Examples:', { size: 16, color: MUTED }),
      card(48, 196, 420, 200, PAPER),
      card(492, 196, 420, 200, PAPER),
      text(72, 216, 372, 160, '“I heard a familiar song.”\n\n“I drove past a place I used to visit.”\n\n“I thought about an old routine.”', { size: 16 }),
      text(516, 216, 372, 160, '“I remembered something we used to do.”\n\n“I noticed that weekends feel different now.”\n\n“I thought about something I once expected to happen.”', { size: 16 }),
      text(48, 430, 820, 64, 'Begin with the experience itself.\nYou can explore what it represents afterward.', { size: 18 }),
    ]
  ),
  laidOut(
    'reflect',
    'Step 2 — Reflect',
    'What does this represent to you? The same memory, place, activity, or change can represent different things to different people. Instead of asking why you are reacting this way, consider asking what this represents to you. Your interpretation belongs to you.',
    [
      text(48, 28, 860, 48, 'Step 2 — Reflect', { size: 34, weight: 600 }),
      text(48, 88, 860, 36, 'What Does This Represent to You?', { size: 22, weight: 600 }),
      text(48, 136, 860, 56, 'The same memory, place, activity, or change can represent different things to different people.', { size: 18 }),
      card(48, 210, 400, 210, GOLD_CARD),
      text(72, 230, 352, 170, 'Instead of asking:\n“Why am I reacting this way?”\n\nconsider asking:\n“What does this represent to me?”', { size: 16 }),
      text(480, 210, 420, 28, 'Possible examples:', { size: 16, color: MUTED }),
      text(480, 246, 200, 180, '•  companionship\n•  belonging\n•  family\n•  a stage of life\n•  freedom\n•  security', { size: 16 }),
      text(700, 246, 220, 180, '•  shared experiences\n•  familiarity\n•  an expected future\n•  a version of myself\n•  an important role\n•  something else entirely', { size: 16 }),
      text(48, 460, 800, 36, 'Your interpretation belongs to you.', { size: 18 }),
    ]
  ),
  laidOut(
    'many-things',
    'One Memory Can Represent Many Things',
    'A memory about one event may also remind you of other parts of that time. When you think about this experience, what else seems connected to it? You may notice one thing, several things, or nothing in particular.',
    [
      text(48, 28, 860, 80, 'One Memory Can Represent\nMany Things', { size: 34, weight: 600 }),
      text(48, 124, 820, 36, 'A memory about one event may also remind you of:', { size: 18 }),
      rule(48, 176, 380),
      rule(480, 176, 380),
      text(48, 196, 400, 180, '•  who was there\n•  how everyday life looked\n•  who you were at the time\n•  a role you occupied\n•  a familiar routine', { size: 18 }),
      text(480, 196, 420, 180, '•  a place you associated with that period\n•  plans you had\n•  expectations about the future\n•  a sense of belonging', { size: 18 }),
      text(48, 420, 860, 72, 'When I think about this experience, what else seems connected to it?\nYou may notice one thing, several things, or nothing in particular.', { size: 18 }),
    ]
  ),
  laidOut(
    'chapter-map',
    'What Was Part of That Life Chapter?',
    'Notice which areas feel relevant to you. You do not need to select them all.',
    [
      text(48, 24, 860, 44, 'What Was Part of That Life Chapter?', { size: 30, weight: 600 }),
      card(36, 88, 168, 40, PAPER), text(36, 96, 168, 24, 'PEOPLE', { size: 13, weight: 600, align: 'center' }),
      card(214, 88, 168, 40, PAPER), text(214, 96, 168, 24, 'ROUTINES', { size: 13, weight: 600, align: 'center' }),
      card(392, 88, 168, 40, PAPER), text(392, 96, 168, 24, 'PLACES', { size: 13, weight: 600, align: 'center' }),
      card(570, 88, 168, 40, PAPER), text(570, 96, 168, 24, 'ROLES', { size: 13, weight: 600, align: 'center' }),
      card(748, 88, 168, 40, PAPER), text(748, 96, 168, 24, 'TRADITIONS', { size: 13, weight: 600, align: 'center' }),
      card(36, 210, 200, 40, PAPER), text(36, 218, 200, 24, 'ACTIVITIES', { size: 13, weight: 600, align: 'center' }),
      card(724, 210, 200, 40, PAPER), text(724, 218, 200, 24, 'BELONGING', { size: 13, weight: 600, align: 'center' }),
      card(360, 188, 240, 88, GOLD_CARD),
      text(360, 206, 240, 56, 'THAT LIFE\nCHAPTER', { size: 18, weight: 600, align: 'center' }),
      card(36, 320, 168, 40, PAPER), text(36, 328, 168, 24, 'PLANS', { size: 13, weight: 600, align: 'center' }),
      card(214, 320, 200, 40, PAPER), text(214, 328, 200, 24, 'EXPECTATIONS', { size: 13, weight: 600, align: 'center' }),
      card(424, 320, 200, 40, GOLD_CARD), text(424, 328, 200, 24, 'FUTURE PICTURE', { size: 13, weight: 600, align: 'center' }),
      card(634, 320, 140, 40, PAPER), text(634, 328, 140, 24, 'IDENTITY', { size: 13, weight: 600, align: 'center' }),
      card(784, 320, 140, 40, PAPER), text(784, 328, 140, 24, 'MEANING', { size: 12, weight: 600, align: 'center' }),
      text(48, 420, 820, 64, 'Notice which areas feel relevant to you.\nYou do not need to select them all.', { size: 18 }),
    ]
  ),
  laidOut(
    'changed',
    'What Changed — and What Continues?',
    'Change and continuity can exist at the same time.',
    [
      text(48, 28, 860, 48, 'What Changed — and What Continues?', { size: 30, weight: 600 }),
      card(48, 100, 420, 340, PAPER),
      card(492, 100, 420, 340, GOLD_CARD),
      text(72, 120, 372, 28, 'WHAT CHANGED?', { size: 16, weight: 600 }),
      text(516, 120, 372, 28, 'WHAT CONTINUES?', { size: 16, weight: 600 }),
      text(72, 164, 372, 250, '•  circumstances\n•  routines\n•  relationships\n•  roles\n•  plans\n•  responsibilities\n•  where I spend my time\n•  how everyday life looks\n•  expectations about the future', { size: 16 }),
      text(516, 164, 372, 250, '•  memories\n•  knowledge\n•  values\n•  interests\n•  abilities\n•  relationships that remain\n•  qualities I developed\n•  things I still enjoy\n•  my ability to make new choices', { size: 16 }),
      text(48, 468, 860, 36, 'Change and continuity can exist at the same time.', { size: 18 }),
    ]
  ),
  laidOut(
    'once-expected',
    'The Future I Once Expected',
    'People naturally form ideas about what their future may look like. A significant transition can change that picture. Privately complete any statement that feels useful. Notice the expectation without judging it.',
    [
      photo('/life-transitions/m2-03.jpg', 0, 0, 360, 540),
      text(390, 32, 530, 72, 'The Future I Once Expected', { size: 28, weight: 600 }),
      text(390, 112, 530, 80, 'People naturally form ideas about what their future may look like. A significant transition can change that picture.', { size: 16 }),
      text(390, 200, 530, 28, 'Privately complete any statement that feels useful:', { size: 15, color: MUTED }),
      text(390, 244, 520, 28, '“I once expected...”', { size: 16 }),
      rule(390, 278, 360),
      text(390, 300, 520, 28, '“I assumed this would continue...”', { size: 16 }),
      rule(390, 334, 360),
      text(390, 356, 520, 28, '“I pictured my future including...”', { size: 16 }),
      rule(390, 390, 360),
      text(390, 412, 520, 28, '“One part of that future that mattered to me was...”', { size: 16 }),
      rule(390, 446, 360),
      text(390, 470, 520, 32, 'Notice the expectation without judging it.', { size: 16 }),
    ]
  ),
  laidOut(
    'two-ideas',
    'Two Different Ideas',
    'That particular future did not happen. A meaningful future is not available to me. These are not automatically the same idea. Have I ever treated them as though they were?',
    [
      text(48, 36, 860, 48, 'Two Different Ideas', { size: 34, weight: 600 }),
      card(48, 160, 420, 140, PAPER),
      card(492, 160, 420, 140, GOLD_CARD),
      text(72, 196, 372, 80, '“That particular future\ndid not happen.”', { size: 22, weight: 600 }),
      text(516, 196, 372, 80, '“A meaningful future\nis not available to me.”', { size: 22, weight: 600 }),
      text(48, 340, 820, 36, 'These are not automatically the same idea.', { size: 18 }),
      text(48, 400, 820, 36, 'Have I ever treated them as though they were?', { size: 20, weight: 600 }),
    ]
  ),
  laidOut(
    'asking-future',
    'What Are You Asking the Future to Do?',
    'Sometimes something new can quietly acquire a job. Am I expecting something in my future to reproduce something from my past? Could something new be valuable without having to reproduce what came before? Simply notice your answer.',
    [
      text(48, 24, 860, 72, 'What Are You Asking\nthe Future to Do?', { size: 32, weight: 600 }),
      text(48, 112, 860, 56, 'Sometimes something new can quietly acquire a job. A future relationship, opportunity, home, role, friendship, or experience might be expected to:', { size: 16 }),
      text(72, 184, 760, 160, '•  recreate something from the past\n•  replace something important\n•  reproduce a familiar way of living\n•  make an earlier change feel different\n•  look like the future originally imagined', { size: 18 }),
      text(48, 370, 860, 56, 'Am I expecting something in my future to reproduce something from my past?', { size: 18, weight: 600 }),
      text(48, 430, 860, 36, 'Could something new be valuable without having to reproduce what came before?', { size: 16 }),
      text(48, 480, 700, 32, 'Simply notice your answer.', { size: 18 }),
    ]
  ),
  laidOut(
    'belonged',
    'What Belonged to That Chapter?',
    'Consider what belonged specifically to that particular time or circumstance. Recognizing that something belonged to a particular chapter does not diminish its importance.',
    [
      text(48, 32, 860, 48, 'What Belonged to That Chapter?', { size: 32, weight: 600 }),
      text(48, 100, 860, 56, 'Consider what belonged specifically to that particular time or circumstance.', { size: 18 }),
      rule(48, 172, 360),
      rule(480, 172, 360),
      text(48, 192, 400, 180, '•  a certain routine\n•  a particular relationship\n•  a shared role\n•  a specific home', { size: 18 }),
      text(480, 192, 420, 180, '•  certain plans\n•  particular traditions\n•  a familiar social structure\n•  one version of everyday life', { size: 18 }),
      text(48, 440, 860, 64, 'Recognizing that something belonged to a particular chapter does not diminish its importance.', { size: 18 }),
    ]
  ),
  laidOut(
    'still-belongs',
    'What Still Belongs to You?',
    'Now consider what existed during that chapter but is not owned by that chapter. What would you like to carry forward?',
    [
      text(48, 28, 700, 48, 'What Still Belongs to You?', { size: 32, weight: 600 }),
      text(48, 92, 700, 56, 'Now consider what existed during that chapter but is not owned by that chapter.', { size: 16 }),
      photo('/life-transitions/m2-04.jpg', 780, 0, 180, 540),
      rule(48, 164, 320),
      rule(400, 164, 340),
      text(48, 184, 330, 220, '•  my ability to love\n•  my ability to connect\n•  my humour\n•  my creativity\n•  my values\n•  my interests\n•  what I learned', { size: 16 }),
      text(400, 184, 360, 220, '•  my ability to enjoy companionship\n•  my curiosity\n•  qualities I developed\n•  memories I value\n•  traditions I choose to continue\n•  my ability to find meaning in new experiences', { size: 15 }),
      text(48, 470, 700, 32, 'What would I like to carry forward?', { size: 18, weight: 600 }),
    ]
  ),
  laidOut(
    'bridge',
    'Your Continuity Bridge',
    'You decide what belongs in each part: what was, what you carry forward, and what remains open.',
    [
      text(48, 24, 860, 44, 'Your Continuity Bridge', { size: 34, weight: 600 }),
      card(36, 88, 288, 340, PAPER),
      card(336, 88, 288, 340, GOLD_CARD),
      card(636, 88, 288, 340, PAPER),
      text(52, 104, 256, 48, 'WHAT WAS', { size: 16, weight: 600 }),
      text(352, 104, 256, 48, 'WHAT I\nCARRY FORWARD', { size: 16, weight: 600 }),
      text(652, 104, 256, 28, 'WHAT REMAINS OPEN', { size: 15, weight: 600 }),
      text(52, 168, 256, 230, '•  experiences\n•  relationships\n•  roles\n•  routines\n•  expectations', { size: 16 }),
      text(352, 188, 256, 210, '•  values\n•  learning\n•  memories\n•  qualities\n•  interests\n•  capacities', { size: 16 }),
      text(652, 168, 256, 230, '•  possibilities\n•  relationships\n•  experiences\n•  choices\n•  routines\n•  future chapters', { size: 16 }),
      text(48, 460, 820, 36, 'You decide what belongs in each part.', { size: 18 }),
    ]
  ),
  laidOut(
    'choose',
    'Step 3 — Choose a Perspective',
    'A perspective is one possible way of looking at an experience. You are not being asked to convince yourself that a statement is true. You can choose something you are curious about exploring. Which perspective feels relevant enough to explore? There is no correct choice.',
    [
      photo('/life-transitions/m2-05.jpg', 600, 0, 360, 540),
      text(48, 32, 520, 72, 'Step 3 — Choose a Perspective', { size: 28, weight: 600 }),
      text(48, 120, 520, 180, 'A perspective is one possible way of looking at an experience.\n\nYou are not being asked to convince yourself that a statement is true.\n\nInstead, you can choose something you are curious about exploring.', { size: 16 }),
      card(48, 330, 520, 120, GOLD_CARD),
      text(72, 354, 472, 80, 'Which perspective feels relevant enough to explore?\nThere is no correct choice.', { size: 18, weight: 600 }),
    ]
  ),
  laidOut(
    'previous',
    'Valuing the Previous Chapter',
    'Perspectives for valuing the previous chapter. Choose one only if it feels relevant to you.',
    [
      text(48, 24, 860, 64, 'Perspectives — Valuing\nthe Previous Chapter', { size: 30, weight: 600 }),
      card(48, 110, 420, 100, PAPER),
      card(492, 110, 420, 100, PAPER),
      card(48, 224, 420, 100, PAPER),
      card(492, 224, 420, 100, PAPER),
      card(48, 338, 864, 80, GOLD_CARD),
      text(68, 136, 380, 60, '“That chapter of my life mattered, even though it ended.”', { size: 16 }),
      text(512, 128, 380, 70, '“I can value what happened without needing to recreate it.”', { size: 16 }),
      text(68, 250, 380, 60, '“What belonged to that chapter can remain part of my story.”', { size: 16 }),
      text(512, 242, 380, 70, '“I can remember something important without requiring my future to reproduce it.”', { size: 16 }),
      text(68, 360, 820, 40, '“The importance of an experience is not determined by whether it continued.”', { size: 16 }),
      text(48, 460, 800, 32, 'Choose one only if it feels relevant to you.', { size: 18 }),
    ]
  ),
  laidOut(
    'continuity-views',
    'Perspectives — Continuity',
    'Continuity perspectives. Choose one only if it feels relevant to you.',
    [
      text(48, 28, 860, 48, 'Perspectives — Continuity', { size: 32, weight: 600 }),
      card(48, 100, 420, 110, PAPER),
      card(492, 100, 420, 110, PAPER),
      card(48, 224, 420, 110, PAPER),
      card(492, 224, 420, 120, PAPER),
      card(48, 360, 864, 80, GOLD_CARD),
      text(68, 128, 380, 64, '“I can carry forward what belongs to me.”', { size: 16 }),
      text(512, 120, 380, 76, '“Some circumstances changed, but not everything meaningful about me changed.”', { size: 16 }),
      text(68, 252, 380, 64, '“What I learned and developed remains available to me.”', { size: 16 }),
      text(512, 244, 380, 84, '“My capacity for connection, meaning, enjoyment, and belonging is not limited to one chapter of my life.”', { size: 16 }),
      text(68, 380, 820, 44, '“I can keep what is meaningful without keeping life exactly as it was.”', { size: 16 }),
      text(48, 470, 800, 32, 'Choose one only if it feels relevant to you.', { size: 18 }),
    ]
  ),
  laidOut(
    'next-views',
    'Perspectives — What Comes Next',
    'Perspectives for what comes next. Choose one only if it feels relevant to you.',
    [
      text(48, 24, 860, 48, 'Perspectives — What Comes Next', { size: 30, weight: 600 }),
      card(48, 92, 420, 110, PAPER),
      card(492, 92, 420, 90, PAPER),
      card(48, 214, 420, 100, PAPER),
      card(492, 214, 420, 110, PAPER),
      card(48, 338, 420, 120, PAPER),
      card(492, 338, 420, 90, PAPER),
      text(68, 112, 380, 76, '“A different future is not automatically a lesser future.”', { size: 16 }),
      text(512, 112, 380, 56, '“My future does not have to replace my past.”', { size: 16 }),
      text(68, 234, 380, 64, '“Something new can be meaningful in its own way.”', { size: 16 }),
      text(512, 234, 380, 76, '“I do not need to know exactly what comes next in order to participate in my life now.”', { size: 16 }),
      text(68, 358, 380, 84, '“A future relationship or experience can be valuable without being responsible for recreating a previous one.”', { size: 16 }),
      text(512, 358, 380, 56, '“My life can develop in ways I have not yet imagined.”', { size: 16 }),
      text(48, 480, 800, 32, 'Choose one only if it feels relevant to you.', { size: 18 }),
    ]
  ),
  laidOut(
    'own',
    'Or Choose Your Own Perspective',
    'The examples are simply starting points. You may create a perspective that fits your own experience more accurately. Keep it simple, personally meaningful, and open to exploration.',
    [
      text(48, 48, 860, 48, 'Or Choose Your Own Perspective', { size: 32, weight: 600 }),
      text(48, 130, 820, 72, 'The examples are simply starting points.\nYou may create a perspective that fits your own experience more accurately.', { size: 18 }),
      text(48, 240, 760, 32, 'A perspective I would like to experiment with is:', { size: 18, weight: 600 }),
      rule(48, 300, 640),
      text(48, 400, 820, 56, 'Keep it simple, personally meaningful, and open to exploration.', { size: 18 }),
    ]
  ),
  laidOut(
    'explore-choice',
    'Would You Like to Explore This Perspective?',
    'The choice remains yours. You can continue with this perspective, choose another, or leave it for today.',
    [
      text(48, 24, 860, 64, 'Would You Like to Explore\nThis Perspective?', { size: 30, weight: 600 }),
      text(48, 108, 500, 28, 'My selected perspective:', { size: 16, color: MUTED }),
      rule(48, 148, 480),
      text(72, 176, 800, 100, 'Does this feel relevant to something I have been noticing?\nAm I curious about what it would be like to experiment with this perspective?\nWould I like to explore it further?', { size: 16 }),
      ...stepCard(36, 300, 288, 130, 'YES', 'I would like to continue with this perspective.'),
      ...stepCard(336, 300, 288, 130, 'CHOOSE ANOTHER', 'I would like to explore a different perspective.'),
      ...stepCard(636, 300, 288, 130, 'NOT TODAY', 'I would prefer to leave it here.'),
      text(48, 470, 700, 32, 'The choice remains yours.', { size: 18 }),
    ]
  ),
  laidOut(
    'experiment',
    'Step 4 — Try One Small Everyday Experiment',
    'You can explore a perspective by seeing what it looks like in ordinary life. Choose one small action that fits the perspective you selected. Keep the experiment small and realistic.',
    [
      photo('/life-transitions/m2-06.jpg', 780, 0, 180, 540),
      text(48, 20, 700, 72, 'Step 4 — Try One Small\nEveryday Experiment', { size: 30, weight: 600 }),
      text(48, 108, 700, 56, 'You can explore a perspective by seeing what it looks like in ordinary life.\nChoose one small action that fits the perspective you selected.', { size: 16 }),
      text(48, 176, 200, 24, 'Examples:', { size: 16, color: MUTED }),
      text(48, 208, 340, 230, '•  return to an activity you enjoy\n•  accept an invitation\n•  create a new routine\n•  return to an old interest in a different way\n•  continue a valued tradition differently\n•  spend time with someone', { size: 16 }),
      text(400, 208, 360, 230, '•  visit somewhere new\n•  make a plan based on your present circumstances\n•  try something you previously postponed\n•  allow a meaningful memory to arise without deciding what it must mean', { size: 16 }),
      text(48, 470, 700, 32, 'Keep the experiment small and realistic.', { size: 18 }),
    ]
  ),
  laidOut(
    'experiment-card',
    'Your Everyday Experiment',
    'This is an experiment, not a test. Note the perspective, one small action, why you chose it, and when or where you might try it.',
    [
      text(48, 36, 860, 48, 'Your Everyday Experiment', { size: 34, weight: 600 }),
      card(48, 120, 420, 140, PAPER),
      card(492, 120, 420, 140, PAPER),
      card(48, 276, 420, 140, PAPER),
      card(492, 276, 420, 140, PAPER),
      text(68, 140, 380, 48, 'The perspective I am experimenting with:', { size: 16 }),
      rule(68, 210, 300),
      text(512, 140, 380, 48, 'One small action I would like to try:', { size: 16 }),
      rule(512, 210, 300),
      text(68, 296, 380, 36, 'I chose this because:', { size: 16 }),
      rule(68, 360, 300),
      text(512, 296, 380, 36, 'When or where might I try it?', { size: 16 }),
      rule(512, 360, 300),
      text(48, 460, 700, 32, 'This is an experiment, not a test.', { size: 18 }),
    ]
  ),
  laidOut(
    'observe',
    'Step 5 — Observe',
    'Afterward, simply notice what happened. All observations provide information. There is no required result.',
    [
      photo('/life-transitions/m2-07.jpg', 0, 0, 180, 540),
      text(210, 28, 700, 48, 'Step 5 — Observe', { size: 34, weight: 600 }),
      text(210, 92, 700, 36, 'Afterward, simply notice what happened.', { size: 18 }),
      text(210, 144, 300, 28, 'You might notice:', { size: 16, color: MUTED }),
      text(210, 184, 340, 200, '•  what felt familiar\n•  what felt different\n•  thoughts that appeared\n•  memories that appeared\n•  what you enjoyed', { size: 16 }),
      text(560, 184, 360, 200, '•  what felt uncomfortable\n•  what surprised you\n•  whether the perspective seemed useful\n•  whether another perspective occurred to you\n•  whether nothing particular changed', { size: 16 }),
      text(210, 430, 700, 64, 'All observations provide information.\nThere is no required result.', { size: 18 }),
    ]
  ),
  laidOut(
    'memory-stays',
    'A Memory Does Not Need to Disappear',
    'The purpose of observation is not to erase a memory or require it to become emotionally neutral. Instead of asking whether the memory disappeared, ask what you noticed this time.',
    [
      text(48, 24, 860, 72, 'A Memory Does Not Need\nto Disappear', { size: 32, weight: 600 }),
      text(48, 112, 860, 56, 'The purpose of observation is not to erase a memory or require it to become emotionally neutral.', { size: 16 }),
      text(48, 184, 360, 28, 'A memory may still feel:', { size: 16, color: MUTED }),
      text(48, 220, 360, 240, '•  important\n•  warm\n•  bittersweet\n•  sad\n•  enjoyable\n•  complicated\n•  distant\n•  vivid\n•  mixed', { size: 16 }),
      card(460, 200, 440, 200, GOLD_CARD),
      text(484, 232, 396, 140, 'Instead of asking:\n“Did the memory disappear?”\n\nask:\n“What did I notice this time?”', { size: 18 }),
    ]
  ),
  laidOut(
    'record',
    'Step 6 — Record What You Notice',
    'Record what happened, what stood out, what it represented, and what you noticed about the perspective you selected.',
    [
      photo('/life-transitions/m2-08.jpg', 700, 0, 260, 540),
      text(48, 24, 620, 48, 'Step 6 — Record What You Notice', { size: 28, weight: 600 }),
      text(72, 90, 600, 400, 'What happened?\n\nWhat stood out to me?\n\nWhat did the experience represent to me?\n\nWhat thoughts or feelings did I notice?\n\nDid anything feel different from previous occasions?\n\nWhat did I notice about the perspective I selected?\n\nWould I like to continue experimenting with it?\n\nIs there another perspective I would like to explore?\n\nWhat would I like to carry forward?', { size: 16 }),
    ]
  ),
  laidOut(
    'decide',
    'You Decide What Comes Next',
    'After observing your experience, you may choose what to do next. Self-directed learning includes deciding when you have explored enough.',
    [
      text(48, 24, 860, 44, 'You Decide What Comes Next', { size: 32, weight: 600 }),
      text(48, 84, 820, 36, 'After observing your experience, you may choose to:', { size: 16 }),
      ...stepCard(36, 140, 288, 120, 'CONTINUE', 'with the same perspective.'),
      ...stepCard(336, 140, 288, 120, 'MODIFY', 'the perspective.'),
      ...stepCard(636, 140, 288, 120, 'CHOOSE', 'a different perspective.'),
      ...stepCard(36, 276, 288, 120, 'TRY', 'another everyday experiment.'),
      ...stepCard(336, 276, 288, 120, 'PAUSE', 'and return another time.'),
      ...stepCard(636, 276, 288, 120, 'FINISH', 'the activity here.'),
      text(48, 440, 860, 56, 'Self-directed learning includes deciding when you have explored enough.', { size: 18 }),
    ]
  ),
  laidOut(
    'optional-next',
    'Optional Next Step',
    'You may now choose whether you would like to take a participant-selected perspective into the separate Guided QHRT Reflection.',
    [
      text(48, 32, 860, 40, 'Optional Next Step', { size: 28, weight: 600, color: MUTED }),
      text(48, 88, 860, 72, 'Explore Your Selected\nPerspective Further', { size: 32, weight: 600 }),
      text(48, 180, 820, 64, 'You may now choose whether you would like to take a participant-selected perspective into the separate:', { size: 16 }),
      text(48, 260, 700, 32, 'GUIDED QHRT REFLECTION', { size: 18, weight: 600 }),
      text(72, 320, 760, 140, 'Continue to Guided QHRT Reflection\n\nSave my selected perspective for later\n\nReturn to Life Transitions & Continuity\n\nFinish for now', { size: 18 }),
    ]
  ),
  laidOut(
    'carry-forward',
    'What Would You Like to Carry Forward?',
    'Before leaving this module, consider what you noticed, what matters, what belonged to an earlier chapter, and what still belongs to you. Your past can remain part of your story while your life continues to take shape.',
    [
      photo('/life-transitions/m2-09.jpg', 640, 0, 320, 540),
      text(48, 28, 560, 80, 'What Would You Like\nto Carry Forward?', { size: 30, weight: 600 }),
      text(48, 128, 560, 28, 'Before leaving this module, consider:', { size: 16, color: MUTED }),
      text(72, 172, 540, 240, 'What did I notice?\n\nWhat matters to me?\n\nWhat belonged to an earlier chapter?\n\nWhat still belongs to me?\n\nWhat perspective would I like to experiment with?\n\nWhat am I curious to discover next?', { size: 16 }),
      text(48, 450, 560, 56, 'Your past can remain part of your story while your life continues to take shape.', { size: 16 }),
    ]
  ),
  laidOut(
    'sources',
    'Sources & Further Reading',
    'Sources and further reading. Bonanno, 2004. Park, 2010. Fivush, 2011. Sedikides, Hong, and Wildschut, 2023. McAdams and McLean, 2013. Wrosch, Scheier, Miller, Schulz, and Carver, 2003.',
    [
      text(48, 24, 860, 40, 'Sources & Further Reading', { size: 28, weight: 600 }),
      text(48, 80, 420, 420, 'Bonanno, G. A. (2004). Loss, trauma, and human resilience: Have we underestimated the human capacity to thrive after extremely aversive events? American Psychologist, 59(1), 20–28.\n\nFivush, R. (2011). The development of autobiographical memory. Annual Review of Psychology, 62, 559–582.\n\nMcAdams, D. P., & McLean, K. C. (2013). Narrative identity. Current Directions in Psychological Science, 22(3), 233–238.', { size: 13 }),
      text(500, 80, 420, 430, 'Park, C. L. (2010). Making sense of the meaning literature: An integrative review of meaning making and its effects on adjustment to stressful life events. Psychological Bulletin, 136(2), 257–301.\n\nSedikides, C., Hong, E. K., & Wildschut, T. (2023). Self-continuity. Annual Review of Psychology, 74, 333–361.\n\nWrosch, C., Scheier, M. F., Miller, G. E., Schulz, R., & Carver, C. S. (2003). Adaptive self-regulation of unattainable goals. Personality and Social Psychology Bulletin, 29(12), 1494–1508.', { size: 13 }),
    ]
  ),
];
