import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Home',
    template: '%s | QHRT',
  },
  description: 'QHRT application',
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
