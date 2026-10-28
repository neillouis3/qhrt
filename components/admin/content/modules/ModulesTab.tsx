'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@heroui/react';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from '../shared/ConfirmModal';
import { SearchBox } from '../shared/SearchBox';
import { TableRowActions } from '../shared/TableRowActions';
import { Toggle } from '../shared/Toggle';
import { PlusIcon, primaryButtonClass } from '../assessments/fields';
import type { LearningModule } from '@/lib/modules';

export function ModulesTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const router = useRouter();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<LearningModule | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/modules');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load modules');
      setModules(json.modules ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load modules', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return modules;
    return modules.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.slug.toLowerCase().includes(term) ||
        (item.description ?? '').toLowerCase().includes(term)
    );
  }, [modules, search]);

  return (
    <ContentErrorBoundary fallbackTitle="Modules failed to load">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            A module is a path. Each lesson inside it is either a guide or an assessment.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox placeholder="Search modules" onSearch={setSearch} />
            <button
              type="button"
              onClick={() => router.push('/content/modules/new')}
              className={`${primaryButtonClass} flex shrink-0 items-center gap-2`}
            >
              <PlusIcon />
              Add Module
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-muted">Loading modules…</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Modules">
                <Table.Header>
                  <Table.Column isRowHeader>Title</Table.Column>
                  <Table.Column>Lessons</Table.Column>
                  <Table.Column>Visible</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => 'No modules yet.'}>
                  {rows.map((module) => {
                    const minutes = module.lessons.reduce((sum, lesson) => sum + (lesson.minutes || 0), 0);
                    return (
                      <Table.Row key={module.id} id={module.id}>
                        <Table.Cell>
                          <div className="flex flex-col">
                            <span>{module.title}</span>
                            <span className="font-mono text-xs text-muted">{module.slug}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {module.lessons.length}
                          {minutes > 0 ? <span className="text-muted"> · {minutes} min</span> : null}
                        </Table.Cell>
                        <Table.Cell>
                          <Toggle
                            checked={module.isActive}
                            onChange={() => {
                              void fetch('/api/admin/modules', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: module.id,
                                  title: module.title,
                                  slug: module.slug,
                                  description: module.description,
                                  isActive: !module.isActive,
                                }),
                              }).then((res) => {
                                if (!res.ok) showToast('Failed to update module', 'error');
                                void load();
                              });
                            }}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <TableRowActions
                            onEdit={() => router.push(`/content/modules/${module.id}`)}
                            onDelete={() => setConfirmDelete(module)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        <ConfirmModal
          isOpen={confirmDelete != null}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (!confirmDelete) return;
            void fetch('/api/admin/modules', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: confirmDelete.id }),
            }).then(async (res) => {
              setConfirmDelete(null);
              if (!res.ok) showToast('Could not delete module', 'error');
              else {
                showToast('Module deleted', 'success');
                await load();
              }
            });
          }}
          title="Delete module"
          message="This removes the module and its lessons. Assessments themselves stay in the assessment list."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
