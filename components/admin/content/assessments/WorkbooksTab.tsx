import { useCallback, useEffect, useState } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from '../shared/ConfirmModal';
import { Toggle } from '../shared/Toggle';
import { TableRowActions } from '../shared/TableRowActions';
import type { Workbook } from '@/lib/assessments/types';
import { Field, PlusIcon, inputClass, primaryButtonClass, secondaryButtonClass } from './fields';

interface WorkbookForm {
  title: string;
  description: string;
  url: string;
  display_order: number;
}

const EMPTY_FORM: WorkbookForm = { title: '', description: '', url: '', display_order: 0 };

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
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkbookForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/workbooks');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setWorkbooks(json.workbooks ?? []);
    } catch {
      showToast('Failed to load workbooks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, display_order: workbooks.length + 1 });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (w: Workbook) => {
    setForm({
      title: w.title,
      description: w.description ?? '',
      url: w.url,
      display_order: w.display_order,
    });
    setEditingId(w.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const error = editingId
      ? await send('PATCH', { id: editingId, ...form })
      : await send('POST', form);
    setSaving(false);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast(editingId ? 'Workbook updated' : 'Workbook created', 'success');
    setModalOpen(false);
    fetchData();
  };

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

  return (
    <ContentErrorBoundary fallbackTitle="Workbooks failed to load">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Workbooks are the links people get after an assessment. Attach them to outcomes in the
            assessment builder.
          </p>
          <button onClick={openCreate} className={`${primaryButtonClass} flex shrink-0 items-center gap-2`}>
            <PlusIcon />
            Add Workbook
          </button>
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
                  <Table.Column>Order</Table.Column>
                  <Table.Column>Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No workbooks yet.'}>
                  {workbooks.map((w) => (
                    <Table.Row key={w.id} id={w.id}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          <span>{w.title}</span>
                          {w.description && <span className="text-xs text-muted">{w.description}</span>}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-xs">{w.url}</span>
                      </Table.Cell>
                      <Table.Cell>{w.display_order}</Table.Cell>
                      <Table.Cell>
                        <Toggle checked={w.is_active} onChange={() => handleToggleActive(w)} />
                      </Table.Cell>
                      <Table.Cell>
                        <TableRowActions onEdit={() => openEdit(w)} onDelete={() => setConfirmDelete(w.id)} />
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
          title={editingId ? 'Edit Workbook' : 'New Workbook'}
          size="md"
        >
          <div className="space-y-4">
            <Field label="Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Weekly Routine Reset"
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="One line shown under the title"
                className={inputClass}
              />
            </Field>
            <Field label="Link" required hint="An in-app path like /diary, or a full https:// URL.">
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="/diary or https://…"
                className={inputClass}
              />
            </Field>
            <Field label="Display order">
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) || 0 })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setModalOpen(false)} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.title.trim() || !form.url.trim()}
              className={primaryButtonClass}
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>

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
