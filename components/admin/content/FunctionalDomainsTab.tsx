import { useState, useEffect, useCallback } from 'react';
import { Table } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { SearchBox } from './shared/SearchBox';
import { TableRowActions } from './shared/TableRowActions';

interface FunctionalDomain {
  id: string;
  name: string;
  description: string | null;
  delivery_content: any;
  is_active: boolean;
}

export function FunctionalDomainsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [domains, setDomains] = useState<FunctionalDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/domain-protocols?search=${encodeURIComponent(search)}`
        : '/api/admin/domain-protocols';
      const res = await fetch(url);
      setDomains((await res.json()).functional_domain_protocols ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load functional domains', 'error');
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

  const openEdit = (item: FunctionalDomain) => {
    setFormValues({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      delivery_content:
        typeof item.delivery_content === 'string'
          ? item.delivery_content
          : JSON.stringify(item.delivery_content || {}),
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const body: Record<string, any> = { ...formValues };
      try {
        body.delivery_content = JSON.parse(String(formValues.delivery_content));
      } catch {
        body.delivery_content = {};
      }
      if (editingId) {
        body.id = editingId;
      }
      await fetch('/api/admin/domain-protocols', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showToast(editingId ? 'Domain updated' : 'Domain created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  return (
    <ContentErrorBoundary fallbackTitle="Functional Domains failed to load">
      <div>
        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search domains…" onSearch={setSearch} />
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
              Add Domain
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Functional domains">
                <Table.Header>
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Description</Table.Column>
                  <Table.Column>Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No functional domains configured yet.'}>
                  {domains.map((d) => (
                    <Table.Row key={d.id} id={d.id}>
                      <Table.Cell>{d.name}</Table.Cell>
                      <Table.Cell>{d.description || '—'}</Table.Cell>
                      <Table.Cell>{d.is_active ? 'Active' : 'Inactive'}</Table.Cell>
                      <Table.Cell>
                        <TableRowActions onEdit={() => openEdit(d)} />
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
          title={editingId ? 'Edit Functional Domain' : 'Add Functional Domain'}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">Name</label>
              <input
                type="text"
                value={formValues.name || ''}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Body Composition"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Delivery Content (JSON)
              </label>
              <textarea
                value={formValues.delivery_content || '{}'}
                onChange={(e) => setFormValues({ ...formValues, delivery_content: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                placeholder='{"phase_key": {"client_script": "..."}}'
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
