'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button, Typography } from '@heroui/react';
import { PasswordField } from '@/components/settings/SettingsAccountModals';
import { clearSessionCache } from '@/hooks/useSession';

function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Use at least six characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Could not update password.');
        return;
      }
      clearSessionCache();
      setDone(true);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Typography type="body-sm" color="muted">
          Your password has been updated. You can sign in with it next time.
        </Typography>
        <Link href="/home">
          <Button size="sm" variant="primary">
            Continue to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <Typography type="body-sm" color="muted">
          Open the reset link from your email to choose a new password. Links expire after a short
          time.
        </Typography>
        <Link href="/login" className="text-sm text-brand hover:opacity-80">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <PasswordField
        id="reset-password-new"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      <PasswordField
        id="reset-password-confirm"
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />
      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      ) : null}
      <Button type="submit" size="sm" fullWidth isPending={saving} isDisabled={saving}>
        Update password
      </Button>
    </form>
  );
}
