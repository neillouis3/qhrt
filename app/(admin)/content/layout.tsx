import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Management',
  description: 'Admin content management dashboard',
};

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
