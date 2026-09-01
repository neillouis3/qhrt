import type { Metadata } from 'next';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a QHRT account',
};

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
