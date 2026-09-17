import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import FieldSelect from '@/components/ui/FieldSelect';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import { TableRowActions } from './shared/TableRowActions';
import type { BranchRule, Prompt } from './types';

export function BranchRulesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [rules, setRules] = useState<BranchRule[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPromptId, setFilterPromptId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPromptId) params.set('prompt_id', filterPromptId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, promptRes] = await Promise.all([
        fetch(`/api/admin/branch-rules${qs}`),
        fetch('/api/admin/prompts'),
      ]);
      setRules((await res.json()).branch_rules ?? []);
      setPrompts((await promptRes.json()).prompts ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterPromptId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: BranchRule) => {
    setFormValues({
      prompt_id: item.prompt_id,
      condition_expression:
        typeof item.condition_expression === 'string'
          ? item.condition_expression
          : JSON.stringify(item.condition_expression),
      target_prompt_id: item.target_prompt_id,
      priority: item.priority,
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.prompt_id || !formValues.target_prompt_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      // Try to parse condition_expression as JSON, fall back to string
      try {
        body.condition_expression = JSON.parse(String(formValues.condition_expression));
      } catch {
        /* keep as string */
      }
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/branch-rules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/branch-rules', {
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
      await fetch(`/api/admin/branch-rules?id=${confirmDelete}`, { method: 'DELETE' });
      showToast('Deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const promptKeyMap = Object.fromEntries(prompts.map((p) => [p.id, p.prompt_key]));

  return (
    <ContentErrorBoundary fallbackTitle="Branch Rules failed to load">
      <div>
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search rules…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={prompts.length === 0}
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

        <div className="mb-3 max-w-xs">
          <FieldSelect
            placeholder="All prompts"
            selectedKey={filterPromptId || 'all'}
            onChange={(key) => setFilterPromptId(key === 'all' ? '' : key)}
            items={[
              { id: 'all', name: 'All prompts' },
              ...prompts.map((p) => ({ id: p.id, name: p.prompt_key })),
            ]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Branch rules">
                <Table.Header>
                  <Table.Column isRowHeader>Source prompt</Table.Column>
                  <Table.Column>Target prompt</Table.Column>
                  <Table.Column>Condition</Table.Column>
                  <Table.Column>Priority</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No branch rules yet.'}>
                  {rules.map((r) => (
                    <Table.Row key={r.id} id={r.id}>
                      <Table.Cell>{promptKeyMap[r.prompt_id] || r.prompt_id}</Table.Cell>
                      <Table.Cell>
                        {promptKeyMap[r.target_prompt_id] || r.target_prompt_id}
                      </Table.Cell>
                      <Table.Cell>
                        {typeof r.condition_expression === 'string'
                          ? r.condition_expression
                          : JSON.stringify(r.condition_expression)}
                      </Table.Cell>
                      <Table.Cell>{r.priority}</Table.Cell>
                      <Table.Cell>
                        <TableRowActions
                          onEdit={() => openEdit(r)}
                          onDelete={() => setConfirmDelete(r.id)}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit Branch Rule' : 'New Branch Rule'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Source Prompt <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.prompt_id ?? '')}
                onChange={(e) => setFormValues({ ...formValues, prompt_id: e.target.value })}
                disabled={!!editingId}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select source prompt</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prompt_key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Target Prompt <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.target_prompt_id ?? '')}
                onChange={(e) => setFormValues({ ...formValues, target_prompt_id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select target prompt</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prompt_key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Condition Expression</label>
              <textarea
                value={String(formValues.condition_expression ?? '')}
                onChange={(e) =>
                  setFormValues({ ...formValues, condition_expression: e.target.value })
                }
                placeholder="JSON or string expression"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <input
                type="number"
                value={String(formValues.priority ?? 0)}
                onChange={(e) => setFormValues({ ...formValues, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              disabled={!formValues.prompt_id || !formValues.target_prompt_id}
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
          title="Delete Branch Rule"
          message="Are you sure you want to delete this rule?"
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
