import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DOMAIN_QUESTIONS,
  OVERALL_MAX_POINTS,
  QUESTIONS,
  SCORED_QUESTION_COUNT,
  assignPathway,
  classifyDomain,
  classifyOverall,
  nextAssessmentSequence,
  preparationFocus,
  scoreReadiness,
  type DomainClassification,
  type PathwayMetrics,
} from '../lib/pathwayScoring.ts';

function ready(overrides: Record<string, string> = {}) {
  const answers: Record<string, string> = {};
  for (const code of ['IR1', 'IR2', 'IR3', 'IR4', 'IR5']) answers[code] = 'no';
  for (let index = 1; index <= 10; index += 1) answers[`R${index}`] = 'yes';
  for (let index = 1; index <= 16; index += 1) answers[`S${index}`] = 'yes';
  return { ...answers, ...overrides };
}

function metrics(partial: Partial<PathwayMetrics> & Pick<PathwayMetrics, 'overall'>): PathwayMetrics {
  const readyDomains: DomainClassification[] = [
    'DOMAIN_READY',
    'DOMAIN_READY',
    'DOMAIN_READY',
    'DOMAIN_READY',
    'DOMAIN_READY',
    'DOMAIN_READY',
  ];
  return {
    preparationFlag: false,
    s16: 3,
    criticalZeroCount: 0,
    criticalOneCount: 0,
    criticalGatePassed: true,
    domains: readyDomains,
    ...partial,
  };
}

test('question ids stay stable and each scored question counts once', () => {
  const ids = QUESTIONS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice(0, 5), ['IR1', 'IR2', 'IR3', 'IR4', 'IR5']);
  const scored = QUESTIONS.filter((item) => item.scale !== 'immediate');
  assert.equal(scored.length, SCORED_QUESTION_COUNT);
  assert.equal(scored.length * 3, OVERALL_MAX_POINTS);
  for (const code of ['S3', 'S4', 'S9', 'S12']) {
    const item = QUESTIONS.find((question) => question.id === code);
    assert.ok(item);
    assert.equal(item.domains.length, 2);
  }
  assert.equal(QUESTIONS.filter((item) => item.critical).length, 9);
});

test('1 immediate override stops before any score', () => {
  for (const code of ['IR1', 'IR2', 'IR3', 'IR4']) {
    const result = scoreReadiness({ [code]: 'yes' });
    assert.equal(result.pathway, 'IMMEDIATE_OUTSIDE_ASSISTANCE');
    assert.equal(result.status, 'EXITED_IMMEDIATE_ASSISTANCE');
    assert.equal(result.trigger, 'immediate_override');
    assert.equal(result.overallScore, null);
    assert.equal(result.criticalZeroCount, null);
    assert.equal(result.domains[0]?.percentage, null);
    assert.equal(result.responses.some((item) => item.numericScore !== null), false);
  }
});

test('2 fully ready assigns self-directed', () => {
  const result = scoreReadiness(ready());
  assert.equal(result.pathway, 'SELF_DIRECTED_READY');
  assert.equal(result.trigger, 'self_directed_ready');
  assert.equal(result.overallPoints, 78);
  assert.equal(result.overallScore, 100);
  assert.equal(result.preparationFlag, false);
  assert.equal(result.criticalGatePassed, true);
  assert.ok(result.domains.every((domain) => domain.classification === 'DOMAIN_READY'));
});

test('3 IR5 yes keeps preparation even with a high overall score', () => {
  const result = scoreReadiness(ready({ IR5: 'yes' }));
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'preparation_flag');
  assert.equal(result.preparationFlag, true);
  assert.equal(result.overallScore, 100);
});

test('4 IR5 unsure assigns preparation', () => {
  const result = scoreReadiness(ready({ IR5: 'unsure' }));
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'preparation_flag');
});

test('5 one critical score of 1 assigns preparation', () => {
  const result = scoreReadiness(ready({ R1: 'sometimes' }));
  assert.equal(result.criticalOneCount, 1);
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'critical_ones');
});

test('6 one critical zero, not S16, assigns preparation', () => {
  const result = scoreReadiness(ready({ R1: 'not_yet' }));
  assert.equal(result.criticalZeroCount, 1);
  assert.notEqual(result.responses.find((item) => item.questionId === 'S16')?.numericScore, 0);
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'one_critical_zero');
});

test('7 two critical zeros assign additional time', () => {
  const result = scoreReadiness(ready({ R1: 'not_yet', R2: 'not_yet' }));
  assert.equal(result.criticalZeroCount, 2);
  assert.equal(result.pathway, 'ADDITIONAL_TIME_SUPPORT');
  assert.equal(result.trigger, 'critical_zeros');
});

test('8 S16 zero assigns additional time ahead of the overall score', () => {
  const result = scoreReadiness(ready({ S16: 'not_right_now' }));
  assert.equal(result.pathway, 'ADDITIONAL_TIME_SUPPORT');
  assert.equal(result.trigger, 'voluntary_participation');
  assert.ok((result.overallScore ?? 0) > 80);
});

test('9 one opening domain below 60 assigns preparation', () => {
  const answers = ready();
  for (const code of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10']) answers[code] = 'mostly';
  for (let index = 1; index <= 16; index += 1) answers[`S${index}`] = 'mostly';
  answers.S7 = 'not_right_now';
  const result = scoreReadiness(answers);
  assert.equal(result.domains[0]?.classification, 'DOMAIN_NOT_READY_YET');
  assert.equal(result.domains.filter((domain, index) => index < 5 && domain.classification === 'DOMAIN_NOT_READY_YET').length, 1);
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'one_domain_not_ready');
});

test('10 two opening domains below 60 assign additional time', () => {
  const result = scoreReadiness(
    ready({
      R1: 'mostly',
      R2: 'mostly',
      R10: 'mostly',
      S5: 'mostly',
      S7: 'not_right_now',
      S8: 'mostly',
      S12: 'mostly',
      R6: 'not_yet',
      R7: 'not_yet',
      S13: 'not_right_now',
    })
  );
  const notReady = result.domains.filter((domain, index) => index < 5 && domain.classification === 'DOMAIN_NOT_READY_YET');
  assert.equal(notReady.length, 2);
  assert.equal(result.pathway, 'ADDITIONAL_TIME_SUPPORT');
  assert.equal(result.trigger, 'domains_not_ready');
});

test('11 overall 59.999 assigns additional time', () => {
  const result = assignPathway(metrics({ overall: 59.999 }));
  assert.equal(result.pathway, 'ADDITIONAL_TIME_SUPPORT');
  assert.equal(result.trigger, 'overall_below_60');
  assert.equal(classifyOverall(59.999), 'ADDITIONAL_TIME_SUPPORT_RANGE');
});

test('12 overall 60 assigns preparation when no higher rule applies', () => {
  const result = assignPathway(
    metrics({
      overall: 60,
      domains: [
        'DOMAIN_PREPARATION',
        'DOMAIN_PREPARATION',
        'DOMAIN_PREPARATION',
        'DOMAIN_PREPARATION',
        'DOMAIN_PREPARATION',
        'DOMAIN_PREPARATION',
      ],
    })
  );
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(classifyOverall(60), 'PREPARATION_RANGE');
});

test('13 overall 79.999 assigns preparation', () => {
  const result = assignPathway(metrics({ overall: 79.999 }));
  assert.equal(result.pathway, 'PREPARATION_READINESS');
  assert.equal(result.trigger, 'overall_below_80');
});

test('14 overall 80 assigns self-directed when every requirement is met', () => {
  const result = assignPathway(metrics({ overall: 80 }));
  assert.equal(result.pathway, 'SELF_DIRECTED_READY');
  assert.equal(classifyOverall(80), 'STRONG_OVERALL_READINESS');
});

test('15 domain 80 is ready', () => {
  assert.equal(classifyDomain(80, 1), 'DOMAIN_READY');
  assert.equal(classifyDomain(80, 6), 'DOMAIN_READY');
});

test('16 domain 79.999 is preparation', () => {
  assert.equal(classifyDomain(79.999, 1), 'DOMAIN_PREPARATION');
});

test('17 domain 60 is preparation', () => {
  assert.equal(classifyDomain(60, 4), 'DOMAIN_PREPARATION');
  assert.equal(classifyDomain(60, 6), 'DOMAIN_PREPARATION');
});

test('18 opening domain 59.999 is not ready yet', () => {
  assert.equal(classifyDomain(59.999, 1), 'DOMAIN_NOT_READY_YET');
  assert.equal(classifyDomain(59.999, 5), 'DOMAIN_NOT_READY_YET');
});

test('19 domain 6 at 59.999 is a practical barrier', () => {
  assert.equal(classifyDomain(59.999, 6), 'DOMAIN_PRACTICAL_BARRIER');
});

test('20 practical barrier only assigns practical preparation', () => {
  const result = scoreReadiness(
    ready({ R8: 'not_yet', R9: 'not_yet', S14: 'not_right_now', S15: 'not_right_now' })
  );
  assert.equal(result.domains[5]?.classification, 'DOMAIN_PRACTICAL_BARRIER');
  assert.ok(result.domains.slice(0, 5).every((domain) => domain.classification === 'DOMAIN_READY'));
  assert.equal(result.criticalGatePassed, true);
  assert.equal(result.preparationFlag, false);
  assert.equal(result.pathway, 'PRACTICAL_PREPARATION');
  assert.equal(result.trigger, 'practical_barrier');
});

test('21 overlapping questions affect each domain and the overall score once', () => {
  const base = scoreReadiness(ready());
  const lowered = scoreReadiness(ready({ S3: 'mostly' }));
  assert.equal((base.domains[2]?.points ?? 0) - (lowered.domains[2]?.points ?? 0), 1);
  assert.equal((base.domains[3]?.points ?? 0) - (lowered.domains[3]?.points ?? 0), 1);
  assert.equal((base.overallPoints ?? 0) - (lowered.overallPoints ?? 0), 1);
  assert.equal(base.overallPoints, OVERALL_MAX_POINTS);
  assert.equal(DOMAIN_QUESTIONS[3]?.ids.includes('S3'), true);
  assert.equal(DOMAIN_QUESTIONS[4]?.ids.includes('S3'), true);
});

test('22 a missing required answer stays incomplete and is not scored as zero', () => {
  const answers = ready();
  delete answers.S1;
  const result = scoreReadiness(answers);
  assert.equal(result.status, 'INCOMPLETE');
  assert.equal(result.pathway, null);
  assert.equal(result.overallScore, null);
  assert.equal(result.overallPoints, null);
  assert.equal(result.domains.every((domain) => domain.points === null), true);
});

test('23 a new attempt takes the next sequence and leaves the earlier one in place', () => {
  assert.equal(nextAssessmentSequence([]), 1);
  assert.equal(nextAssessmentSequence([1]), 2);
  assert.equal(nextAssessmentSequence([1, 3]), 4);
  const first = scoreReadiness(ready());
  const second = scoreReadiness(ready({ IR5: 'yes' }));
  assert.notEqual(first.pathway, second.pathway);
  assert.equal(first.pathway, 'SELF_DIRECTED_READY');
  assert.equal(first.scoringRuleVersion, second.scoringRuleVersion);
});

test('preparation focus names activities without scores', () => {
  const flagged = scoreReadiness(ready({ IR5: 'yes' }));
  assert.deepEqual(preparationFocus(flagged), []);
  const practicalGap = scoreReadiness(ready({ R8: 'mostly', R9: 'mostly', S14: 'mostly', S15: 'mostly' }));
  const focus = preparationFocus(practicalGap);
  assert.equal(practicalGap.pathway, 'PREPARATION_READINESS');
  assert.equal(focus.length, 1);
  assert.equal(focus[0]?.title, 'Practical Readiness');
  assert.equal(JSON.stringify(focus).includes('%'), false);
  assert.equal(JSON.stringify(focus).match(/\d/), null);
});

test('storage keys score the same pathway as question codes', () => {
  const byCode = scoreReadiness(ready({ IR5: 'yes' }));
  const byStorage = scoreReadiness({
    s1: 'no',
    s2: 'no',
    s3: 'no',
    s4: 'no',
    s5: 'yes',
    ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`i${index + 1}`, 'yes'])),
    ...Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`u${index + 1}`, 'yes'])),
  });
  assert.equal(byStorage.pathway, byCode.pathway);
  assert.equal(byStorage.appPathway, 'preparation');
});
