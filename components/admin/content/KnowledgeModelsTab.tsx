import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { Toggle } from './shared/Toggle';
import { SearchBox } from './shared/SearchBox';
import { TableRowActions } from './shared/TableRowActions';
import type { KnowledgeModel } from './types';

export function KnowledgeModelsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [models, setModels] = useState<KnowledgeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/knowledge-models?search=${encodeURIComponent(search)}`
        : '/api/admin/knowledge-models';
      const res = await fetch(url);
      const json = await res.json();
      setModels(json.knowledge_models ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load knowledge models', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormVersion('1.0');
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (m: KnowledgeModel) => {
    setFormName(m.name);
    setFormDesc(m.description ?? '');
    setFormVersion(m.version);
    setEditingId(m.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editingId) {
        await fetch('/api/admin/knowledge-models', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formName,
            description: formDesc || null,
            version: formVersion,
          }),
        });
      } else {
        await fetch('/api/admin/knowledge-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDesc || null,
            version: formVersion,
          }),
        });
      }
      showToast(editingId ? 'Model updated' : 'Model created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await fetch('/api/admin/knowledge-models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !models.find((m) => m.id === id)?.is_active }),
      });
      fetchData();
    } catch {
      showToast('Failed to update model', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/knowledge-models', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Model deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete model', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <ContentErrorBoundary fallbackTitle="Knowledge Models failed to load">
      <div>
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search models…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2"
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
              Add Model
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
              <Table.Content aria-label="Knowledge models">
                <Table.Header>
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Description</Table.Column>
                  <Table.Column>Version</Table.Column>
                  <Table.Column>Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No knowledge models yet.'}>
                  {models.map((m) => (
                    <Table.Row key={m.id} id={m.id}>
                      <Table.Cell>{m.name}</Table.Cell>
                      <Table.Cell>{m.description || '—'}</Table.Cell>
                      <Table.Cell>{m.version}</Table.Cell>
                      <Table.Cell>
                        <Toggle checked={m.is_active} onChange={() => handleToggleActive(m.id)} />
                      </Table.Cell>
                      <Table.Cell>
                        <TableRowActions
                          onEdit={() => openEdit(m)}
                          onDelete={() => setConfirmDelete(m.id)}
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
          title={editingId ? 'Edit Model' : 'New Knowledge Model'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Model name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Version</label>
              <input
                type="text"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. 1.0"
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
              disabled={!formName.trim()}
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
          title="Delete Model"
          message="Are you sure? This will also delete associated dimensions, prompts, and rules."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
