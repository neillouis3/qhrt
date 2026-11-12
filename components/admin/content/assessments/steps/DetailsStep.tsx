'use client';

import { Field, inputClass } from '../fields';
import { AssessmentWizardFrame, useAssessmentDraft } from '../AssessmentDraftProvider';
import { detailsReady, optionalText, slugify } from '../wizard';
import { useEffect, useState } from 'react';

export function DetailsStep() {
  const { draft, set } = useAssessmentDraft();
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (draft.id) setSlugTouched(true);
  }, [draft.id]);

  return (
    <AssessmentWizardFrame step="details" onContinue={() => detailsReady(draft)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Title" required>
          <input
            type="text"
            value={draft.title}
            onChange={(e) =>
              set({
                title: e.target.value,
                ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
              })
            }
            className={inputClass}
          />
        </Field>
        <Field label="URL slug" required hint={`Shown at /assessments/${draft.slug || '…'}`}>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
            }}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="Short description" className="md:col-span-2">
          <input
            type="text"
            value={draft.description ?? ''}
            onChange={(e) => set({ description: optionalText(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Instructions" hint="Shown above the questions">
          <textarea
            value={draft.instructions ?? ''}
            onChange={(e) => set({ instructions: optionalText(e.target.value) })}
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="Disclaimer" hint="Shown with the questions and the result">
          <textarea
            value={draft.disclaimer ?? ''}
            onChange={(e) => set({ disclaimer: optionalText(e.target.value) })}
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="Cover image" hint="Optional path like /sleep-assessment.jpg or an https:// URL">
          <input
            type="text"
            value={draft.cover_image ?? ''}
            onChange={(e) => set({ cover_image: optionalText(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display order">
            <input
              type="number"
              value={draft.display_order}
              onChange={(e) => set({ display_order: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => set({ is_active: e.target.checked })}
            />
            Visible to users
          </label>
        </div>
      </div>
    </AssessmentWizardFrame>
  );
}
