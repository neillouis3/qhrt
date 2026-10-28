'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AssessmentDefinition } from '@/lib/assessments';
import type { GuideStep, LearningModule, LessonKind } from '@/lib/modules';
import { BuilderShell } from '../BuilderShell';
import { Toast } from '../shared/Toast';
import { Button } from '@heroui/react';
import { Field, inputClass, smallButtonClass } from '../assessments/fields';

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
  kind: 'guide',
  assessmentId: '',
  isActive: true,
  steps: [{ title: '', paragraphs: [], points: [] }],
});

export function LessonEditor({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const router = useRouter();
  const isNew = lessonId === 'new';
  const [moduleTitle, setModuleTitle] = useState('Module');
  const [assessments, setAssessments] = useState<AssessmentDefinition[]>([]);
  const [lesson, setLesson] = useState<LessonDraft>(emptyLesson());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch('/api/admin/modules'), fetch('/api/admin/assessments')]).then(
      async ([moduleRes, assessmentRes]) => {
        const moduleJson = await moduleRes.json();
        const assessmentJson = await assessmentRes.json();
        if (cancelled) return;
        setAssessments(assessmentJson.assessments ?? []);
        const found = (moduleJson.modules as LearningModule[] | undefined)?.find((item) => item.id === moduleId);
        if (!found) {
          router.replace('/content?tab=modules');
          return;
        }
        setModuleTitle(found.title);
        if (!isNew) {
          const item = found.lessons.find((entry) => entry.id === lessonId);
          if (!item) {
            router.replace(`/content/modules/${moduleId}`);
            return;
          }
          setLesson({
            id: item.id,
            title: item.title,
            description: item.description ?? '',
            kind: item.kind,
            assessmentId: item.assessmentId ?? '',
            isActive: item.isActive,
            steps: item.steps.length > 0 ? item.steps : [{ title: '', paragraphs: [], points: [] }],
          });
        }
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isNew, lessonId, moduleId, router]);

  const save = async () => {
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
        moduleId,
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
      setToast({ message: json.error ?? 'Could not save lesson', type: 'error' });
      return;
    }
    router.push(`/content/modules/${moduleId}`);
  };

  return (
    <BuilderShell
      backHref={`/content/modules/${moduleId}`}
      backLabel={moduleTitle}
      title={isNew ? 'New lesson' : lesson.title || 'Edit lesson'}
      subtitle={
        lesson.kind === 'guide'
          ? 'A guide is a short sequence of steps people read in the module.'
          : 'This lesson opens an assessment you already built.'
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
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
              onChange={(event) =>
                setLesson({ ...lesson, kind: event.target.value === 'guide' ? 'guide' : 'assessment' })
              }
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
                onClick={() =>
                  setLesson({ ...lesson, steps: [...lesson.steps, { title: '', paragraphs: [], points: [] }] })
                }
              >
                Add step
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lesson.isActive}
              onChange={(event) => setLesson({ ...lesson, isActive: event.target.checked })}
            />
            Visible
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onPress={() => router.push(`/content/modules/${moduleId}`)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isPending={saving}
              isDisabled={saving || !lesson.title.trim()}
              onPress={() => void save()}
            >
              Save lesson
            </Button>
          </div>
        </div>
      )}
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </BuilderShell>
  );
}
