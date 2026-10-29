'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Link as HeroLink, Typography } from '@heroui/react';
import Logo from '@/components/ui/Logo';

const footerLinks = [
  { name: 'About', path: '/about' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Testimonials', path: '/testimonials' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'Terms', path: '/terms' },
  { name: 'Contact', path: '/contact' },
] as const;

export default function SiteFooter({ homeHref = '/' }: { homeHref?: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <footer className="border-t border-border py-12 pb-24">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="flex items-center gap-2">
            <Logo className="h-7 w-7" decorative />
            <Typography type="body-sm">QHRT</Typography>
          </span>
          <nav className="flex gap-4">
            {footerLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <HeroLink
                  key={link.path}
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-xs ${isActive ? 'text-foreground' : 'text-muted'}`}
                >
                  {link.name}
                </HeroLink>
              );
            })}
          </nav>
        </div>
        {isHome ? (
          <Typography type="body-xs" color="muted">
            &copy; {new Date().getFullYear()} QHRT
          </Typography>
        ) : (
          <Link href={homeHref} className="text-xs text-muted transition-opacity hover:opacity-70">
            Back to home
          </Link>
        )}
      </div>
    </footer>
  );
}
