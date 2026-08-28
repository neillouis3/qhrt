import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import NavbarLayout from '@/components/NavbarLayout';
import NavbarProvider from '@/components/NavbarProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}`,
          }}
        />
        <ThemeProvider>
          <NavbarProvider value={{ adminLinks, userLinks }}>
            <NavbarLayout>{children}</NavbarLayout>
          </NavbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
