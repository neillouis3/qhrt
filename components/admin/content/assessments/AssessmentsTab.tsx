import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@heroui/react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from '../shared/ConfirmModal';
import { SearchBox } from '../shared/SearchBox';
import { Toggle } from '../shared/Toggle';
import { TableRowActions } from '../shared/TableRowActions';
import type { AssessmentDefinition } from '@/lib/assessments';
import { PlusIcon, primaryButtonClass, secondaryButtonClass } from './fields';

const METHOD_LABELS: Record<AssessmentDefinition['scoring_method'], string> = {
  sum: 'Total',
  mean: 'Average',
  top_category: 'Category',
};

export function AssessmentsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AssessmentDefinition | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoadError(null);
    try {
      const aRes = await fetch('/api/admin/assessments');
      const aJson = await aRes.json();
      if (!aRes.ok) throw new Error(aJson.error || 'Failed to load assessments');
      setAssessments(aJson.assessments ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load assessments';
      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (a: AssessmentDefinition) => {
    const res = await fetch('/api/admin/assessments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, is_active: !a.is_active }),
    });
    if (!res.ok) showToast('Failed to update assessment', 'error');
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch('/api/admin/assessments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmDelete.id }),
    });
    setConfirmDelete(null);
    if (!res.ok) {
      showToast('Failed to delete assessment', 'error');
      return;
    }
    showToast('Assessment deleted', 'success');
    fetchData();
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assessments;
    return assessments.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.slug.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term)
    );
  }, [assessments, search]);

  return (
    <ContentErrorBoundary fallbackTitle="Assessments failed to load">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Each assessment is built in three steps: details, questions, then results. Nothing here is a diagnosis.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox placeholder="Search assessments" onSearch={setSearch} />
            <button
              onClick={() => router.push('/content/assessments/new')}
              className={`${primaryButtonClass} flex shrink-0 items-center gap-2`}
            >
              <PlusIcon />
              Add Assessment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6">
            <p className="text-sm font-medium text-danger">Couldn&apos;t load assessments</p>
            <p className="mt-2 text-sm text-muted">{loadError}</p>
            <button
              type="button"
              className={`${secondaryButtonClass} mt-4`}
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Assessments">
                <Table.Header>
                  <Table.Column isRowHeader>Title</Table.Column>
                  <Table.Column>Questions</Table.Column>
                  <Table.Column>Scoring</Table.Column>
                  <Table.Column>Outcomes</Table.Column>
                  <Table.Column>Visible</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No assessments yet.'}>
                  {rows.map((a) => {
                    const workbookLinks = a.outcomes.reduce(
                      (sum, outcome) => sum + outcome.workbookIds.length,
                      0
                    );
                    return (
                      <Table.Row key={a.id} id={a.id}>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span>{a.title}</span>
                            <span className="font-mono text-xs text-muted">{a.slug}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>{a.questions.length}</Table.Cell>
                        <Table.Cell>{METHOD_LABELS[a.scoring_method]}</Table.Cell>
                        <Table.Cell>
                          {a.outcomes.length}
                          {workbookLinks > 0 ? (
                            <span className="text-muted"> · {workbookLinks} workbook links</span>
                          ) : a.outcomes.length === 0 ? (
                            <span className="text-muted"> · none</span>
                          ) : null}
                        </Table.Cell>
                        <Table.Cell>
                          <Toggle checked={a.is_active} onChange={() => handleToggleActive(a)} />
                        </Table.Cell>
                        <Table.Cell>
                          <TableRowActions
                            onEdit={() => router.push(`/content/assessments/${a.id}`)}
                            onDelete={() => setConfirmDelete(a)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Assessment"
          message={`Delete “${confirmDelete?.title ?? ''}”? Saved user results for it will be removed too.`}
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
