import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { Toggle } from './shared/Toggle';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import type { Category, Condition } from './types';

export function ConditionsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formOrder, setFormOrder] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const condUrl = search
        ? `/api/admin/conditions?search=${encodeURIComponent(search)}`
        : '/api/admin/conditions';
      const [condRes, catRes] = await Promise.all([
        fetch(condUrl),
        fetch('/api/admin/categories?activeOnly=false'),
      ]);
      setConditions((await condRes.json()).conditions ?? []);
      setCategories((await catRes.json()).categories ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormName('');
    setFormCategoryId('');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormFeatured(false);
    setFormOrder(conditions.length);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c: Condition) => {
    setFormName(c.name);
    setFormCategoryId(c.category_id);
    setFormShortDesc(c.short_description ?? '');
    setFormFullDesc(c.full_description ?? '');
    setFormFeatured(c.is_featured);
    setFormOrder(c.display_order);
    setEditingId(c.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formCategoryId) return;
    try {
      if (editingId) {
        await fetch('/api/admin/conditions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formName,
            category_id: formCategoryId,
            short_description: formShortDesc || null,
            full_description: formFullDesc || null,
            is_featured: formFeatured,
            display_order: formOrder,
          }),
        });
      } else {
        await fetch('/api/admin/conditions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            category_id: formCategoryId,
            short_description: formShortDesc || null,
            full_description: formFullDesc || null,
            is_featured: formFeatured,
            display_order: formOrder,
          }),
        });
      }
      showToast(editingId ? 'Condition updated' : 'Condition created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await fetch('/api/admin/conditions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !conditions.find((c) => c.id === id)?.is_active }),
      });
      fetchData();
    } catch {
      showToast('Failed to update condition', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/conditions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Condition deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete condition', 'error');
    }
    setConfirmDelete(null);
  };

  const catNameMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <ContentErrorBoundary fallbackTitle="Conditions failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Conditions</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search conditions…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={categories.length === 0}
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
              Add Condition
            </button>
          </div>
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
                  <th className="text-left py-2.5 px-3 font-medium">Order</th>
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium">Featured</th>
                  <th className="text-center py-2.5 px-3 font-medium">Active</th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-muted">{c.display_order}</td>
                    <td className="py-2.5 px-3 font-medium">{c.name}</td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell">
                      {catNameMap[c.category_id] || c.category_id}
                    </td>
                    <td className="py-2.5 px-3 text-center">{c.is_featured ? '⭐' : '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Toggle checked={c.is_active} onChange={() => handleToggleActive(c.id)} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {conditions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No conditions yet. Use the seed button or add one above.
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
          title={editingId ? 'Edit Condition' : 'New Condition'}
          size="lg"
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
                placeholder="Condition name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Short Description</label>
              <input
                type="text"
                value={formShortDesc}
                onChange={(e) => setFormShortDesc(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Description</label>
              <textarea
                value={formFullDesc}
                onChange={(e) => setFormFullDesc(e.target.value)}
                placeholder="Detailed description"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded border-border"
                />
                Featured
              </label>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
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
              disabled={!formName.trim() || !formCategoryId}
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
          title="Delete Condition"
          message="Are you sure you want to delete this condition? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
