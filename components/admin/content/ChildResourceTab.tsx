import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { loadConditions } from './shared/loadConditions';
import { SearchBox } from './shared/SearchBox';
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
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

        <div className="mb-3">
          <select
            value={filterConditionId}
            onChange={(e) => setFilterConditionId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All conditions</option>
            {conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">
                    Condition
                  </th>
                  {extraFields?.map((f) => (
                    <th
                      key={f.key}
                      className="text-left py-2.5 px-3 font-medium hidden lg:table-cell"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium max-w-xs truncate">{item[nameField]}</td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell">
                      {condNameMap[item.condition_id] || item.condition_id}
                    </td>
                    {extraFields?.map((f) => (
                      <td
                        key={f.key}
                        className="py-2.5 px-3 text-muted hidden lg:table-cell max-w-xs truncate"
                      >
                        {String(item[f.key] ?? '')}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4 + (extraFields?.length || 0)}
                      className="py-8 text-center text-muted"
                    >
                      No items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
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
