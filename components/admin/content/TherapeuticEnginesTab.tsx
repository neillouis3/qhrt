import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
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

  return (
    <ContentErrorBoundary fallbackTitle="Active Sessions failed to load">
      <div>
        <div className="mb-4 flex items-center justify-end">
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
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Therapeutic engines">
                <Table.Header>
                  <Table.Column isRowHeader>User ID</Table.Column>
                  <Table.Column>Current phase</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Started</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No therapeutic engine sessions yet.'}>
                  {engines.map((e) => (
                    <Table.Row key={e.id} id={e.id}>
                      <Table.Cell>{e.user_id.slice(0, 8)}...</Table.Cell>
                      <Table.Cell>Phase {e.current_phase_order}</Table.Cell>
                      <Table.Cell>{e.status}</Table.Cell>
                      <Table.Cell>{new Date(e.created_at).toLocaleDateString()}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>
    </ContentErrorBoundary>
  );
}
