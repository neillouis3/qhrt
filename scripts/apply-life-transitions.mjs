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
