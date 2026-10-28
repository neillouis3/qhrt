'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Workbook } from '@/lib/assessments';
import { BuilderShell } from '../BuilderShell';
import { Toast } from '../shared/Toast';
import { Button } from '@heroui/react';
import { Field, inputClass } from './fields';

export function WorkbookEditor({ workbookId }: { workbookId: string }) {
  const router = useRouter();
  const isNew = workbookId === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    fetch('/api/admin/workbooks')
      .then(async (res) => {
        const json = await res.json();
        const found = (json.workbooks as Workbook[] | undefined)?.find((item) => item.id === workbookId);
        if (cancelled) return;
        if (!found) {
          router.replace('/content?tab=workbooks');
          return;
        }
        setTitle(found.title);
        setDescription(found.description ?? '');
        setUrl(found.url);
        setDisplayOrder(found.display_order);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, workbookId, router]);

  const save = async () => {
    setSaving(true);
    const body = isNew
      ? { title, description, url, display_order: displayOrder }
      : { id: workbookId, title, description, url, display_order: displayOrder };
    const res = await fetch('/api/admin/workbooks', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setToast({ message: json.error ?? 'Could not save workbook', type: 'error' });
      return;
    }
    router.push('/content?tab=workbooks');
  };

  return (
    <BuilderShell
      backHref="/content?tab=workbooks"
      backLabel="Workbooks"
      title={isNew ? 'New workbook' : title || 'Edit workbook'}
      subtitle="A workbook is the next step after an assessment result — an in-app path or an external link."
    >
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Routine Reset"
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="One line shown under the title"
              className={inputClass}
            />
          </Field>
          <Field label="Link" required hint="An in-app path like /diary, or a full https:// URL.">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/diary or https://…"
              className={inputClass}
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onPress={() => router.push('/content?tab=workbooks')}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isPending={saving}
              isDisabled={saving || !title.trim() || !url.trim()}
              onPress={() => void save()}
            >
              {isNew ? 'Create workbook' : 'Save workbook'}
            </Button>
          </div>
        </div>
      )}
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </BuilderShell>
  );
}
