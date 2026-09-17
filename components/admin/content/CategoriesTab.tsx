import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { Toggle } from './shared/Toggle';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import { TableRowActions } from './shared/TableRowActions';
import type { Category } from './types';

export function CategoriesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/categories?search=${encodeURIComponent(search)}`
        : '/api/admin/categories';
      const res = await fetch(url);
      const json = await res.json();
      setCategories(json.categories ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormOrder(categories.length);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormDesc(cat.description ?? '');
    setFormOrder(cat.display_order);
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editingId) {
        await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formName,
            description: formDesc || null,
            display_order: formOrder,
          }),
        });
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDesc || null,
            display_order: formOrder,
          }),
        });
      }
      showToast(editingId ? 'Category updated' : 'Category created', 'success');
      setModalOpen(false);
      fetchCategories();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !categories.find((c) => c.id === id)?.is_active }),
      });
      fetchCategories();
    } catch {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Category deleted', 'success');
      fetchCategories();
    } catch {
      showToast('Failed to delete category', 'error');
    }
    setConfirmDelete(null);
  };

  return (
    <ContentErrorBoundary fallbackTitle="Categories failed to load">
      <div>
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search categories…" onSearch={setSearch} />
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
              Add Category
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
              <Table.Content aria-label="Condition categories">
                <Table.Header>
                  <Table.Column>Order</Table.Column>
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Description</Table.Column>
                  <Table.Column>Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No categories yet. Add one above.'}>
                  {categories.map((cat) => (
                    <Table.Row key={cat.id} id={cat.id}>
                      <Table.Cell>{cat.display_order}</Table.Cell>
                      <Table.Cell>{cat.name}</Table.Cell>
                      <Table.Cell>{cat.description || '—'}</Table.Cell>
                      <Table.Cell>
                        <Toggle checked={cat.is_active} onChange={() => handleToggleActive(cat.id)} />
                      </Table.Cell>
                      <Table.Cell>
                        <TableRowActions
                          onEdit={() => openEdit(cat)}
                          onDelete={() => setConfirmDelete(cat.id)}
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
          title={editingId ? 'Edit Category' : 'New Category'}
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
                placeholder="Category name"
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
              <label className="block text-sm font-medium mb-1.5">Display Order</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
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

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Category"
          message="Are you sure you want to delete this category? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
