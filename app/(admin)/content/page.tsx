/**
 * Admin content hub.
 * Page → section (library / models / engine) → catalog → table.
 */

'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import ContentSidebar from '@/components/admin/content/ContentSidebar';
import { ContentWizard } from '@/components/admin/content/ContentWizard';
import { Toast } from '@/components/admin/content/shared/Toast';
import {
  CONTENT_GROUPS,
  firstTabInSection,
  resolveContentRoute,
  type ContentSectionKey,
} from '@/components/admin/content/sidebarConfig';
import type { TabKey } from '@/components/admin/content/types';

import { CategoriesTab } from '@/components/admin/content/CategoriesTab';
import { ConditionsTab } from '@/components/admin/content/ConditionsTab';
import { ChildResourceTab } from '@/components/admin/content/ChildResourceTab';
import { QHRTMappingsTab } from '@/components/admin/content/QHRTMappingsTab';
import { SessionAssignmentsTab } from '@/components/admin/content/SessionAssignmentsTab';
import { SeedDataTab } from '@/components/admin/content/SeedDataTab';
import { KnowledgeModelsTab } from '@/components/admin/content/KnowledgeModelsTab';
import { EvidenceDimensionsTab } from '@/components/admin/content/EvidenceDimensionsTab';
import { PromptsTab } from '@/components/admin/content/PromptsTab';
import { BranchRulesTab } from '@/components/admin/content/BranchRulesTab';
import { CompletionRulesTab } from '@/components/admin/content/CompletionRulesTab';
import { PhaseTemplatesTab } from '@/components/admin/content/PhaseTemplatesTab';
import { FunctionalDomainsTab } from '@/components/admin/content/FunctionalDomainsTab';
import { AeeCatalogTab } from '@/components/admin/content/AeeCatalogTab';
import { PersonalProgramsTab } from '@/components/admin/content/PersonalProgramsTab';
import { TherapeuticEnginesTab } from '@/components/admin/content/TherapeuticEnginesTab';
import { AssessmentsTab } from '@/components/admin/content/assessments/AssessmentsTab';
import { WorkbooksTab } from '@/components/admin/content/assessments/WorkbooksTab';

function CatalogPanel({
  tab,
  showToast,
}: {
  tab: TabKey;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  switch (tab) {
    case 'assessment-builder':
      return <AssessmentsTab showToast={showToast} />;
    case 'workbooks':
      return <WorkbooksTab showToast={showToast} />;
    case 'categories':
      return <CategoriesTab showToast={showToast} />;
    case 'conditions':
      return <ConditionsTab showToast={showToast} />;
    case 'symptoms':
      return (
        <ChildResourceTab
          title="Symptoms"
          endpoint="/api/admin/symptoms"
          dataKey="symptoms"
          nameField="symptom_name"
          namePlaceholder="Symptom name"
          showToast={showToast}
        />
      );
    case 'assessments':
      return (
        <ChildResourceTab
          title="Assessment Questions"
          endpoint="/api/admin/assessment-questions"
          dataKey="questions"
          nameField="question_text"
          namePlaceholder="Question text"
          extraFields={[
            { key: 'scale_type', label: 'Scale Type', placeholder: 'e.g. 0-10' },
            { key: 'minimum_value', label: 'Min Value', type: 'number', placeholder: '0' },
            { key: 'maximum_value', label: 'Max Value', type: 'number', placeholder: '10' },
          ]}
          showToast={showToast}
        />
      );
    case 'metrics':
      return (
        <ChildResourceTab
          title="Progress Metrics"
          endpoint="/api/admin/progress-metrics"
          dataKey="metrics"
          nameField="metric_name"
          namePlaceholder="Metric name"
          extraFields={[
            {
              key: 'metric_description',
              label: 'Description',
              type: 'textarea',
              placeholder: 'What does this measure?',
            },
            { key: 'scale_type', label: 'Scale Type', placeholder: 'e.g. 0-10' },
            { key: 'minimum_value', label: 'Min Value', type: 'number', placeholder: '0' },
            { key: 'maximum_value', label: 'Max Value', type: 'number', placeholder: '10' },
          ]}
          showToast={showToast}
        />
      );
    case 'mappings':
      return <QHRTMappingsTab showToast={showToast} />;
    case 'sessions':
      return <SessionAssignmentsTab showToast={showToast} />;
    case 'seed':
      return <SeedDataTab showToast={showToast} />;
    case 'knowledge-models':
      return <KnowledgeModelsTab showToast={showToast} />;
    case 'evidence-dimensions':
      return <EvidenceDimensionsTab showToast={showToast} />;
    case 'prompts':
      return <PromptsTab showToast={showToast} />;
    case 'branch-rules':
      return <BranchRulesTab showToast={showToast} />;
    case 'completion-rules':
      return <CompletionRulesTab showToast={showToast} />;
    case 'phase-templates':
      return <PhaseTemplatesTab showToast={showToast} />;
    case 'functional-domains':
      return <FunctionalDomainsTab showToast={showToast} />;
    case 'aee-catalog':
      return <AeeCatalogTab showToast={showToast} />;
    case 'personal-programs':
      return <PersonalProgramsTab showToast={showToast} />;
    case 'therapeutic-engines':
      return <TherapeuticEnginesTab showToast={showToast} />;
  }
}

function ContentLibraryOverview({
  onSelectSection,
  onCreateContent,
}: {
  onSelectSection: (section: ContentSectionKey) => void;
  onCreateContent: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography type="h4" weight="normal">
          Content libraries
        </Typography>
        <Typography type="body-sm" color="muted">
          Pick a library to manage educational content and routing rules, or create a new workbook path step by step.
        </Typography>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CONTENT_GROUPS.map((group) => (
          <AppCard key={group.key} className="flex h-full flex-col gap-4 p-5">
            <div className="flex flex-col gap-2">
              <AppCard.Title className="font-normal tracking-tight">{group.label}</AppCard.Title>
              <AppCard.Description>{group.description}</AppCard.Description>
            </div>
            <Typography type="body-xs" color="muted">
              {group.items.map((item) => item.label).join(' · ')}
            </Typography>
            <Button
              size="sm"
              variant="outline"
              className="mt-auto w-fit font-normal"
              onPress={() => onSelectSection(group.key as ContentSectionKey)}
            >
              Open {group.label}
            </Button>
          </AppCard>
        ))}
      </div>
      <AppCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <AppCard.Title className="font-normal tracking-tight">New workbook path</AppCard.Title>
          <AppCard.Description>
            Walk through titles, prompts, and modules — coaching content, not clinical protocols.
          </AppCard.Description>
        </div>
        <Button size="sm" variant="primary" className="shrink-0 font-normal" onPress={onCreateContent}>
          Create content
        </Button>
      </AppCard>
    </div>
  );
}

function ContentPageBody() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { section: activeSection, tab: activeTab } = useMemo(
    () => resolveContentRoute(searchParams),
    [searchParams]
  );

  const replaceQuery = useCallback(
    (section: ContentSectionKey | null, tab: TabKey | null) => {
      if (!section || !tab) {
        router.replace(pathname, { scroll: false });
        return;
      }
      const params = new URLSearchParams();
      params.set('section', section);
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  const setSection = useCallback(
    (section: ContentSectionKey) => {
      replaceQuery(section, firstTabInSection(section));
    },
    [replaceQuery]
  );

  const setTab = useCallback(
    (tab: TabKey) => {
      if (!activeSection) return;
      replaceQuery(activeSection, tab);
    },
    [activeSection, replaceQuery]
  );

  const backToSections = useCallback(() => {
    replaceQuery(null, null);
  }, [replaceQuery]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <div className="flex w-full flex-1 flex-col gap-8 px-6 py-12 lg:flex-row lg:items-start lg:gap-10">
        <div className="shrink-0 lg:sticky lg:top-[calc(var(--app-navbar-height)+1.5rem)] lg:self-start">
          <ContentSidebar
            activeSection={activeSection}
            activeTab={activeTab}
            onSelectSection={setSection}
            onSelectTab={setTab}
            onBackToSections={backToSections}
            onGuidedAdd={() => setWizardOpen(true)}
          />
        </div>
        <main className="min-w-0 flex-1">
          {activeSection && activeTab ? (
            <CatalogPanel tab={activeTab} showToast={showToast} />
          ) : (
            <ContentLibraryOverview
              onSelectSection={setSection}
              onCreateContent={() => setWizardOpen(true)}
            />
          )}
        </main>
      </div>

      <ContentWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={(message) => showToast(message, 'success')}
        onError={(message) => showToast(message, 'error')}
      />

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col bg-background px-6 py-12">
          <Typography type="body-sm" color="muted">
            Loading…
          </Typography>
        </div>
      }
    >
      <ContentPageBody />
    </Suspense>
  );
}
