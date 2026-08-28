import { useState, useEffect, useCallback } from 'react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { SearchBox } from './shared/SearchBox';

interface TherapeuticEngine {
  id: string;
  user_id: string;
  current_phase_order: number;
  status: string;
  created_at: string;
}

export function TherapeuticEnginesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [engines, setEngines] = useState<TherapeuticEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/therapeutic-engines?search=${encodeURIComponent(search)}`
        : '/api/admin/therapeutic-engines';
      const res = await fetch(url);
      setEngines((await res.json()).therapeutic_engines ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load therapeutic engines', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'running':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <ContentErrorBoundary fallbackTitle="Active Sessions failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Active Therapeutic Sessions</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search by session ID…" onSearch={setSearch} />
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:text-foreground transition-colors dark:border-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : engines.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
            <p className="text-muted dark:text-gray-400">No therapeutic engine sessions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User ID</th>
                  <th className="px-4 py-3 text-left font-medium">Current Phase</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {engines.map((e) => (
                  <tr key={e.id} className="border-t border-border dark:border-gray-700">
                    <td className="px-4 py-3 font-mono text-xs">{e.user_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">Phase {e.current_phase_order}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(e.status)}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-gray-400">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ContentErrorBoundary>
  );
}
