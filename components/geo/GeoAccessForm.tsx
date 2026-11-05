'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Label, TextField } from '@heroui/react';

export default function GeoAccessForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/geo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'That code is not valid.');
        return;
      }

      const next = searchParams.get('next');
      const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
      window.location.assign(dest);
    } catch {
      setError('Could not check that code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <TextField name="code" type="password" isRequired fullWidth>
        <Label>Developer code</Label>
        <Input
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter the access code"
        />
      </TextField>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        type="submit"
        fullWidth
        variant="primary"
        isPending={loading}
        isDisabled={loading || !code.trim()}
      >
        Continue
      </Button>
    </form>
  );
}
