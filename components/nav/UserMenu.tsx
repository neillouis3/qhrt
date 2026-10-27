'use client';

import { Avatar, Button, Dropdown, Label, Separator, Typography } from '@heroui/react';
import { firstNameFromUser, fullNameFromUser, initialsFromUser, type NameSource } from '@/lib/userName';

export interface UserMenuProps {
  user: NameSource;
  onSettings: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onSettings, onLogout }: UserMenuProps) {
  const name = fullNameFromUser(user, 'Account');
  const email = user?.email?.trim() ?? '';
  const initial = initialsFromUser(user);
  const shortName = firstNameFromUser(user, name);

  return (
    <Dropdown>
      <Button size="sm" variant="ghost" aria-label={`${name} menu`} className="gap-2 px-1.5">
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{initial}</Avatar.Fallback>
        </Avatar>
        <span className="max-w-32 truncate text-sm font-normal">{shortName}</span>
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-56">
        <div className="flex flex-col gap-0.5 px-3 pt-3 pb-2">
          <Typography type="body-sm">{name}</Typography>
          {email ? (
            <Typography type="body-xs" color="muted">
              {email}
            </Typography>
          ) : null}
        </div>
        <Separator />
        <Dropdown.Menu
          aria-label="Account"
          onAction={(key) => {
            if (key === 'settings') onSettings();
            if (key === 'logout') onLogout();
          }}
        >
          <Dropdown.Item id="settings" textValue="Settings">
            <Label>Settings</Label>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue="Log out" variant="danger">
            <Label>Log out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
