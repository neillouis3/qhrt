'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Typography } from '@heroui/react';

type Clarifier = {
  id: string;
  clarifierKey: string;
  body: string;
  allowsCustom: boolean;
  displayOrder: number;
  enabled: boolean;
  locale: string;
};

type Theme = {
  id: string;
  themeKey: string;
  label: string;
  locale: string;
  displayOrder: number;
  enabled: boolean;
  clarifiers: Clarifier[];
};

export function ReflectionThemesTab({
  showToast,
}: {
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [locale, setLocale] = useState('en');
  const [localeDraft, setLocaleDraft] = useState('en');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async (nextLocale: string) => {
    const response = await fetch(`/api/admin/reflection-themes?locale=${encodeURIComponent(nextLocale)}`, {
      credentials: 'same-origin',
    });
    const body = (await response.json()) as { themes?: Theme[]; error?: string };
    if (!response.ok) {
      setMessage(body.error || 'Themes could not be loaded.');
      setThemes([]);
      return;
    }
    setMessage('');
    setThemes(body.themes ?? []);
  }, []);

  useEffect(() => {
    void load(locale);
  }, [load, locale]);

  const save = async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/admin/reflection-themes', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast(body.error || 'That change could not be saved.', 'error');
      return;
    }
    showToast('Saved.', 'success');
    await load(locale);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Typography type="h2" weight="normal">
          Sleep reflection themes
        </Typography>
        <Typography type="body-sm" color="muted">
          Add, edit, reorder, enable, or disable themes and their clarifying statements. A new locale is a separate copy, so an edit does not change sessions already stored.
        </Typography>
      </div>
      <label className="flex w-32 flex-col gap-2 text-sm">
        Locale
        <input
          className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
          value={localeDraft}
          onChange={(event) => setLocaleDraft(event.target.value.trim())}
          onBlur={() => setLocale(localeDraft || 'en')}
        />
      </label>
      {message ? <Typography type="body-sm" color="muted">{message}</Typography> : null}
      <Button
        variant="primary"
        onPress={() =>
          void save({
            kind: 'theme',
            themeKey: `NEW_THEME_${themes.length + 1}`,
            label: 'New theme',
            locale,
            displayOrder: themes.length + 1,
            enabled: false,
          })
        }
      >
        Add theme
      </Button>
      {themes.map((theme) => (
        <div key={theme.id} className="flex flex-col gap-3 rounded-lg border border-foreground/10 p-4">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void save({
              kind: 'theme',
              id: theme.id,
              themeKey: String(form.get('themeKey') ?? ''),
              label: String(form.get('label') ?? ''),
              locale: String(form.get('locale') ?? locale),
              displayOrder: Number(form.get('displayOrder')),
              enabled: form.get('enabled') === 'on',
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Key
              <input name="themeKey" defaultValue={theme.themeKey} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Label
              <input name="label" defaultValue={theme.label} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Locale
              <input name="locale" defaultValue={theme.locale} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Order
              <input name="displayOrder" type="number" defaultValue={theme.displayOrder} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="enabled" type="checkbox" defaultChecked={theme.enabled} />
            Enabled
          </label>
          <Button type="submit" variant="ghost">
            Save theme
          </Button>
        </form>
          <div className="flex flex-col gap-3">
            {theme.clarifiers.map((clarifier) => (
              <form
                key={clarifier.id}
                className="flex flex-col gap-2 border-t border-foreground/10 pt-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const form = new FormData(event.currentTarget);
                  void save({
                    kind: 'clarifier',
                    id: clarifier.id,
                    themeId: theme.id,
                    clarifierKey: String(form.get('clarifierKey') ?? ''),
                    body: String(form.get('body') ?? ''),
                    locale: String(form.get('locale') ?? theme.locale),
                    displayOrder: Number(form.get('displayOrder')),
                    enabled: form.get('enabled') === 'on',
                    allowsCustom: form.get('allowsCustom') === 'on',
                  });
                }}
              >
                <label className="flex flex-col gap-1 text-sm">
                  Statement
                  <textarea name="body" defaultValue={clarifier.body} className="min-h-16 rounded-md border border-foreground/15 bg-transparent px-3 py-2" />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input name="clarifierKey" defaultValue={clarifier.clarifierKey} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm" />
                  <input name="locale" defaultValue={clarifier.locale} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm" />
                  <input name="displayOrder" type="number" defaultValue={clarifier.displayOrder} className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="enabled" type="checkbox" defaultChecked={clarifier.enabled} />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input name="allowsCustom" type="checkbox" defaultChecked={clarifier.allowsCustom} />
                  Participant writes their own statement
                </label>
                <Button type="submit" variant="ghost">
                  Save statement
                </Button>
              </form>
            ))}
            <Button
              variant="ghost"
              onPress={() =>
                void save({
                  kind: 'clarifier',
                  themeId: theme.id,
                  clarifierKey: `STATEMENT_${theme.clarifiers.length + 1}`,
                  body: 'New clarifying statement',
                  locale: theme.locale,
                  displayOrder: theme.clarifiers.length + 1,
                  enabled: true,
                  allowsCustom: false,
                })
              }
            >
              Add statement
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
