'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AssessmentDefinition } from '@/lib/assessments';
import type { GuideStep, LearningModule, LessonKind } from '@/lib/modules';
import { parseLessonKind } from '@/lib/modules';
import { BuilderShell } from '../BuilderShell';
import { designedStep, PresentationEditor } from './PresentationEditor';
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

const emptyStep = (): GuideStep => ({
  key: '',
  title: '',
  paragraphs: [],
  points: [],
  section: null,
  voiceover: '',
  domain: null,
});

const emptyLesson = (): LessonDraft => ({
  title: '',
  description: '',
  kind: 'guide',
  assessmentId: '',
  isActive: true,
  steps: [emptyStep()],
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
            steps: item.steps.length > 0 ? item.steps : [emptyStep()],
          });
        }
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isNew, lessonId, moduleId, router]);

  useEffect(() => {
    if (!isNew) return;
    const type = new URLSearchParams(window.location.search).get('type');
    if (type === 'presentation') {
      setLesson((current) =>
        current.title.trim() ? current : { ...current, kind: 'presentation', steps: [designedStep(1)] }
      );
    } else if (type === 'assessment') {
      setLesson((current) => ({ ...current, kind: 'assessment' }));
    }
  }, [isNew]);

  const save = async () => {
    setSaving(true);
    const steps = lesson.steps
      .map((step, index) => ({
        key: step.key.trim() || `slide_${index + 1}`,
        title: step.title.trim() || ((step.blocks?.length ?? 0) > 0 ? `Slide ${index + 1}` : ''),
        paragraphs: step.paragraphs.map((line) => line.trim()).filter(Boolean),
        points: step.points.map((line) => line.trim()).filter(Boolean),
        section: step.section?.trim() || null,
        voiceover: step.voiceover.trim(),
        domain: step.domain?.trim() || null,
        background: step.background ?? null,
        blocks: step.blocks ?? [],
      }))
      .filter((step) => step.title || step.blocks.length > 0);
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
      setToast({ message: json.error ?? 'Could not save module', type: 'error' });
      return;
    }
    router.push(`/content/modules/${moduleId}`);
  };

  return (
    <BuilderShell
      backHref={`/content/modules/${moduleId}`}
      backLabel={moduleTitle}
      workspace={lesson.kind === 'presentation'}
      title={isNew ? 'New module' : lesson.title || 'Edit module'}
      subtitle={
        lesson.kind === 'guide'
          ? 'A practice is a short sequence of steps people follow in the module.'
          : lesson.kind === 'assessment'
            ? 'A questionnaire opens an assessment you already built.'
            : undefined
      }
      actions={
        loading ? null : (
          <div className="flex gap-2">
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
              Save module
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className={lesson.kind === 'presentation' ? 'grid gap-4 lg:grid-cols-[1.2fr_1.4fr_12rem_auto] lg:items-end' : 'flex flex-col gap-4'}>
          <Field label="Module title" required>
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
              onChange={(event) => {
                const kind = parseLessonKind(event.target.value);
                const blank = lesson.steps.every((step) => !step.title.trim() && (step.blocks?.length ?? 0) === 0);
                if (kind === 'presentation' && blank) {
                  setLesson({ ...lesson, kind, steps: [designedStep(1)] });
                  return;
                }
                setLesson({ ...lesson, kind });
              }}
            >
              <option value="guide">Practice</option>
              <option value="assessment">Questionnaire</option>
              <option value="presentation">Presentation</option>
            </select>
          </Field>
          <label className={`flex items-center gap-2 text-sm ${lesson.kind === 'presentation' ? 'pb-2' : ''}`}>
            <input
              type="checkbox"
              checked={lesson.isActive}
              onChange={(event) => setLesson({ ...lesson, isActive: event.target.checked })}
            />
            Visible
          </label>
          </div>
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
          ) : lesson.kind === 'presentation' ? (
            <PresentationEditor
              steps={lesson.steps}
              onChange={(steps) => setLesson({ ...lesson, steps })}
              onError={(message) => setToast({ message, type: 'error' })}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {lesson.steps.map((step, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <Field label="Key" hint="Reflection screens use a key that starts with reflection-. That lesson opens theme selection.">
                    <input
                      className={inputClass}
                      value={step.key}
                      onChange={(event) => {
                        const steps = lesson.steps.slice();
                        steps[index] = { ...step, key: event.target.value };
                        setLesson({ ...lesson, steps });
                      }}
                    />
                  </Field>
                  {step.key.startsWith('reflection-') ? (
                    <Field label="Theme domain" hint="Set on the first reflection screen. Example: SLEEP or LIFE_TRANSITIONS.">
                      <input
                        className={inputClass}
                        value={step.domain ?? ''}
                        onChange={(event) => {
                          const steps = lesson.steps.slice();
                          steps[index] = { ...step, domain: event.target.value || null };
                          setLesson({ ...lesson, steps });
                        }}
                      />
                    </Field>
                  ) : null}
                  {step.key.startsWith('reflection-') ? (
                    <Field label="Section" hint="On a reflection screen, this is the continue button.">
                      <input
                        className={inputClass}
                        value={step.section ?? ''}
                        onChange={(event) => {
                          const steps = lesson.steps.slice();
                          steps[index] = { ...step, section: event.target.value || null };
                          setLesson({ ...lesson, steps });
                        }}
                      />
                    </Field>
                  ) : null}
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
                  <Field label="On-screen text" hint="One paragraph per line. Keep this short, like a slide.">
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
                onClick={() => setLesson({ ...lesson, steps: [...lesson.steps, emptyStep()] })}
              >
                Add step
              </button>
            </div>
          )}
        </div>
      )}
      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </BuilderShell>
  );
}
