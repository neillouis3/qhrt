export const FAQ_ITEMS: { id: string; question: string; answer: string }[] = [
  {
    id: 'therapy',
    question: 'Is QHRT therapy or medical care?',
    answer:
      'No. QHRT is coaching and education only, not therapy, counseling, or a clinical service. Check-ins are not diagnoses, and workbooks are not treatment plans. If you have a health concern, talk to a licensed professional.',
  },
  {
    id: 'check-ins',
    question: 'How do focus-area check-ins work?',
    answer:
      'Pick a topic such as sleep, stress, or habits. Each area has its own questions. Some follow-ups only appear when they apply. Your answers stay on the server and are scored there. The form does not tell you how to game a result.',
  },
  {
    id: 'workbooks',
    question: 'What do I get when I finish a check-in?',
    answer:
      'A short educational summary and one or more workbooks matched to that topic. The result is a next step to learn from, not a label or a diagnosis.',
  },
  {
    id: 'free',
    question: 'Is it free? Do I need an appointment?',
    answer:
      'QHRT is free to use. Create an account, pause whenever you like, and come back on your own schedule. There is no commute and no booking slot.',
  },
  {
    id: 'privacy',
    question: 'Who can see my answers?',
    answer:
      'You need to be signed in. Only you can see your own submissions. Staff with an admin role can manage content. We handle personal information under Canadian privacy law. The Privacy page has the details.',
  },
  {
    id: 'crisis',
    question: 'What if I need urgent help?',
    answer:
      'QHRT is not emergency or crisis care. If you are in danger or need urgent help, contact local emergency services. Do not rely on this site in a crisis.',
  },
];

const QUESTION_MIN = 12;
const QUESTION_MAX = 400;
const NAME_MAX = 40;
const EMAIL_MAX = 80;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseFaqQuestionInput(raw: unknown):
  | { name: string; email: string; question: string }
  | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Write the question you still have.' };
  const data = raw as { name?: unknown; email?: unknown; question?: unknown };
  const name = clean(data.name, NAME_MAX);
  const email = clean(data.email, EMAIL_MAX);
  const question = clean(data.question, QUESTION_MAX);
  if (question.length < QUESTION_MIN) {
    return { error: 'A little more, please. One or two sentences is enough.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'That email does not look right.' };
  }
  return { name, email, question };
}
