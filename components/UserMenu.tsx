'use client';

import { useState, useRef, useEffect } from 'react';

export interface UserMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export interface UserMenuProps {
  items: UserMenuItem[];
  initialName?: string;
  initialEmail?: string;
}

export default function UserMenu({ items, initialName, initialEmail }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = initialName
    ? initialName.split('@')[0]
    : (initialEmail?.split('@')[0] ?? 'User');
  const safeDisplayName = displayName ?? 'User';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted/5 dark:hover:bg-navy-light/20 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium dark:bg-primary-light">
          {safeDisplayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-foreground dark:text-muted hidden sm:inline">{safeDisplayName}</span>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg py-1 z-50"
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2 text-sm transition-colors
                ${
                  item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-foreground hover:bg-muted/5 dark:hover:bg-navy-light/20'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
