'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button, Input, Label, TextArea, Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@hugeicons/core-free-icons';
import AppCard from '@/components/ui/AppCard';
import Modal from '@/components/ui/Modal';
import UserPageShell from '@/components/layout/UserPageShell';
import { PageHeader } from '@/components/layout/UserPageShell';
import { DiarySkeleton } from '@/components/layout/PageSkeleton';
import { CheckInButtons } from '@/components/home/HomeDashboardSections';
import { formatLongDate, toDateKey } from '@/lib/dateKey';
import {
  diaryMoodFromCheckIn,
  isHomeCheckInDiaryEntry,
  type HomeCheckInDay,
  type HomeCheckInValue,
} from '@/lib/homeCheckIn';
import { DIARY_MOODS, type DiaryCompletion, type DiaryEntry, type DiaryMood } from '@/lib/types/diary';
import { clearSessionCache } from '@/hooks/useSession';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const KIND_LABEL: Record<DiaryCompletion['kind'], string> = {
  assessment: 'Workbook',
  module: 'Module',
};

function MonthStat({ label, value }: { label: string; value: number }) {
  return (
    <AppCard className="flex flex-1 flex-col gap-1 px-4 py-3">
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
      <Typography type="h5" weight="normal">
        {value}
      </Typography>
    </AppCard>
  );
}

function DayBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
      {children}
    </section>
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function moodLabel(mood: DiaryMood | null): string | null {
  if (mood == null) return null;
  return DIARY_MOODS.find((item) => item.value === mood)?.label ?? null;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [completions, setCompletions] = useState<DiaryCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [composer, setComposer] = useState('');
  const [mood, setMood] = useState<DiaryMood | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<HomeCheckInDay[]>([]);
  const [checkInSaving, setCheckInSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/diary');
      if (!res.ok) throw new Error('Failed to load diary');
      const data = await res.json();
      setEntries(data.entries ?? []);
      setCompletions(data.completions ?? []);
      setCheckIns(Array.isArray(data.checkIns) ? data.checkIns : []);
    } catch (err) {
      console.error('[Diary] Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    setComposer('');
  }, [selectedDate]);

  const checkInByDate = useMemo(() => {
    const map = new Map<string, HomeCheckInValue>();
    for (const item of checkIns) map.set(item.date, item.value);
    return map;
  }, [checkIns]);

  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    for (const entry of entries) {
      const key = toDateKey(entry.entry_date);
      if (key) dates.add(key);
    }
    return dates;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(month);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: Array<{ key: string; day: number; inMonth: boolean } | null> = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ key: toDateKey(date), day, inMonth: true });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const dayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.entry_date === selectedDate && !isHomeCheckInDiaryEntry(entry))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [entries, selectedDate]
  );

  const selectedCheckIn = checkInByDate.get(selectedDate) ?? null;

  const handleCheckIn = async (value: HomeCheckInValue) => {
    if (selectedDate !== todayKey || selectedCheckIn) return;
    setCheckInSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user/home-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save check-in.');
      }
      clearSessionCache();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save check-in.');
    } finally {
      setCheckInSaving(false);
    }
  };

  const dayCompletions = useMemo(
    () =>
      completions
        .filter((item) => toDateKey(item.at) === selectedDate)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [completions, selectedDate]
  );

  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const monthStats = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const noteCount = entries.filter((entry) => entry.entry_date.startsWith(prefix)).length;
    const completedCount = completions.filter((item) => toDateKey(item.at).startsWith(prefix)).length;
    return { noteCount, completedCount };
  }, [completions, entries, month]);

  const openEdit = (entry: DiaryEntry) => {
    setEditing(entry);
    setTitle(entry.title ?? '');
    setBody(entry.body);
    setMood(entry.mood);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Write a note before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        entryDate: selectedDate,
        title: title.trim(),
        body: trimmed,
        mood,
      };
      const res = await fetch(editing ? `/api/diary/${editing.id}` : '/api/diary', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save note');
      }
      setFormOpen(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  const handleComposerSave = async () => {
    if (selectedDate > todayKey) return;
    const trimmed = composer.trim();
    if (!trimmed) {
      setError('Write a note before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate: selectedDate,
          title: '',
          body: trimmed,
          mood: selectedCheckIn ? diaryMoodFromCheckIn(selectedCheckIn) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save note');
      }
      setComposer('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/diary/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not delete note');
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete note');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <DiarySkeleton />;
  }

  return (
    <UserPageShell wide="75">
      <PageHeader
        title="Diary"
        subtitle="A quiet place for the day's check-ins, finished work, and notes."
      />

      {error && (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <AppCard className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Typography type="body">{monthLabel}</Typography>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/10"
                  onClick={() => setMonth((current) => addMonths(current, -1))}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/10"
                  onClick={() => setMonth((current) => addMonths(current, 1))}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <Typography
                  key={day}
                  type="body-xs"
                  color="muted"
                  className="flex h-7 items-center justify-center"
                >
                  {day.slice(0, 2)}
                </Typography>
              ))}
              {calendarDays.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                const isSelected = cell.key === selectedDate;
                const isToday = cell.key === todayKey;
                const isFuture = cell.key > todayKey;
                const hasEntry = !isFuture && entryDates.has(cell.key);
                const dayCheckIn = !isFuture ? checkInByDate.get(cell.key) : null;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      if (!isFuture) setSelectedDate(cell.key);
                    }}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm leading-none transition-colors ${
                      isFuture
                        ? 'cursor-default text-muted opacity-40'
                        : isSelected
                          ? 'bg-accent-soft text-accent'
                          : isToday
                            ? 'font-medium text-foreground ring-1 ring-border ring-inset hover:bg-muted/10'
                            : 'text-foreground hover:bg-muted/10'
                    }`}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    aria-disabled={isFuture}
                    aria-label={
                      dayCheckIn
                        ? `${cell.day}, checked in`
                        : hasEntry
                          ? `${cell.day}, has a diary entry`
                          : isToday
                            ? `${cell.day}, today`
                            : String(cell.day)
                    }
                  >
                    {cell.day}
                    {dayCheckIn ? (
                      <HugeiconsIcon
                        icon={dayCheckIn === 'up' ? ThumbsUpIcon : ThumbsDownIcon}
                        size={10}
                        strokeWidth={1.5}
                        className={isSelected ? 'text-accent' : 'text-primary'}
                        aria-hidden
                      />
                    ) : (
                      <span
                        className={`size-1.5 rounded-full ${
                          hasEntry ? (isSelected ? 'bg-accent' : 'bg-primary') : 'bg-transparent'
                        }`}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </AppCard>

          <div className="grid grid-cols-2 gap-3">
            <MonthStat label="Completed" value={monthStats.completedCount} />
            <MonthStat label="Notes" value={monthStats.noteCount} />
          </div>
        </aside>

        <section className="flex min-h-[28rem] flex-col gap-8">
          <div className="flex min-w-0 flex-col gap-1">
            <Typography type="h4" weight="normal">
              {formatLongDate(selectedDate)}
            </Typography>
            {selectedDate === todayKey ? (
              <Typography type="body-xs" color="muted">
                Today
              </Typography>
            ) : null}
          </div>

          <DayBlock label="Check-in">
            {selectedDate > todayKey ? (
              <Typography type="body-sm" color="muted">
                Check-ins are only for today or past days.
              </Typography>
            ) : selectedCheckIn ? (
              <div className="flex flex-wrap items-center gap-3">
                <CheckInButtons value={selectedCheckIn} disabled onPick={() => undefined} />
                <Typography type="body-sm">
                  {selectedCheckIn === 'up' ? 'Doing okay' : 'A harder day'}
                </Typography>
              </div>
            ) : selectedDate === todayKey ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  How is today feeling?
                </Typography>
                <CheckInButtons
                  value={null}
                  loading={checkInSaving}
                  onPick={(value) => void handleCheckIn(value)}
                />
              </div>
            ) : (
              <Typography type="body-sm" color="muted">
                No check-in recorded this day.
              </Typography>
            )}
          </DayBlock>

          <DayBlock label="Completed">
            {dayCompletions.length === 0 ? (
              selectedDate === todayKey ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Typography type="body-sm" color="muted">
                    Finish a module and it will land here.
                  </Typography>
                  <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                    Open modules
                  </Link>
                </div>
              ) : (
                <Typography type="body-sm" color="muted">
                  Nothing was completed on this day.
                </Typography>
              )
            ) : (
              <ul className="flex flex-col gap-2">
                {dayCompletions.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <Typography type="body-sm">{item.title}</Typography>
                      <Typography type="body-xs" color="muted">
                        {KIND_LABEL[item.kind]}
                      </Typography>
                    </div>
                    <Typography type="body-xs" color="muted" className="shrink-0">
                      {new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </li>
                ))}
              </ul>
            )}
          </DayBlock>

          <DayBlock label="Notes">
            {selectedDate > todayKey ? (
              <Typography type="body-sm" color="muted">
                Notes are only for today or past days.
              </Typography>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <TextArea
                    id="diary-composer"
                    fullWidth
                    rows={4}
                    placeholder="Write a line about how this day felt."
                    value={composer}
                    disabled={saving}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        void handleComposerSave();
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="primary"
                      isPending={saving && !formOpen}
                      isDisabled={saving || !composer.trim()}
                      onPress={handleComposerSave}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                {dayEntries.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {dayEntries.map((entry, index) => {
                      const moodText = moodLabel(entry.mood);
                      return (
                        <article
                          key={entry.id}
                          className={
                            index === 0
                              ? 'flex flex-col gap-3'
                              : 'flex flex-col gap-3 border-t border-border pt-4'
                          }
                        >
                          {entry.title ? (
                            <Typography type="body">{entry.title}</Typography>
                          ) : null}
                          <Typography type="body-sm">{entry.body}</Typography>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Typography type="body-xs" color="muted">
                              {moodText ? `${moodText} · ` : ''}
                              {new Date(entry.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onPress={() => openEdit(entry)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                isPending={deletingId === entry.id}
                                isDisabled={deletingId === entry.id}
                                onPress={() => handleDelete(entry.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </DayBlock>
        </section>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit note' : 'Add a note'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Typography type="body-sm" color="muted">
            {formatLongDate(selectedDate)}
          </Typography>
          <div className="flex flex-col gap-1">
            <Label htmlFor="diary-title">Title</Label>
            <Input
              id="diary-title"
              fullWidth
              placeholder="Optional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="diary-body">Note</Label>
            <TextArea
              id="diary-body"
              fullWidth
              rows={5}
              placeholder="What felt true today? What do you want to remember?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Typography type="body-xs" color="muted">
              Mood
            </Typography>
            <div className="flex flex-wrap gap-2">
              {DIARY_MOODS.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={mood === item.value ? 'secondary' : 'outline'}
                  onPress={() => setMood((current) => (current === item.value ? null : item.value))}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="tertiary" isDisabled={saving} onPress={closeForm}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" isPending={saving} isDisabled={saving} onPress={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </UserPageShell>
  );
}
