/**
 * Admin Content Management Hub
 * Sidebar navigation with grouped sections (Condition Library, Knowledge Models,
 * Therapeutic Engine). Each tab is a self-contained component under
 * components/admin/content/. Modal-based editing for all forms.
 */

'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Toast } from '@/components/admin/content/shared/Toast';
import { SIDEBAR_GROUPS, TAB_LABELS } from '@/components/admin/content/sidebarConfig';
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

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('categories');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Find current group label for display
  const currentGroupLabel = SIDEBAR_GROUPS.find((g) =>
    g.items.some((i) => i.key === activeTab)
  )?.label;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-4rem)]">
      {/* Top gradient bar */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-accent to-primary-light" />

      {/* Sidebar + main content row */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Sidebar */}
        <AdminSidebar
          groups={SIDEBAR_GROUPS}
          activeKey={activeTab}
          onNavigate={(key) => setActiveTab(key as TabKey)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header with toggle (mobile) and breadcrumb */}
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted/5 transition-colors lg:hidden"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <nav className="text-sm text-muted">
              <span>Content</span>
              {currentGroupLabel && (
                <>
                  <span className="mx-1">/</span>
                  <span>{currentGroupLabel}</span>
                </>
              )}
              <span className="mx-1">/</span>
              <span className="font-medium text-foreground">{TAB_LABELS[activeTab]}</span>
            </nav>
          </div>

          {/* Render active tab */}
          <div className="mt-4">
            {activeTab === 'categories' && <CategoriesTab showToast={showToast} />}
            {activeTab === 'conditions' && <ConditionsTab showToast={showToast} />}
            {activeTab === 'symptoms' && (
              <ChildResourceTab
                title="Symptoms"
                endpoint="/api/admin/symptoms"
                dataKey="symptoms"
                nameField="symptom_name"
                namePlaceholder="Symptom name"
                showToast={showToast}
              />
            )}
            {activeTab === 'assessments' && (
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
            )}
            {activeTab === 'metrics' && (
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
            )}
            {activeTab === 'mappings' && <QHRTMappingsTab showToast={showToast} />}
            {activeTab === 'sessions' && <SessionAssignmentsTab showToast={showToast} />}
            {activeTab === 'seed' && <SeedDataTab showToast={showToast} />}
            {activeTab === 'knowledge-models' && <KnowledgeModelsTab showToast={showToast} />}
            {activeTab === 'evidence-dimensions' && <EvidenceDimensionsTab showToast={showToast} />}
            {activeTab === 'prompts' && <PromptsTab showToast={showToast} />}
            {activeTab === 'branch-rules' && <BranchRulesTab showToast={showToast} />}
            {activeTab === 'completion-rules' && <CompletionRulesTab showToast={showToast} />}
            {activeTab === 'phase-templates' && <PhaseTemplatesTab showToast={showToast} />}
            {activeTab === 'functional-domains' && <FunctionalDomainsTab showToast={showToast} />}
            {activeTab === 'aee-catalog' && <AeeCatalogTab showToast={showToast} />}
            {activeTab === 'personal-programs' && <PersonalProgramsTab showToast={showToast} />}
            {activeTab === 'therapeutic-engines' && <TherapeuticEnginesTab showToast={showToast} />}
          </div>

          {/* Toast */}
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </main>
      </div>
    </div>
  );
}
