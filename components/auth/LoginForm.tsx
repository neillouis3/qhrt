'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeSlash } from '@gravity-ui/icons';
import { Button, Input, InputGroup, Label, TextField } from '@heroui/react';

interface LoginFormProps {
  mode: 'login' | 'signup';
  onSuccess: () => void;
}

export default function LoginForm({ mode, onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetEmailSent = mode === 'login' && searchParams.get('reset') === 'sent';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() || email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setForgotError(typeof data.error === 'string' ? data.error : 'Could not send reset email.');
        return;
      }
      setForgotOpen(false);
      setForgotMessage('');
      setForgotError('');
      router.replace('/login?reset=sent');
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        return;
      }

      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {resetEmailSent ? (
        <p className="rounded-lg bg-default/30 p-3 text-sm text-muted" role="status">
          Check your email for a password reset link. If an account exists for that address, it
          should arrive within a few minutes. You can close this tab once you have opened the link.
        </p>
      ) : null}
      <TextField name="email" type="email" isRequired fullWidth>
        <Label>Email</Label>
        <Input
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </TextField>
      <TextField name="password" isRequired fullWidth>
        <Label>Password</Label>
        <InputGroup fullWidth>
          <InputGroup.Input
            type={isVisible ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <InputGroup.Suffix className="pe-0">
            <Button
              type="button"
              isIconOnly
              aria-label={isVisible ? 'Hide password' : 'Show password'}
              size="sm"
              variant="ghost"
              onPress={() => setIsVisible(!isVisible)}
            >
              {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
      {error && <p className="text-sm text-danger">{error}</p>}
      {mode === 'login' && !forgotOpen ? (
        <button
          type="button"
          className="self-start text-sm text-brand hover:opacity-80"
          onClick={() => {
            setForgotOpen(true);
            setForgotEmail(email);
            setForgotMessage('');
            setForgotError('');
          }}
        >
          Forgot password?
        </button>
      ) : null}
      {mode === 'login' && forgotOpen ? (
        <div className="flex flex-col gap-3 rounded-lg bg-default/30 p-4">
          <p className="text-sm text-muted">We will email you a link to reset your password.</p>
          <TextField name="forgotEmail" type="email" fullWidth>
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </TextField>
          {forgotError ? <p className="text-sm text-danger">{forgotError}</p> : null}
          {forgotMessage ? <p className="text-sm text-muted">{forgotMessage}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isPending={forgotLoading}
              isDisabled={forgotLoading}
              onPress={() =>
                void handleForgotPassword({ preventDefault: () => undefined } as React.FormEvent)
              }
            >
              Send reset link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={forgotLoading}
              onPress={() => setForgotOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        type="submit"
        fullWidth
        size="sm"
        variant="primary"
        isPending={loading}
        isDisabled={loading}
      >
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
}
