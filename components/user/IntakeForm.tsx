'use client';

import { useState } from 'react';

interface IntakeFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

type PresentingConcern = 'anxiety' | 'trauma' | 'depression' | 'overwhelm' | 'sleep' | 'other';

type RegulationIssue = 'racing' | 'tension' | 'flooding' | 'shutdown' | 'focus' | 'other';

type SleepQuality = 'good' | 'interrupted' | 'poor' | 'very_poor';

interface IntakeData {
  presentingConcern: PresentingConcern | string | null;
  presentingConcernOther: string;
  stress: number | null;
  emotionalIntensity: number | null;
  bodyTension: number | null;
  regulationIssue: RegulationIssue | string | null;
  regulationIssueOther: string;
  sleepQuality: SleepQuality | null;
  goals: string;
}

const initialData: IntakeData = {
  presentingConcern: null,
  presentingConcernOther: '',
  stress: null,
  emotionalIntensity: null,
  bodyTension: null,
  regulationIssue: null,
  regulationIssueOther: '',
  sleepQuality: null,
  goals: '',
};

const steps = [
  { key: 'presenting', title: 'What do you want to focus on?' },
  { key: 'current', title: 'Wellness & resilience audit' },
  { key: 'regulation', title: 'When stress runs high' },
  { key: 'sleep', title: 'Sleep & rest habits' },
  { key: 'goals', title: 'Your coaching goals' },
];

export default function IntakeForm({ onComplete, onCancel }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<IntakeData>) => setData((d) => ({ ...d, ...patch }));

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      onComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step title */}
      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
        {steps[step]?.title}
      </h3>

      {/* Step content */}
      <div className="mt-6 space-y-4">
        {step === 0 && (
          <>
            <p className="text-sm text-muted">
              Choose a learning focus — we use this to suggest workbooks, not to diagnose or treat.
            </p>
            <div className="space-y-2">
              {[
                { value: 'anxiety', label: 'Manage daily stress & worry' },
                { value: 'sleep', label: 'Improve sleep & rest routines' },
                { value: 'overwhelm', label: 'Build boundaries & resilience' },
                { value: 'depression', label: 'Motivation, mood & habits' },
                { value: 'trauma', label: 'Mindfulness & grounding practices' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ presentingConcern: opt.value })}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    data.presentingConcern === opt.value
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-light'
                      : 'border-border hover:bg-muted/5 dark:hover:bg-navy-light/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div>
                <input
                  type="text"
                  placeholder="Other (describe)"
                  value={data.presentingConcernOther}
                  onChange={(e) => update({ presentingConcernOther: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:border-primary-light"
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-muted">
              Optional habit check-in (1 = low, 10 = high). This curates content — not a clinical
              score.
            </p>
            <div className="space-y-4">
              {[
                { key: 'stress' as const, label: 'Daily stress load' },
                { key: 'emotionalIntensity' as const, label: 'Emotional reactivity' },
                { key: 'bodyTension' as const, label: 'Physical tension' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground dark:text-muted">{label}</span>
                    <span className="font-medium text-primary dark:text-primary-light">
                      {data[key] ?? '—'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={data[key] ?? 5}
                    onChange={(e) => update({ [key]: Number(e.target.value) })}
                    aria-label={`${label} (scale 1 to 10)`}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted mt-0.5">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted">When stress is high, what shows up most often?</p>
            <div className="space-y-2">
              {[
                { value: 'racing', label: 'Busy mind / racing thoughts' },
                { value: 'tension', label: 'Tension in the body' },
                { value: 'flooding', label: 'Hard to slow down emotionally' },
                { value: 'shutdown', label: 'Withdraw or go quiet' },
                { value: 'focus', label: 'Hard to focus on one thing' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ regulationIssue: opt.value })}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    data.regulationIssue === opt.value
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-light'
                      : 'border-border hover:bg-muted/5 dark:hover:bg-navy-light/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div>
                <input
                  type="text"
                  placeholder="Other (describe)"
                  value={data.regulationIssueOther}
                  onChange={(e) => update({ regulationIssueOther: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:border-primary-light"
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted">How are your sleep habits lately?</p>
            <div className="space-y-2">
              {[
                { value: 'good' as SleepQuality, label: 'Good' },
                { value: 'interrupted' as SleepQuality, label: 'Interrupted' },
                { value: 'poor' as SleepQuality, label: 'Poor' },
                { value: 'very_poor' as SleepQuality, label: 'Very poor' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ sleepQuality: opt.value })}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    data.sleepQuality === opt.value
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-light'
                      : 'border-border hover:bg-muted/5 dark:hover:bg-navy-light/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm text-muted">What outcome would make this worthwhile for you?</p>
            <textarea
              rows={4}
              placeholder="e.g. calmer evenings, clearer boundaries, a steadier morning routine…"
              value={data.goals}
              onChange={(e) => update({ goals: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:border-primary-light resize-none"
            />
          </>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <button
          onClick={step === 0 ? onCancel : () => setStep(step - 1)}
          className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/5 dark:hover:bg-navy-light/20 rounded-lg transition-colors"
        >
          {step === 0 ? 'Skip for now' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors dark:bg-primary-light dark:hover:bg-primary disabled:opacity-50"
        >
          {step === steps.length - 1 ? (loading ? 'Saving...' : 'Save preferences') : 'Continue'}
        </button>
      </div>
    </div>
  );
}
