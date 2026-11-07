/** Participant-facing Initial Access copy. Spec v1.0, November 1, 2026. */

export const WELCOME_PATHS = [
  'Begin Self-Directed QHRT',
  'Begin with Preparation & Readiness',
  'Take Additional Time or Personal Support Before Beginning',
  'Make Practical Preparations Before Beginning',
  'Seek Immediate Outside Assistance Before Continuing',
] as const;

export const WELCOME_BODY = `QHRT is an educational, instructional, self-paced and self-directed wellness program designed to support personal awareness, well-being and quality of life.

This short Program Readiness & Suitability Check will help you consider whether self-directed QHRT feels appropriate for you at this time and identify the best starting point for your participation.

There are no right or wrong answers.
Please respond based on how things feel for you right now.`;

export const WELCOME_NOTICE = `QHRT is a self-directed educational wellness program and is not designed for emergency or crisis situations.

Responses submitted through this website are not monitored in real time.`;

export const CONFIRM_PATHS = new Set(['self_directed', 'preparation', 'additional_time']);

export const PATHWAY_COPY: Record<string, { title: string; body: string }> = {
  self_directed: {
    title: 'Self-Directed QHRT May Be Suitable for You',
    body: `Your responses indicate that you currently have the readiness, comfort and independence needed to begin the self-directed QHRT Wellness Program.

You remain free to:
- move at your own pace
- pause when needed
- use Preparation & Readiness activities
- take a break
- return later
- access personal resources at any time.`,
  },
  preparation: {
    title: 'Your Best Starting Point Is Preparation & Readiness',
    body: `Your responses suggest that spending some time building greater comfort, steadiness and readiness may help you feel better prepared for the main self-directed QHRT program.

Preparation & Readiness may include activities focused on:
- creating greater comfort
- becoming more present
- breathing and settling
- developing steadiness
- slowing down
- increasing your readiness for the program format
- recognizing when to pause
- learning how to reset
- identifying personal resources
- creating predictable routines
- strengthening self-trust
- returning to a comfortable baseline.

After completing Preparation & Readiness, repeat the Program Readiness & Suitability Check.`,
  },
  additional_time: {
    title: 'Additional Time or Personal Support May Be Helpful',
    body: `Your responses suggest that fully independent participation may not feel like the best starting point for you right now.

This does not mean that QHRT is unsuitable for you.

You may simply benefit from:
- additional preparation
- more time
- greater personal support
- increasing your readiness for the program format
- creating a more comfortable environment
- returning when independent participation feels easier.`,
  },
  practical: {
    title: 'A Few Practical Adjustments May Help',
    body: `Your responses suggest that creating more suitable time, privacy or surroundings may help you get more from your QHRT experience.

Before beginning, consider arranging:
- enough uninterrupted time
- a comfortable setting
- greater privacy
- fewer distractions
- a time when you do not feel rushed.`,
  },
  immediate: {
    title: 'Please Seek Immediate Outside Assistance',
    body: `Self-directed QHRT is not designed for emergency or crisis situations.

Please seek immediate assistance before continuing with the QHRT Wellness Program.

For users in the United States:
- Call 911 if you or someone else is in immediate danger or requires emergency assistance.
- Call or text 988 for immediate crisis support through the 988 Suicide & Crisis Lifeline.

Responses submitted through this website are not monitored in real time.`,
  },
};

export function pathwayCopy(key: string): { title: string; body: string } {
  return (
    PATHWAY_COPY[key] ?? {
      title: 'Your recommended starting point',
      body: 'This recommendation reflects your responses today.',
    }
  );
}
