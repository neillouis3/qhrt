import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to QHRT',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
