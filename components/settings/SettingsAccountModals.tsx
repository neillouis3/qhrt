'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash } from '@gravity-ui/icons';
import {
  Button,
  Input,
  InputGroup,
  Label,
  TextField,
  Typography,
} from '@heroui/react';
import Modal from '@/components/ui/Modal';
import { clearSessionCache } from '@/hooks/useSession';

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField name={id} fullWidth>
      <Label htmlFor={id}>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
        <InputGroup.Suffix className="pe-0">
          <Button
            type="button"
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((current) => !current)}
          >
            {visible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword;

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      setError('Use at least six characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a different password.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not change password.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change password" size="md">
      <div className="flex flex-col gap-4">
        {success ? (
          <>
            <Typography type="body-sm" color="muted">
              Your password has been updated. Next time you sign in, use your new password.
            </Typography>
            <Button size="sm" variant="primary" fullWidth onPress={handleClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Typography type="body-sm" color="muted">
              Use at least six characters. Pick something you have not used here before.
            </Typography>

            <PasswordField
              id="password-current"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />

            <PasswordField
              id="password-new"
              label="Enter a new password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />

            <PasswordField
              id="password-confirm"
              label="Confirm your new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            {error ? (
              <Typography type="body-sm" className="text-danger">
                {error}
              </Typography>
            ) : null}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="sm"
                variant="primary"
                fullWidth
                isPending={saving}
                isDisabled={saving || !canSubmit}
                onPress={() => void handleSubmit()}
              >
                Change password
              </Button>
              <Button size="sm" variant="ghost" fullWidth isDisabled={saving} onPress={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  email,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setConfirmEmail('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    if (deleting) return;
    reset();
    onClose();
  };

  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!emailMatches) {
      setError('Email does not match your account.');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      const response = await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confirmEmail.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not delete account.');
        return;
      }
      clearSessionCache();
      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete your account permanently?" size="md">
      <div className="flex flex-col gap-4">
        <Typography type="body-sm" color="muted">
          This is permanent and cannot be reversed. Your account, sessions, diary notes, journeys,
          and progress will be deleted.
        </Typography>

        <TextField name="confirmEmail" type="email" fullWidth>
          <Label htmlFor="delete-confirm-email">Type your email to confirm</Label>
          <Input
            id="delete-confirm-email"
            type="email"
            fullWidth
            autoComplete="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={email}
          />
        </TextField>

        <PasswordField
          id="delete-confirm-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {error ? (
          <Typography type="body-sm" className="text-danger">
            {error}
          </Typography>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="sm"
            variant="danger"
            fullWidth
            isPending={deleting}
            isDisabled={deleting || !confirmEmail || !password || !emailMatches}
            onPress={() => void handleDelete()}
          >
            Permanently delete account
          </Button>
          <Button size="sm" variant="ghost" fullWidth isDisabled={deleting} onPress={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
