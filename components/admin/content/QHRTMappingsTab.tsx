import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import FieldSelect from '@/components/ui/FieldSelect';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { loadConditions } from './shared/loadConditions';
import { SearchBox } from './shared/SearchBox';
import { TableRowActions } from './shared/TableRowActions';
import type { Condition } from './types';

export function QHRTMappingsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterConditionId, setFilterConditionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterConditionId) params.set('conditionId', filterConditionId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, condRes] = await Promise.all([
        fetch(`/api/admin/qhrt-mappings${qs}`),
        loadConditions(),
      ]);
      setMappings((await res.json()).mappings ?? []);
      setConditions(condRes);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterConditionId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = (m: any) => {
    setFormValues({
      condition_id: m.condition_id,
      primary_emotional_theme: m.primary_emotional_theme ?? '',
      secondary_emotional_theme: m.secondary_emotional_theme ?? '',
      organ_system: m.organ_system ?? '',
      gland_system: m.gland_system ?? '',
      qhrt_focus: m.qhrt_focus ?? '',
      internal_notes: m.internal_notes ?? '',
    });
    setEditingId(m.id);
    setModalOpen(true);
  };

  const openCreateForCondition = (conditionId: string) => {
    const existing = mappings.find((m) => m.condition_id === conditionId);
    if (existing) {
      openEdit(existing);
      return;
    }
    setFormValues({
      condition_id: conditionId,
      primary_emotional_theme: '',
      secondary_emotional_theme: '',
      organ_system: '',
      gland_system: '',
      qhrt_focus: '',
      internal_notes: '',
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.condition_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      for (const key of Object.keys(body)) {
        if (body[key] === '') body[key] = null;
      }
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/qhrt-mappings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/qhrt-mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      showToast('QHRT mapping saved', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Failed to save mapping', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/qhrt-mappings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Mapping deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete mapping', 'error');
    }
    setConfirmDelete(null);
  };

  const condNameMap = Object.fromEntries(conditions.map((c) => [c.id, c.name]));

  return (
    <ContentErrorBoundary fallbackTitle="QHRT Mappings failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted">
              Internal clinical framework data — not visible to users.
            </p>
          </div>
          <SearchBox placeholder="Search by condition…" onSearch={setSearch} />
        </div>

        <div className="mb-4 flex max-w-xl gap-3">
          <FieldSelect
            placeholder="All conditions"
            selectedKey={filterConditionId || 'all'}
            onChange={(key) => setFilterConditionId(key === 'all' ? '' : key)}
            items={[
              { id: 'all', name: 'All conditions' },
              ...conditions.map((c) => ({ id: c.id, name: c.name })),
            ]}
          />
          <FieldSelect
            placeholder="Quick-edit condition…"
            selectedKey=""
            onChange={(key) => {
              if (key) openCreateForCondition(key);
            }}
            items={conditions.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="QHRT mappings">
                <Table.Header>
                  <Table.Column isRowHeader>Condition</Table.Column>
                  <Table.Column>Primary theme</Table.Column>
                  <Table.Column>Organ system</Table.Column>
                  <Table.Column>QHRT focus</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No mappings yet. Select a condition above to create one.'}>
                  {mappings.map((m) => (
                    <Table.Row key={m.id} id={m.id}>
                      <Table.Cell>{condNameMap[m.condition_id] || m.condition_id}</Table.Cell>
                      <Table.Cell>{m.primary_emotional_theme || '—'}</Table.Cell>
                      <Table.Cell>{m.organ_system || '—'}</Table.Cell>
                      <Table.Cell>{m.qhrt_focus || '—'}</Table.Cell>
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

        {/* Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setFormValues({});
            setEditingId(null);
          }}
          title={editingId ? 'Edit QHRT Mapping' : 'New QHRT Mapping'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Condition</label>
              <select
                value={formValues.condition_id}
                onChange={(e) => setFormValues({ ...formValues, condition_id: e.target.value })}
                disabled={!!editingId}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select condition</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Primary Emotional Theme</label>
                <input
                  type="text"
                  value={formValues.primary_emotional_theme}
                  onChange={(e) =>
                    setFormValues({ ...formValues, primary_emotional_theme: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Secondary Emotional Theme
                </label>
                <input
                  type="text"
                  value={formValues.secondary_emotional_theme}
                  onChange={(e) =>
                    setFormValues({ ...formValues, secondary_emotional_theme: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Organ System</label>
                <input
                  type="text"
                  value={formValues.organ_system}
                  onChange={(e) => setFormValues({ ...formValues, organ_system: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Gland System</label>
                <input
                  type="text"
                  value={formValues.gland_system}
                  onChange={(e) => setFormValues({ ...formValues, gland_system: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">QHRT Focus</label>
              <input
                type="text"
                value={formValues.qhrt_focus}
                onChange={(e) => setFormValues({ ...formValues, qhrt_focus: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Internal Notes</label>
              <textarea
                value={formValues.internal_notes}
                onChange={(e) => setFormValues({ ...formValues, internal_notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setModalOpen(false);
                setFormValues({});
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Mapping"
          message="Are you sure you want to delete this mapping? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
