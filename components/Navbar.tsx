'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useNavigationGuard from '@/hooks/useNavigationGuard';
import type { NavItem } from '@/components/NavbarContext';

export type { NavItem };

export interface NavbarProps {
  logo?: string;
  logoHref?: string;
  links: NavItem[];
  rightContent?: React.ReactNode;
}

export default function Navbar({
  logo = 'QHRT',
  logoHref = '/',
  links,
  rightContent,
}: NavbarProps) {
  const pathname = usePathname();
  const navigate = useNavigationGuard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-navy flex translate-z-0 z-1000 flex-row justify-between items-center w-full ring-1 ring-border px-6 py-3 sticky top-0">
      <div className="flex items-center gap-6">
        <Link
          href={logoHref}
          onClick={(e) => {
            if (!navigate(logoHref)) e.preventDefault();
          }}
          className="text-lg font-bold text-navy dark:text-white hover:opacity-80 transition-opacity"
        >
          {logo}
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  if (!navigate(link.path)) e.preventDefault();
                  setMobileMenuOpen(false);
                }}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-accent-lighter dark:bg-primary/10 text-primary dark:text-primary-light'
                      : 'text-muted hover:text-navy dark:hover:text-white hover:bg-muted/5 dark:hover:bg-navy-light/20'
                  }
                `}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">{rightContent}</div>

      {/* Mobile hamburger button */}
      {links.length > 0 && (
        <div className="sm:hidden ml-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-muted hover:text-foreground hover:bg-muted/5 transition-colors"
            aria-label="Toggle menu"
            aria-haspopup="menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          {mobileMenuOpen && (
            <div
              role="menu"
              aria-label="Navigation"
              className="absolute right-6 left-auto mt-2 w-48 rounded-lg border border-border bg-background shadow-lg py-1 z-50"
            >
              {links.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    role="menuitem"
                    onClick={(e) => {
                      if (!navigate(link.path)) e.preventDefault();
                      setMobileMenuOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-accent-lighter dark:bg-primary/10 text-primary dark:text-primary-light'
                        : 'text-foreground hover:bg-muted/5 dark:hover:bg-navy-light/20'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
