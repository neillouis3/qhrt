import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'QHRT Admin',
    template: '%s | QHRT Admin',
  },
  description: 'QHRT admin dashboard',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
