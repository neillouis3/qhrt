import type { Metadata } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import NavbarLayout from '@/components/nav/NavbarLayout';
import NavbarProvider from '@/components/nav/NavbarProvider';
import { Providers } from '@/app/providers';
import type { NavItem } from '@/components/nav/NavbarProvider';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'QHRT',
    template: '%s | QHRT',
  },
  description:
    'Self-guided wellness and resilience coaching — educational workbooks for stress, habits, and mindset. Not therapy or medical care.',
};

const adminLinks: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Users', path: '/users' },
  { name: 'Content', path: '/content' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Providers>
          <NavbarProvider value={{ adminLinks }}>
            <NavbarLayout>{children}</NavbarLayout>
          </NavbarProvider>
        </Providers>
      </body>
    </html>
  );
}
