import { useState } from 'react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';

export function SeedDataTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/seed-data', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Seed failed');
      setResult(`${json.message} Categories: ${json.categoriesSeeded}`);
      showToast('Seed data loaded successfully', 'success');
    } catch (err: any) {
      setResult('Error: ' + (err.message ?? 'Unknown error'));
      showToast('Seed failed', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ContentErrorBoundary fallbackTitle="Seed Data failed to load">
      <div>
        <p className="text-sm text-muted mb-6">
          Populate the condition library with the initial 7 categories and 60 conditions. This
          operation is idempotent — safe to re-run (existing records are preserved).
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="px-6 py-3 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {seeding ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Seeding...
            </>
          ) : (
            '🌱 Seed 7 Categories + 60 Conditions'
          )}
        </button>
        {result && (
          <div
            className={`mt-4 p-4 rounded-xl border text-sm ${result.startsWith('Error') ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'}`}
          >
            {result}
          </div>
        )}
      </div>
    </ContentErrorBoundary>
  );
}
