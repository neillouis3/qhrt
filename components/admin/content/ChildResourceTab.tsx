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

export function ChildResourceTab({
  title,
  endpoint,
  dataKey,
  nameField,
  namePlaceholder,
  extraFields,
  showToast,
}: {
  title: string;
  endpoint: string;
  dataKey: string;
  nameField: string;
  namePlaceholder: string;
  extraFields?: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'textarea';
    placeholder?: string;
  }>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterConditionId, setFilterConditionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterConditionId) params.set('conditionId', filterConditionId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, condRes] = await Promise.all([fetch(`${endpoint}${qs}`), loadConditions()]);
      setItems((await res.json())[dataKey] ?? []);
      setConditions(condRes);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, filterConditionId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    const vals: Record<string, string | number | boolean> = {};
    vals[nameField] = item[nameField];
    vals.condition_id = item.condition_id;
    if (extraFields) {
      for (const f of extraFields) {
        vals[f.key] = item[f.key] ?? '';
      }
    }
    setFormValues(vals);
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!String(formValues[nameField] ?? '').trim() || !formValues.condition_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      if (editingId) {
        body.id = editingId;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch(endpoint, {
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
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const condNameMap = Object.fromEntries(conditions.map((c) => [c.id, c.name]));
  const formFields = [
    { key: nameField, label: 'Name', type: 'text' as const, placeholder: namePlaceholder },
    ...(extraFields ?? []),
  ];

  return (
    <ContentErrorBoundary fallbackTitle={`${title} failed to load`}>
      <div>
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <SearchBox placeholder={`Search ${title.toLowerCase()}…`} onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={conditions.length === 0}
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
              Add {title.slice(-1) === 's' ? title.slice(0, -1) : title}
            </button>
          </div>
        </div>

        <div className="mb-3 max-w-xs">
          <FieldSelect
            placeholder="All conditions"
            selectedKey={filterConditionId || 'all'}
            onChange={(key) => setFilterConditionId(key === 'all' ? '' : key)}
            items={[
              { id: 'all', name: 'All conditions' },
              ...conditions.map((c) => ({ id: c.id, name: c.name })),
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
              <Table.Content aria-label={title}>
                <Table.Header>
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Condition</Table.Column>
                  {extraFields?.map((f) => (
                    <Table.Column key={f.key} id={f.key}>
                      {f.label}
                    </Table.Column>
                  ))}
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No items yet.'}>
                  {items.map((item: any) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>{item[nameField]}</Table.Cell>
                      <Table.Cell>{condNameMap[item.condition_id] || item.condition_id}</Table.Cell>
                      {extraFields?.map((f) => (
                        <Table.Cell key={f.key}>{String(item[f.key] ?? '')}</Table.Cell>
                      ))}
                      <Table.Cell>
                        <TableRowActions
                          onEdit={() => openEdit(item)}
                          onDelete={() => setConfirmDelete(item.id)}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
            editingId
              ? `Edit ${title.slice(-1) === 's' ? title.slice(0, -1) : title}`
              : `New ${title.slice(-1) === 's' ? title.slice(0, -1) : title}`
          }
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.condition_id ?? '')}
                onChange={(e) => setFormValues({ ...formValues, condition_id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select condition</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {formFields
              .filter((f) => f.key !== 'condition_id')
              .map((f) =>
                f.type === 'textarea' ? (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                    <textarea
                      value={String(formValues[f.key] ?? '')}
                      onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                      placeholder={f.placeholder || f.label}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ) : (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={String(formValues[f.key] ?? '')}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      placeholder={f.placeholder || f.label}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                )
              )}
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
              disabled={!String(formValues[nameField] ?? '').trim() || !formValues.condition_id}
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
          title="Delete Item"
          message="Are you sure you want to delete this item? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
