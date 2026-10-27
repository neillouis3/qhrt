'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmModal } from '../shared/ConfirmModal';
import { Field, PlusIcon, inputClass, primaryButtonClass, secondaryButtonClass, smallButtonClass } from '../assessments/fields';
import type { AssessmentDefinition } from '@/lib/assessments';
import type { GuideStep, LearningModule, LessonKind, ModuleLesson } from '@/lib/modules';

type LessonDraft = {
  id?: string;
  title: string;
  description: string;
  kind: LessonKind;
  assessmentId: string;
  isActive: boolean;
  steps: GuideStep[];
};

const emptyLesson = (): LessonDraft => ({
  title: '',
  description: '',
  kind: 'assessment',
  assessmentId: '',
  isActive: true,
  steps: [{ title: '', paragraphs: [], points: [] }],
});

export function ModulesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [assessments, setAssessments] = useState<AssessmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lesson, setLesson] = useState<LessonDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LearningModule | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = modules.find((module) => module.id === selectedId) ?? null;

  const load = useCallback(async () => {
    try {
      const [moduleRes, assessmentRes] = await Promise.all([
        fetch('/api/admin/modules'),
        fetch('/api/admin/assessments'),
      ]);
      const moduleJson = await moduleRes.json();
      const assessmentJson = await assessmentRes.json();
      if (!moduleRes.ok) throw new Error(moduleJson.error || 'Failed to load modules');
      setModules(moduleJson.modules ?? []);
      setAssessments(assessmentJson.assessments ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load modules', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setSlug(selected.slug);
    setDescription(selected.description ?? '');
    setIsActive(selected.isActive);
  }, [selected]);

  const saveModule = async () => {
    setSaving(true);
    const creating = !selected;
    const res = await fetch('/api/admin/modules', {
      method: creating ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selected?.id,
        title,
        slug,
        description,
        isActive,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      showToast(typeof json.error === 'string' ? json.error : 'Could not save module', 'error');
      return;
    }
    showToast(creating ? 'Module created' : 'Module saved', 'success');
    await load();
    if (json.module?.id) setSelectedId(json.module.id);
  };

  const saveLesson = async () => {
    if (!selected || !lesson) return;
    setSaving(true);
    const steps = lesson.steps
      .map((step) => ({
        title: step.title.trim(),
        paragraphs: step.paragraphs.map((line) => line.trim()).filter(Boolean),
        points: step.points.map((line) => line.trim()).filter(Boolean),
      }))
      .filter((step) => step.title);
    const res = await fetch('/api/admin/modules/lessons', {
      method: lesson.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lesson.id,
        moduleId: selected.id,
        title: lesson.title,
        description: lesson.description,
        kind: lesson.kind,
        assessmentId: lesson.assessmentId,
        isActive: lesson.isActive,
        steps,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      showToast(typeof json.error === 'string' ? json.error : 'Could not save lesson', 'error');
      return;
    }
    showToast('Lesson saved', 'success');
    setLesson(null);
    await load();
  };

  const moveLesson = async (item: ModuleLesson, direction: 'up' | 'down') => {
    const res = await fetch('/api/admin/modules/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, direction }),
    });
    if (!res.ok) showToast('Could not reorder lesson', 'error');
    await load();
  };

  const deleteLesson = async (item: ModuleLesson) => {
    const res = await fetch('/api/admin/modules/lessons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    if (!res.ok) showToast('Could not delete lesson', 'error');
    else showToast('Lesson deleted', 'success');
    await load();
  };

  if (loading) return <p className="text-sm text-muted">Loading modules…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Modules</h2>
          <p className="text-sm text-muted">QHRT Foundation, Sleep, and the lessons inside each one.</p>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            setSelectedId(null);
            setTitle('');
            setSlug('');
            setDescription('');
            setIsActive(true);
            setLesson(null);
          }}
        >
          <span className="inline-flex items-center gap-2">
            <PlusIcon /> New module
          </span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => {
                setSelectedId(module.id);
                setLesson(null);
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm ${
                selected?.id === module.id ? 'bg-default/40' : 'hover:bg-default/20'
              }`}
            >
              <span className="block font-medium">{module.title}</span>
              <span className="text-xs text-muted">{module.lessons.length} lessons</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required>
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Slug" hint="Used in the link. Lowercase words separated by hyphens.">
              <input className={inputClass} value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className={inputClass}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButtonClass} disabled={saving || !title.trim()} onClick={() => void saveModule()}>
              {selected ? 'Save module' : 'Create module'}
            </button>
            {selected ? (
              <button type="button" className={secondaryButtonClass} onClick={() => setConfirmDelete(selected)}>
                Delete module
              </button>
            ) : null}
          </div>

          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Lessons</h3>
                <button type="button" className={smallButtonClass} onClick={() => setLesson(emptyLesson())}>
                  Add lesson
                </button>
              </div>
              {selected.lessons.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm">Module {item.position}</p>
                    <p className="text-sm text-muted">
                      {item.title} · {item.kind === 'guide' ? 'Guide' : 'Assessment'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={smallButtonClass} onClick={() => void moveLesson(item, 'up')}>
                      Up
                    </button>
                    <button type="button" className={smallButtonClass} onClick={() => void moveLesson(item, 'down')}>
                      Down
                    </button>
                    <button
                      type="button"
                      className={smallButtonClass}
                      onClick={() =>
                        setLesson({
                          id: item.id,
                          title: item.title,
                          description: item.description ?? '',
                          kind: item.kind,
                          assessmentId: item.assessmentId ?? '',
                          isActive: item.isActive,
                          steps: item.steps.length > 0 ? item.steps : [{ title: '', paragraphs: [], points: [] }],
                        })
                      }
                    >
                      Edit
                    </button>
                    <button type="button" className={smallButtonClass} onClick={() => void deleteLesson(item)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {lesson ? (
                <div className="flex flex-col gap-4 rounded-lg bg-default/20 p-4">
                  <Field label="Lesson title" required>
                    <input
                      className={inputClass}
                      value={lesson.title}
                      onChange={(event) => setLesson({ ...lesson, title: event.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <input
                      className={inputClass}
                      value={lesson.description}
                      onChange={(event) => setLesson({ ...lesson, description: event.target.value })}
                    />
                  </Field>
                  <Field label="Type">
                    <select
                      className={inputClass}
                      value={lesson.kind}
                      onChange={(event) => setLesson({ ...lesson, kind: event.target.value === 'guide' ? 'guide' : 'assessment' })}
                    >
                      <option value="guide">Step-by-step guide</option>
                      <option value="assessment">Assessment</option>
                    </select>
                  </Field>
                  {lesson.kind === 'assessment' ? (
                    <Field label="Assessment" required>
                      <select
                        className={inputClass}
                        value={lesson.assessmentId}
                        onChange={(event) => setLesson({ ...lesson, assessmentId: event.target.value })}
                      >
                        <option value="">Choose an assessment</option>
                        {assessments.map((assessment) => (
                          <option key={assessment.id} value={assessment.id}>
                            {assessment.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {lesson.steps.map((step, index) => (
                        <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                          <Field label={`Step ${index + 1}`}>
                            <input
                              className={inputClass}
                              value={step.title}
                              onChange={(event) => {
                                const steps = lesson.steps.slice();
                                steps[index] = { ...step, title: event.target.value };
                                setLesson({ ...lesson, steps });
                              }}
                            />
                          </Field>
                          <Field label="Paragraphs" hint="One paragraph per line.">
                            <textarea
                              className={inputClass}
                              rows={3}
                              value={step.paragraphs.join('\n')}
                              onChange={(event) => {
                                const steps = lesson.steps.slice();
                                steps[index] = { ...step, paragraphs: event.target.value.split('\n') };
                                setLesson({ ...lesson, steps });
                              }}
                            />
                          </Field>
                          <Field label="Points" hint="One point per line.">
                            <textarea
                              className={inputClass}
                              rows={3}
                              value={step.points.join('\n')}
                              onChange={(event) => {
                                const steps = lesson.steps.slice();
                                steps[index] = { ...step, points: event.target.value.split('\n') };
                                setLesson({ ...lesson, steps });
                              }}
                            />
                          </Field>
                        </div>
                      ))}
                      <button
                        type="button"
                        className={smallButtonClass}
                        onClick={() => setLesson({ ...lesson, steps: [...lesson.steps, { title: '', paragraphs: [], points: [] }] })}
                      >
                        Add step
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className={primaryButtonClass} disabled={saving} onClick={() => void saveLesson()}>
                      Save lesson
                    </button>
                    <button type="button" className={secondaryButtonClass} onClick={() => setLesson(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">Create a module, then add its lessons.</p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          void fetch('/api/admin/modules', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: confirmDelete.id }),
          }).then(async (res) => {
            setConfirmDelete(null);
            if (!res.ok) showToast('Could not delete module', 'error');
            else {
              showToast('Module deleted', 'success');
              setSelectedId(null);
              await load();
            }
          });
        }}
        title="Delete module"
        message="This removes the module and its lessons. Assessments themselves stay in the assessment list."
        confirmLabel="Delete"
      />
    </div>
  );
}
