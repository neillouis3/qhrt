'use client';

import { useState } from 'react';
import { Button, Typography } from '@heroui/react';
import {
  CONTENT_GROUPS,
  type ContentSectionKey,
} from '@/components/admin/content/sidebarConfig';
import type { TabKey } from '@/components/admin/content/types';

function SidebarLink({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      fullWidth
      size="sm"
      variant={active ? 'secondary' : 'ghost'}
      className="justify-start font-normal"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

export default function ContentSidebar({
  activeTab,
  onSelectTab,
}: {
  activeSection: ContentSectionKey | null;
  activeTab: TabKey | null;
  onSelectSection: (section: ContentSectionKey) => void;
  onSelectTab: (tab: TabKey) => void;
  onBackToSections: () => void;
  onGuidedAdd: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const group = CONTENT_GROUPS[0]!;
  const mobileLabel = group.items.find((item) => item.key === activeTab)?.label ?? group.label;

  const nav = (
    <nav aria-label={group.label} className="flex flex-col gap-1">
      {group.items.map((item) => (
        <SidebarLink
          key={item.key}
          label={item.label}
          active={item.key === activeTab}
          onPress={() => {
            onSelectTab(item.key);
            setMobileOpen(false);
          }}
        />
      ))}
    </nav>
  );

  return (
    <>
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <Typography type="body-xs" color="muted">
            {group.label}
          </Typography>
          <Button size="sm" variant="ghost" onPress={() => setMobileOpen(true)}>
            {mobileLabel}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-background px-5 py-6">
            <div className="mb-4 flex justify-end">
              <Button size="sm" variant="ghost" onPress={() => setMobileOpen(false)}>
                Close
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              <Typography type="body-xs" color="muted">
                {group.label}
              </Typography>
              {nav}
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="flex flex-col gap-4">
          <Typography type="body-xs" color="muted">
            {group.label}
          </Typography>
          <Typography type="body-xs" color="muted">
            Suggested order: Workbooks, then Assessments, then Modules.
          </Typography>
          {nav}
        </div>
      </aside>
    </>
  );
}
