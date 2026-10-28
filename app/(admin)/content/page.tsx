/**
 * Admin content hub — assessment engine (questions, scoring, workbook routing).
 */

'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Typography } from '@heroui/react';
import ContentSidebar from '@/components/admin/content/ContentSidebar';
import { Toast } from '@/components/admin/content/shared/Toast';
import {
  firstTabInSection,
  resolveContentRoute,
  type ContentSectionKey,
} from '@/components/admin/content/sidebarConfig';
import type { TabKey } from '@/components/admin/content/types';
import { AssessmentsTab } from '@/components/admin/content/assessments/AssessmentsTab';
import { WorkbooksTab } from '@/components/admin/content/assessments/WorkbooksTab';
import { ModulesTab } from '@/components/admin/content/modules/ModulesTab';

function CatalogPanel({
  tab,
  showToast,
}: {
  tab: TabKey;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  if (tab === 'workbooks') return <WorkbooksTab showToast={showToast} />;
  if (tab === 'modules') return <ModulesTab showToast={showToast} />;
  return <AssessmentsTab showToast={showToast} />;
}

function ContentPageBody() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
            onBackToSections={() => replaceQuery(null, null)}
            onGuidedAdd={() => undefined}
          />
        </div>
        <main className="min-w-0 flex-1">
          {activeTab ? <CatalogPanel tab={activeTab} showToast={showToast} /> : null}
        </main>
      </div>

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
