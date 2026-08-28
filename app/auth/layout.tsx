import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Authentication',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-full flex flex-col">{children}</div>;
}
