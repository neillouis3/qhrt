import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavbarLayout from '@/components/NavbarLayout';
import NavbarProvider, { useNavbarLinks } from '@/components/NavbarProvider';
import { NavItem } from '@/components/NavbarContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
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
  description: 'QHRT application',
};

const adminLinks: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Users', path: '/users' },
  { name: 'Content', path: '/content' },
  { name: 'Analytics', path: '/analytics' },
];

const userLinks: NavItem[] = [
  { name: 'Home', path: '/home' },
  { name: 'Sessions', path: '/sessions' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavbarProvider value={{ adminLinks, userLinks }}>
          <NavbarLayout>{children}</NavbarLayout>
        </NavbarProvider>
      </body>
    </html>
  );
}
