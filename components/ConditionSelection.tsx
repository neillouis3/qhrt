/**
 * Condition Selection Flow — replaces IntakeForm
 * Step 1: Browse categories
 * Step 2: Select one or more conditions
 * Step 3: Confirm & save
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConditionItem {
  id: string;
  name: string;
  short_description: string | null;
  is_featured: boolean;
}

interface CategoryWithConditions {
  id: string;
  name: string;
  description: string | null;
  conditions_count: number;
  conditions: ConditionItem[];
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              i < current ? 'w-8 bg-primary' : i === current ? 'w-8 bg-primary/40' : 'w-4 bg-border'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  onClick,
}: {
  category: CategoryWithConditions;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-background p-5 dark:bg-navy hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <h4 className="font-semibold text-foreground dark:text-white group-hover:text-primary transition-colors">
        {category.name}
      </h4>
      {category.description && (
        <p className="mt-1 text-sm text-muted line-clamp-2">{category.description}</p>
      )}
      <p className="mt-3 text-xs text-muted">
        {category.conditions_count} focus area{category.conditions_count !== 1 ? 's' : ''}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Condition Checkbox
// ---------------------------------------------------------------------------

function ConditionCheckbox({
  condition,
  selected,
  onToggle,
}: {
  condition: ConditionItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border bg-background hover:border-primary/20 dark:bg-navy'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            selected ? 'border-primary bg-primary' : 'border-border'
          }`}
        >
          {selected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground dark:text-white">
          {condition.name}
        </span>
        {condition.short_description && (
          <p className="mt-0.5 text-xs text-muted line-clamp-2">{condition.short_description}</p>
        )}
      </div>
      {condition.is_featured && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
          Featured
        </span>
      )}
      <input type="checkbox" checked={selected} onChange={onToggle} className="sr-only" />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConditionSelection({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<CategoryWithConditions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithConditions | null>(null);
  const [selectedConditionIds, setSelectedConditionIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount (with abort on unmount)
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/conditions/categories', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('Failed to load condition library. Please try again.');
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleCategoryClick = useCallback((cat: CategoryWithConditions) => {
    setSelectedCategory(cat);
    setStep(2);
  }, []);

  const toggleCondition = useCallback((id: string) => {
    setSelectedConditionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBackToCategories = useCallback(() => {
    setSelectedCategory(null);
    setStep(1);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedConditionIds.size === 0) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/selected-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionIds: Array.from(selectedConditionIds) }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to save selections');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [selectedConditionIds, onComplete]);

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <p className="mt-3 text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (error && step < 3) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator current={step} total={3} />

      {/* Step 1: Browse Categories */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
            What would you like to improve?
          </h3>
          <p className="text-sm text-muted mb-5">
            Choose a category below to explore available focus areas.
          </p>
          {/* Scrollable category grid — max height based on viewport to prevent clipping */}
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onClick={() => handleCategoryClick(cat)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Conditions */}
      {step === 2 && selectedCategory && (
        <div>
          <button
            onClick={handleBackToCategories}
            className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to categories
          </button>

          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
            {selectedCategory.name}
          </h3>
          <p className="text-sm text-muted mb-4">
            Select one or more focus areas that resonate with you.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {selectedCategory.conditions.map((cond) => (
              <ConditionCheckbox
                key={cond.id}
                condition={cond}
                selected={selectedConditionIds.has(cond.id)}
                onToggle={() => toggleCondition(cond.id)}
              />
            ))}
          </div>

          {/* Also allow browsing other categories */}
          <button
            onClick={handleBackToCategories}
            className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
          >
            Browse other categories
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={selectedConditionIds.size === 0 || saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : (
                `Continue (${selectedConditionIds.size} selected)`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Skip button always visible */}
      <div className="mt-6 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
