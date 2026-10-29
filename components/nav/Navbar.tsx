'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, buttonVariants } from '@heroui/react';
import useNavigationGuard from '@/hooks/useNavigationGuard';
import type { NavItem } from '@/components/nav/NavbarProvider';
import Logo from '@/components/ui/Logo';

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
  const isHome = pathname === '/home';

  return (
    <header
      className={`sticky top-0 z-40 flex h-[var(--app-navbar-height)] w-full translate-z-0 flex-row items-center justify-between px-6 ${
        isHome
          ? 'border-b border-border/15 bg-transparent backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/[0.03] dark:supports-[backdrop-filter]:bg-black/[0.08]'
          : 'border-b border-transparent bg-background/55 backdrop-blur-md dark:bg-background/45'
      }`}
    >
      <div className="flex items-center gap-6">
        <Link
          href={logoHref}
          aria-label={logo}
          onClick={(e) => {
            if (!navigate(logoHref)) e.preventDefault();
          }}
          className="flex items-center text-foreground hover:opacity-70 transition-opacity"
        >
          <Logo decorative />
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const isActive = link.path.includes('#')
              ? false
              : pathname === link.path || pathname.startsWith(`${link.path}/`);
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  if (!navigate(link.path)) e.preventDefault();
                  setMobileMenuOpen(false);
                }}
                className={buttonVariants({
                  size: 'sm',
                  variant: isActive ? 'secondary' : 'ghost',
                })}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        {links.length > 0 && (
          <div className="relative lg:hidden">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Toggle menu"
              aria-haspopup="menu"
              aria-expanded={mobileMenuOpen}
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
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
            </Button>
            {mobileMenuOpen && (
              <div
                role="menu"
                aria-label="Navigation"
                className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-background py-1 shadow-lg z-50"
              >
                {links.map((link) => {
                  const isActive = link.path.includes('#')
              ? false
              : pathname === link.path || pathname.startsWith(`${link.path}/`);
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
                          ? 'bg-default/50 text-foreground'
                          : 'text-foreground hover:bg-muted/5'
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
      </div>
    </header>
  );
}
