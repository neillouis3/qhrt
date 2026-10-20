import type { TabKey } from '@/components/admin/content/types';

export interface ContentNavItem {
  key: TabKey;
  label: string;
}

export interface ContentNavGroup {
  key: string;
  label: string;
  description: string;
  items: ContentNavItem[];
}

export const CONTENT_GROUPS: ContentNavGroup[] = [
  {
    key: 'assessment-engine',
    label: 'Assessment Engine',
    description:
      'Build self-check assessments: questions, scoring, and which workbooks each result links to.',
    items: [
      { key: 'assessment-builder', label: 'Assessments' },
      { key: 'workbooks', label: 'Workbooks' },
    ],
  },
  {
    key: 'condition-library',
    label: 'Condition Library',
    description:
      'Organize focus topics, interest questionnaires, habit trackers, session assignments, and content mappings.',
    items: [
      { key: 'categories', label: 'Categories' },
      { key: 'conditions', label: 'Conditions' },
      { key: 'symptoms', label: 'Symptoms' },
      { key: 'assessments', label: 'Condition Questions' },
      { key: 'metrics', label: 'Progress Metrics' },
      { key: 'mappings', label: 'QHRT Mappings' },
      { key: 'sessions', label: 'Session Assignments' },
      { key: 'seed', label: 'Seed Data' },
    ],
  },
  {
    key: 'knowledge-models',
    label: 'Knowledge Models',
    description:
      'Define guided session models, evidence dimensions, prompts, and branching or completion rules.',
    items: [
      { key: 'knowledge-models', label: 'Models' },
      { key: 'evidence-dimensions', label: 'Evidence Dimensions' },
      { key: 'prompts', label: 'Prompts' },
      { key: 'branch-rules', label: 'Branch Rules' },
      { key: 'completion-rules', label: 'Completion Rules' },
    ],
  },
  {
    key: 'therapeutic-engine',
    label: 'Therapeutic Engine',
    description:
      'Configure phase templates, functional domains, programs, and active therapeutic sessions.',
    items: [
      { key: 'phase-templates', label: 'Phase Templates' },
      { key: 'functional-domains', label: 'Functional Domains' },
      { key: 'aee-catalog', label: 'AEE Catalog' },
      { key: 'personal-programs', label: 'Personal Programs' },
      { key: 'therapeutic-engines', label: 'Active Sessions' },
    ],
  },
];

const TAB_KEYS = new Set<TabKey>(CONTENT_GROUPS.flatMap((group) => group.items.map((item) => item.key)));

export function isTabKey(value: string | null): value is TabKey {
  return value != null && TAB_KEYS.has(value as TabKey);
}

export type ContentSectionKey = (typeof CONTENT_GROUPS)[number]['key'];

const SECTION_KEYS = new Set<string>(CONTENT_GROUPS.map((group) => group.key));

export function isSectionKey(value: string | null): value is ContentSectionKey {
  return value != null && SECTION_KEYS.has(value);
}

export function groupForTab(tab: TabKey): ContentNavGroup {
  return CONTENT_GROUPS.find((group) => group.items.some((item) => item.key === tab)) ?? CONTENT_GROUPS[0]!;
}

export function groupForSection(section: ContentSectionKey): ContentNavGroup {
  return CONTENT_GROUPS.find((group) => group.key === section) ?? CONTENT_GROUPS[0]!;
}

export function tabBelongsToSection(tab: TabKey, section: ContentSectionKey): boolean {
  return groupForSection(section).items.some((item) => item.key === tab);
}

export function firstTabInSection(section: ContentSectionKey): TabKey {
  return groupForSection(section).items[0]!.key;
}

export function contentHref(section: ContentSectionKey, tab: TabKey): string {
  return `/content?section=${section}&tab=${tab}`;
}

export function resolveContentRoute(searchParams: {
  get(name: string): string | null;
}): { section: ContentSectionKey | null; tab: TabKey | null } {
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');

  let section: ContentSectionKey | null = isSectionKey(sectionParam) ? sectionParam : null;

  if (!section && isTabKey(tabParam)) {
    section = groupForTab(tabParam).key;
  }

  if (!section) {
    return { section: null, tab: null };
  }

  const tab =
    isTabKey(tabParam) && tabBelongsToSection(tabParam, section)
      ? tabParam
      : firstTabInSection(section);

  return { section, tab };
}
