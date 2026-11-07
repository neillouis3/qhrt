'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table } from '@heroui/react';
import type { LearningModule, ModuleLesson } from '@/lib/modules';
import { lessonKindLabel, looksLikePresentation } from '@/lib/modules';
import { slugify } from '@/lib/modules';
import { BuilderShell } from '../BuilderShell';
import { ConfirmModal } from '../shared/ConfirmModal';
import { Toast } from '../shared/Toast';
import {
  Field,
  PlusIcon,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from '../assessments/fields';

export function ModuleEditor({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const isNew = moduleId === 'new';
  const [module, setModule] = useState<LearningModule | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    if (isNew) return;
    const res = await fetch('/api/admin/modules');
    const json = await res.json();
    const found = (json.modules as LearningModule[] | undefined)?.find((item) => item.id === moduleId);
    if (!found) {
      router.replace('/content?tab=modules');
      return;
    }
    setModule(found);
    setTitle(found.title);
    setSlug(found.slug);
    setDescription(found.description ?? '');
    setIsActive(found.isActive);
    setLoading(false);
  }, [isNew, moduleId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveModule = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/modules', {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: isNew ? undefined : moduleId,
        title,
        slug,
        description,
        isActive,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setToast({ message: json.error ?? 'Could not save lesson', type: 'error' });
      return;
    }
    if (isNew && json.module?.id) {
      router.replace(`/content/modules/${json.module.id}`);
      return;
    }
    setToast({ message: 'Lesson saved', type: 'success' });
    await load();
  };

  const moveLesson = async (item: ModuleLesson, direction: 'up' | 'down') => {
    const res = await fetch('/api/admin/modules/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, direction }),
    });
    if (!res.ok) setToast({ message: 'Could not reorder module', type: 'error' });
    await load();
  };

  const deleteLesson = async (item: ModuleLesson) => {
    const res = await fetch('/api/admin/modules/lessons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    if (!res.ok) setToast({ message: 'Could not delete module', type: 'error' });
    else setToast({ message: 'Module deleted', type: 'success' });
    await load();
  };

  return (
    <BuilderShell
      backHref="/content?tab=modules"
      backLabel="Lessons"
      title={isNew ? 'New lesson' : title || 'Edit lesson'}
      subtitle={
        isNew
          ? 'Name the lesson first. After it is created you can add a practice, a questionnaire, or a presentation.'
          : 'Save the lesson, then add a practice, a questionnaire, or a presentation.'
      }
      actions={
        loading ? null : (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={saving || !title.trim()}
              onClick={() => void saveModule()}
            >
              {isNew ? 'Create lesson' : 'Save lesson'}
            </button>
            {!isNew ? (
              <button type="button" className={secondaryButtonClass} onClick={() => setConfirmDelete(true)}>
                Delete lesson
              </button>
            ) : null}
          </div>
        )
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-2">
            <Field label="Title" required>
              <input
                className={inputClass}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
              />
            </Field>
            <Field label="Slug" hint="Used in the link. Lowercase words separated by hyphens.">
              <input
                className={inputClass}
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className={inputClass}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              Visible to users
            </label>
          </section>

          {!isNew && module ? (
            <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Modules</h3>
                  <p className="text-xs text-muted">A practice, a questionnaire, or a presentation. Opened in order.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/content/modules/${module.id}/lessons/new?type=guide`}
                    className={`${secondaryButtonClass} inline-flex items-center gap-2`}
                  >
                    <PlusIcon /> Practice
                  </Link>
                  <Link
                    href={`/content/modules/${module.id}/lessons/new?type=assessment`}
                    className={`${secondaryButtonClass} inline-flex items-center gap-2`}
                  >
                    <PlusIcon /> Questionnaire
                  </Link>
                  <Link
                    href={`/content/modules/${module.id}/lessons/new?type=presentation`}
                    className={`${primaryButtonClass} inline-flex items-center gap-2`}
                  >
                    <PlusIcon /> Presentation
                  </Link>
                </div>
              </div>
              {module.lessons.length === 0 ? (
                <p className="text-sm text-muted">No modules yet. Choose a type above.</p>
              ) : (
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content aria-label="Modules">
                      <Table.Header>
                        <Table.Column isRowHeader>Module</Table.Column>
                        <Table.Column>Type</Table.Column>
                        <Table.Column>Actions</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {module.lessons.map((item) => (
                          <Table.Row key={item.id} id={item.id}>
                            <Table.Cell>
                              <div className="flex flex-col">
                                <span>
                                  {item.position}. {item.title}
                                </span>
                                {item.minutes > 0 ? (
                                  <span className="text-xs text-muted">{item.minutes} min</span>
                                ) : null}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              {item.kind !== 'assessment' && looksLikePresentation(item.steps)
                                ? 'Presentation'
                                : lessonKindLabel(item.kind)}
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-nowrap justify-end gap-1">
                                <button
                                  type="button"
                                  className={smallButtonClass}
                                  onClick={() => void moveLesson(item, 'up')}
                                >
                                  Up
                                </button>
                                <button
                                  type="button"
                                  className={smallButtonClass}
                                  onClick={() => void moveLesson(item, 'down')}
                                >
                                  Down
                                </button>
                                <Link
                                  href={`/content/modules/${module.id}/lessons/${item.id}`}
                                  className={smallButtonClass}
                                >
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  className={smallButtonClass}
                                  onClick={() => void deleteLesson(item)}
                                >
                                  Delete
                                </button>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              )}
            </section>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void fetch('/api/admin/modules', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: moduleId }),
          }).then(async (res) => {
            setConfirmDelete(false);
            if (!res.ok) setToast({ message: 'Could not delete lesson', type: 'error' });
            else router.push('/content?tab=modules');
          });
        }}
        title="Delete lesson"
        message="This removes the lesson and the modules inside it. Assessments themselves stay in the assessment list."
        confirmLabel="Delete"
      />
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </BuilderShell>
  );
}
