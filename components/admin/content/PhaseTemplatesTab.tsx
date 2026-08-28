import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { SearchBox } from './shared/SearchBox';

interface PhaseTemplate {
  id: string;
  phase_order: number;
  phase_key: string;
  name: string;
  description: string | null;
  client_script: string | null;
  practitioner_protocol: string | null;
  transition_rule_description: string | null;
}

export function PhaseTemplatesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [templates, setTemplates] = useState<PhaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/phase-templates?search=${encodeURIComponent(search)}`
        : '/api/admin/phase-templates';
      const res = await fetch(url);
      setTemplates((await res.json()).phase_templates ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load phase templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: PhaseTemplate) => {
    setFormValues({
      id: item.id,
      phase_order: String(item.phase_order),
      phase_key: item.phase_key || '',
      name: item.name || '',
      description: item.description || '',
      client_script: item.client_script || '',
      practitioner_protocol: item.practitioner_protocol || '',
      transition_rule_description: item.transition_rule_description || '',
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const body: Record<string, any> = { ...formValues };
      if (body.phase_order) body.phase_order = parseInt(body.phase_order, 10);
      await fetch('/api/admin/phase-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showToast(editingId ? 'Phase template updated' : 'Phase template created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  return (
    <ContentErrorBoundary fallbackTitle="Phase Templates failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Phase Templates</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search templates…" onSearch={setSearch} />
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
              Add Phase Template
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
            <p className="text-muted dark:text-gray-400">No phase templates configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Key</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Client Script</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-t border-border dark:border-gray-700">
                    <td className="px-4 py-3">{t.phase_order}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.phase_key}</td>
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted dark:text-gray-400">
                      {t.client_script || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(t)}
                        className="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit Phase Template' : 'Add Phase Template'}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            {!editingId && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted dark:text-gray-400">
                    Phase Order
                  </label>
                  <input
                    type="number"
                    value={formValues.phase_order || ''}
                    onChange={(e) => setFormValues({ ...formValues, phase_order: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
                    placeholder="1–8"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted dark:text-gray-400">
                    Phase Key
                  </label>
                  <input
                    type="text"
                    value={formValues.phase_key || ''}
                    onChange={(e) => setFormValues({ ...formValues, phase_key: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
                    placeholder="e.g. conscious_regulatory_activation"
                  />
                </div>
              </>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">Name</label>
              <input
                type="text"
                value={formValues.name || ''}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
                placeholder="Phase display name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Description
              </label>
              <textarea
                value={formValues.description || ''}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Client Script (streamlined prompt)
              </label>
              <textarea
                value={formValues.client_script || ''}
                onChange={(e) => setFormValues({ ...formValues, client_script: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Practitioner Protocol (admin-only)
              </label>
              <textarea
                value={formValues.practitioner_protocol || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, practitioner_protocol: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Transition Rule Description
              </label>
              <textarea
                value={formValues.transition_rule_description || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, transition_rule_description: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
              />
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ContentErrorBoundary>
  );
}
