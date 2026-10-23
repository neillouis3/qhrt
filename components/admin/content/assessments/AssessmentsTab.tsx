import { useCallback, useEffect, useState } from 'react';
import { Table } from '@heroui/react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from '../shared/ConfirmModal';
import { Toggle } from '../shared/Toggle';
import { TableRowActions } from '../shared/TableRowActions';
import type { AssessmentDefinition, Workbook } from '@/lib/assessments/types';
import { AssessmentEditor, emptyDraft, type AssessmentDraft } from './AssessmentEditor';
import { PlusIcon, primaryButtonClass } from './fields';

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
  const [assessments, setAssessments] = useState<AssessmentDefinition[]>([]);
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AssessmentDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AssessmentDefinition | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, wRes] = await Promise.all([
        fetch('/api/admin/assessments'),
        fetch('/api/admin/workbooks'),
      ]);
      const [aJson, wJson] = await Promise.all([aRes.json(), wRes.json()]);
      if (!aRes.ok) throw new Error(aJson.error);
      setAssessments(aJson.assessments ?? []);
      setWorkbooks(wJson.workbooks ?? []);
    } catch {
      showToast('Failed to load assessments', 'error');
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

  if (editing) {
    return (
      <ContentErrorBoundary fallbackTitle="Assessment editor failed to load">
        <AssessmentEditor
          key={editing.id ?? 'new'}
          initial={editing}
          workbooks={workbooks}
          showToast={showToast}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchData();
          }}
        />
      </ContentErrorBoundary>
    );
  }

  return (
    <ContentErrorBoundary fallbackTitle="Assessments failed to load">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Each assessment scores answers and links people to workbooks. Nothing here is a diagnosis.
          </p>
          <button
            onClick={() => setEditing(emptyDraft(assessments.length + 1))}
            className={`${primaryButtonClass} flex shrink-0 items-center gap-2`}
          >
            <PlusIcon />
            Add Assessment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Assessments">
                <Table.Header>
                  <Table.Column isRowHeader>Title</Table.Column>
                  <Table.Column>Slug</Table.Column>
                  <Table.Column>Questions</Table.Column>
                  <Table.Column>Scoring</Table.Column>
                  <Table.Column>Outcomes</Table.Column>
                  <Table.Column>Visible</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No assessments yet.'}>
                  {assessments.map((a) => (
                    <Table.Row key={a.id} id={a.id}>
                      <Table.Cell>{a.title}</Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-xs">{a.slug}</span>
                      </Table.Cell>
                      <Table.Cell>{a.questions.length}</Table.Cell>
                      <Table.Cell>{METHOD_LABELS[a.scoring_method]}</Table.Cell>
                      <Table.Cell>{a.outcomes.length}</Table.Cell>
                      <Table.Cell>
                        <Toggle checked={a.is_active} onChange={() => handleToggleActive(a)} />
                      </Table.Cell>
                      <Table.Cell>
                        <TableRowActions onEdit={() => setEditing(a)} onDelete={() => setConfirmDelete(a)} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
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
