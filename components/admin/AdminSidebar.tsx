/**
 * Admin Content Sidebar - Grouped navigation for content management
 */

'use client';

import { useState } from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activeKey: string;
  onNavigate: (key: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({
  groups,
  activeKey,
  onNavigate,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.key, false]))
  );

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-background dark:bg-navy border-r border-border transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:w-64 lg:translate-x-0'
        }`}
      >
        {/* Toggle button (mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <span className="text-sm font-semibold text-muted uppercase tracking-wider">
            Navigation
          </span>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted/5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {groups.map((group) => (
            <div key={group.key} className="mb-3">
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    !collapsedGroups[group.key] ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {group.label}
              </button>

              {!collapsedGroups[group.key] && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeKey === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          onNavigate(item.key);
                          // Auto-close on mobile after selection
                          if (window.innerWidth < 1024) onToggle();
                        }}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted hover:text-foreground hover:bg-muted/5'
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
