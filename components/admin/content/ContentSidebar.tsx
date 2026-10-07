'use client';

import { useState } from 'react';
import { Button, Typography } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import {
  CONTENT_GROUPS,
  type ContentSectionKey,
} from '@/components/admin/content/sidebarConfig';
import type { TabKey } from '@/components/admin/content/types';

function AllLibrariesBackButton({
  className = '',
  onPress,
}: {
  className?: string;
  onPress: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={`inline-flex w-fit items-center gap-1.5 px-2 font-normal ${className}`}
      onPress={onPress}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} aria-hidden />
      All libraries
    </Button>
  );
}

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
  activeSection,
  activeTab,
  onSelectSection,
  onSelectTab,
  onBackToSections,
  onGuidedAdd,
}: {
  activeSection: ContentSectionKey | null;
  activeTab: TabKey | null;
  onSelectSection: (section: ContentSectionKey) => void;
  onSelectTab: (tab: TabKey) => void;
  onBackToSections: () => void;
  onGuidedAdd: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const drilledGroup = activeSection
    ? CONTENT_GROUPS.find((group) => group.key === activeSection)
    : null;

  const rootNav = (
    <div className="flex flex-col gap-3">
      <Button size="sm" variant="primary" className="font-normal" onPress={onGuidedAdd}>
        Create content
      </Button>
      <nav aria-label="Content libraries" className="flex flex-col gap-1">
        {CONTENT_GROUPS.map((group) => (
          <SidebarLink
            key={group.key}
            label={group.label}
            active={false}
            onPress={() => {
              onSelectSection(group.key);
              setMobileOpen(false);
            }}
          />
        ))}
      </nav>
    </div>
  );

  const sectionNav = drilledGroup ? (
    <nav aria-label={drilledGroup.label} className="flex flex-col gap-1">
      {drilledGroup.items.map((item) => (
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
  ) : null;

  const desktopSidebar = (
    <aside className="hidden w-56 shrink-0 lg:block">
      {activeSection && drilledGroup ? (
        <div className="flex flex-col gap-4">
          <AllLibrariesBackButton onPress={onBackToSections} />
          <Typography type="body-xs" color="muted">
            {drilledGroup.label}
          </Typography>
          {sectionNav}
        </div>
      ) : (
        rootNav
      )}
    </aside>
  );

  const mobileLabel = drilledGroup
    ? drilledGroup.items.find((item) => item.key === activeTab)?.label ?? drilledGroup.label
    : 'Choose library';

  return (
    <>
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <Typography type="body-xs" color="muted">
            {drilledGroup ? drilledGroup.label : 'Libraries'}
          </Typography>
          <Button size="sm" variant="ghost" onPress={() => setMobileOpen(true)}>
            {mobileLabel}
          </Button>
        </div>
        {activeSection ? (
          <AllLibrariesBackButton className="px-0" onPress={onBackToSections} />
        ) : null}
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
            {activeSection && drilledGroup ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                <AllLibrariesBackButton
                  className="px-0"
                  onPress={() => {
                    onBackToSections();
                    setMobileOpen(false);
                  }}
                />
                <Typography type="body-xs" color="muted">
                  {drilledGroup.label}
                </Typography>
                {sectionNav}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">{rootNav}</div>
            )}
          </aside>
        </div>
      ) : null}

      {desktopSidebar}
    </>
  );
}
