import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@heroui/react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from '../shared/ConfirmModal';
import { SearchBox } from '../shared/SearchBox';
import { Toggle } from '../shared/Toggle';
import { TableRowActions } from '../shared/TableRowActions';
import type { AssessmentDefinition, Workbook } from '@/lib/assessments';
import { PlusIcon, primaryButtonClass } from './fields';

async function send(method: string, body: unknown): Promise<string | null> {
  const res = await fetch('/api/admin/workbooks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return json.error ?? 'Request failed';
}

export function WorkbooksTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const router = useRouter();
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [assessments, setAssessments] = useState<AssessmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [wRes, aRes] = await Promise.all([
        fetch('/api/admin/workbooks'),
        fetch('/api/admin/assessments'),
      ]);
      const [wJson, aJson] = await Promise.all([wRes.json(), aRes.json()]);
      if (!wRes.ok) throw new Error(wJson.error);
      setWorkbooks(wJson.workbooks ?? []);
      if (aRes.ok) setAssessments(aJson.assessments ?? []);
    } catch {
      showToast('Failed to load workbooks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (w: Workbook) => {
    const error = await send('PATCH', { id: w.id, is_active: !w.is_active });
    if (error) showToast(error, 'error');
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const error = await send('DELETE', { id: confirmDelete });
    setConfirmDelete(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Workbook deleted', 'success');
    fetchData();
  };

  const linkedCount = (id: string) =>
    assessments.filter((assessment) =>
      assessment.outcomes.some((outcome) => outcome.workbookIds.includes(id))
    ).length;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return workbooks;
    return workbooks.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.url.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term)
    );
  }, [workbooks, search]);

  return (
    <ContentErrorBoundary fallbackTitle="Workbooks failed to load">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Workbooks are the links people get after an assessment. Attach them to outcomes in the
            assessment builder.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox placeholder="Search workbooks" onSearch={setSearch} />
            <button
              onClick={() => router.push('/content/workbooks/new')}
              className={`${primaryButtonClass} flex shrink-0 items-center gap-2`}
            >
              <PlusIcon />
              Add Workbook
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Workbooks">
                <Table.Header>
                  <Table.Column isRowHeader>Title</Table.Column>
                  <Table.Column>Link</Table.Column>
                  <Table.Column>Used by</Table.Column>
                  <Table.Column>Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No workbooks yet.'}>
                  {rows.map((w) => {
                    const used = linkedCount(w.id);
                    return (
                      <Table.Row key={w.id} id={w.id}>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span>{w.title}</span>
                            {w.description ? (
                              <span className="text-xs text-muted">{w.description}</span>
                            ) : null}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-mono text-xs">{w.url}</span>
                        </Table.Cell>
                        <Table.Cell>
                          {used === 0 ? (
                            <span className="text-muted">Not linked</span>
                          ) : (
                            `${used} assessment${used === 1 ? '' : 's'}`
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Toggle checked={w.is_active} onChange={() => handleToggleActive(w)} />
                        </Table.Cell>
                        <Table.Cell>
                          <TableRowActions
                            onEdit={() => router.push(`/content/workbooks/${w.id}`)}
                            onDelete={() => setConfirmDelete(w.id)}
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
          title="Delete Workbook"
          message="Delete this workbook? Assessments that still link to it will block the delete."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
