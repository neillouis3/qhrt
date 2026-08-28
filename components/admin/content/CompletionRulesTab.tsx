import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import type { CompletionRule, EvidenceDimension } from './types';

export function CompletionRulesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [rules, setRules] = useState<CompletionRule[]>([]);
  const [dimensions, setDimensions] = useState<EvidenceDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDimId, setFilterDimId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDimId) params.set('evidence_dimension_id', filterDimId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, dimRes] = await Promise.all([
        fetch(`/api/admin/completion-rules${qs}`),
        fetch('/api/admin/evidence-dimensions'),
      ]);
      setRules((await res.json()).completion_rules ?? []);
      setDimensions((await dimRes.json()).evidence_dimensions ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterDimId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: CompletionRule) => {
    setFormValues({
      evidence_dimension_id: item.evidence_dimension_id,
      rule_expression:
        typeof item.rule_expression === 'string'
          ? item.rule_expression
          : JSON.stringify(item.rule_expression),
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.evidence_dimension_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      try {
        body.rule_expression = JSON.parse(String(formValues.rule_expression));
      } catch {
        /* keep as string */
      }
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/completion-rules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/completion-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      showToast(editingId ? 'Updated' : 'Created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch(`/api/admin/completion-rules?id=${confirmDelete}`, { method: 'DELETE' });
      showToast('Deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const dimNameMap = Object.fromEntries(dimensions.map((d) => [d.id, d.name]));

  return (
    <ContentErrorBoundary fallbackTitle="Completion Rules failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Completion Rules</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search rules…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={dimensions.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Rule
            </button>
          </div>
        </div>

        <div className="mb-3">
          <select
            value={filterDimId}
            onChange={(e) => setFilterDimId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All dimensions</option>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted bg-muted/3 dark:bg-navy-light/5">
                  <th className="text-left py-2.5 px-3 font-medium">Dimension</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell max-w-xs">
                    Rule Expression
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">
                      {dimNameMap[r.evidence_dimension_id] || r.evidence_dimension_id}
                    </td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell max-w-xs truncate font-mono text-xs">
                      {typeof r.rule_expression === 'string'
                        ? r.rule_expression
                        : JSON.stringify(r.rule_expression)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted">
                      No completion rules yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit Completion Rule' : 'New Completion Rule'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Evidence Dimension <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.evidence_dimension_id ?? '')}
                onChange={(e) =>
                  setFormValues({ ...formValues, evidence_dimension_id: e.target.value })
                }
                disabled={!!editingId}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select dimension</option>
                {dimensions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Rule Expression</label>
              <textarea
                value={String(formValues.rule_expression ?? '')}
                onChange={(e) => setFormValues({ ...formValues, rule_expression: e.target.value })}
                placeholder="JSON expression defining completion criteria"
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formValues.evidence_dimension_id}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Completion Rule"
          message="Are you sure you want to delete this rule?"
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
