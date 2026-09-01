import type { Metadata } from 'next';
import { Typography } from '@heroui/react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Typography type="h2" weight="normal">
            Choose a new password
          </Typography>
          <Typography type="body-sm" color="muted">
            Use at least six characters.
          </Typography>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
