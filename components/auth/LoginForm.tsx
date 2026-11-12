'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeSlash } from '@gravity-ui/icons';
import { Button, Input, InputGroup, Label, TextField, Typography } from '@heroui/react';

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'apple', label: 'Apple' },
] as const;

function SocialMark({ id }: { id: (typeof SOCIAL_PROVIDERS)[number]['id'] }) {
  if (id === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
        />
        <path
          fill="currentColor"
          d="M12 22c2.7 0 4.96-.9 6.62-2.35l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
          opacity=".85"
        />
        <path
          fill="currentColor"
          d="M6.41 13.99A6 6 0 0 1 6.1 12c0-.69.12-1.36.31-1.99V7.43H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.57l3.34-2.58Z"
          opacity=".7"
        />
        <path
          fill="currentColor"
          d="M12 5.88c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.9 14.7 2 12 2A10 10 0 0 0 3.07 7.43l3.34 2.58C7.2 7.64 9.4 5.88 12 5.88Z"
          opacity=".55"
        />
      </svg>
    );
  }
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M16.2 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.8-1.2 1.1-2.4 1.1-2.5-.1 0-3.6-1.4-3.2-4.8Zm-1.9-6.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4Z"
      />
    </svg>
  );
}

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
  const [socialNotice, setSocialNotice] = useState('');

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
        className="auth-submit"
        isPending={loading}
        isDisabled={loading}
      >
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-foreground/10" />
        <Typography type="body-xs" color="muted">
          or
        </Typography>
        <span className="h-px flex-1 bg-foreground/10" />
      </div>
      <div className="flex flex-col gap-2">
        {SOCIAL_PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            fullWidth
            size="sm"
            variant="outline"
            onPress={() =>
              setSocialNotice(
                `${provider.label} ${mode === 'login' ? 'sign-in' : 'sign-up'} is not available yet.`
              )
            }
          >
            <span className="flex items-center justify-center gap-2">
              <SocialMark id={provider.id} />
              Continue with {provider.label}
            </span>
          </Button>
        ))}
      </div>
      {socialNotice ? (
        <p className="text-sm text-muted" role="status">
          {socialNotice}
        </p>
      ) : null}
    </form>
  );
}
