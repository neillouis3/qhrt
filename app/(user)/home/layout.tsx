import type { Metadata } from 'next';
import { HomePageChrome } from '@/components/home/HomeDashboardSections';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <HomePageChrome>{children}</HomePageChrome>;
}
