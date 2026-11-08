'use client';

import { useEffect, useRef, useState } from 'react';
import type { GuideStep } from '@/lib/modules';
import {
  SLIDE_FONTS,
  blocksFromLegacy,
  imageBlock,
  shapeBlock,
  starterBlocks,
  textBlock,
  type SlideBlock,
} from '@/lib/slides';
import SlideStage from '@/components/slides/SlideStage';
import { HugeiconsIcon } from '@hugeicons/react';
import { FullScreenIcon } from '@hugeicons/core-free-icons';
import { Field, inputClass, smallButtonClass } from '../assessments/fields';

function designedStep(index: number): GuideStep {
  return {
    key: `slide_${index}`,
    title: `Slide ${index}`,
    paragraphs: [],
    points: [],
    section: 'Presentation',
    voiceover: '',
    domain: null,
    background: '#f7f4ef',
    blocks: starterBlocks(),
  };
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 960;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not read that picture.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let quality = 0.72;
  let url = canvas.toDataURL(mime, quality);
  while (url.length > 350000 && quality > 0.4 && mime === 'image/jpeg') {
    quality -= 0.12;
    url = canvas.toDataURL(mime, quality);
  }
  if (url.length > 500000) throw new Error('That picture is too large. Use a smaller one.');
  return url;
}

export function PresentationEditor({
  steps,
  onChange,
  onError,
}: {
  steps: GuideStep[];
  onChange: (steps: GuideStep[]) => void;
  onError: (message: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slide = steps[index] ?? steps[0];
  const blocks = slide?.blocks ?? [];
  const selected = blocks.find((block) => block.id === selectedId) ?? null;
  const designed = blocks.length > 0;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!selectedId) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeBlock(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // removeBlock closes over the current slide; rebinding on selection is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, index, steps]);

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement == null) setFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.fullscreenElement) return;
      setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [full]);

  const enterFull = async () => {
    setFull(true);
    try {
      await rootRef.current?.requestFullscreen();
    } catch {
      // The editor still covers the page when the browser declines fullscreen.
    }
  };

  const exitFull = async () => {
    setFull(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The overlay closes either way.
      }
    }
  };

  if (!slide) return null;

  const update = (next: GuideStep) => {
    const copy = steps.slice();
    copy[index] = next;
    onChange(copy);
  };

  const updateBlock = (id: string, patch: Partial<SlideBlock>) => {
    update({
      ...slide,
      blocks: blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    });
  };

  const currentBlocks = () =>
    blocks.length > 0 ? blocks : blocksFromLegacy(slide.title, slide.paragraphs, slide.points);

  const addBlock = (block: SlideBlock) => {
    update({ ...slide, background: slide.background || '#f7f4ef', blocks: [...currentBlocks(), block] });
    setSelectedId(block.id);
  };

  const removeBlock = (id: string) => {
    update({ ...slide, blocks: blocks.filter((block) => block.id !== id) });
    setSelectedId(null);
  };

  const shiftBlock = (id: string, direction: -1 | 1) => {
    const from = blocks.findIndex((block) => block.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= blocks.length) return;
    const copy = blocks.slice();
    const [item] = copy.splice(from, 1);
    if (!item) return;
    copy.splice(to, 0, item);
    update({ ...slide, blocks: copy });
  };

  const placeImage = async (file: File, x: number, y: number) => {
    try {
      const src = await compressImage(file);
      addBlock(imageBlock({ src, x: Math.max(0, x - 160), y: Math.max(0, y - 110) }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not add that picture.');
    }
  };

  const pageSwatches = ['#f6f1e4', '#ffffff', '#f7f4ef', '#e7f0ea', '#1c1917'];

  return (
    <div
      ref={rootRef}
      className={
        full
          ? 'fixed inset-0 z-[80] flex h-screen w-screen bg-[#eceae6]'
          : 'flex h-[calc(100svh-var(--app-navbar-height)-9.5rem)] min-h-[640px] min-w-[960px] overflow-hidden rounded-xl border border-border bg-background'
      }
    >
      {full ? null : (
      <aside className="flex w-44 shrink-0 flex-col border-r border-border bg-background">
        <p className="px-3 pt-3 pb-2 text-xs font-medium text-muted">Pages</p>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
          {steps.map((item, itemIndex) => (
            <button
              key={`${item.key}-${itemIndex}`}
              type="button"
              className={`rounded-lg border p-1 text-left ${itemIndex === index ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-foreground/30'}`}
              onClick={() => {
                setIndex(itemIndex);
                setSelectedId(null);
              }}
            >
              <div className="pointer-events-none overflow-hidden rounded-md">
                <SlideStage background={item.background} blocks={item.blocks ?? []} />
              </div>
              <span className="mt-1 block truncate px-1 text-[11px] text-muted">
                {itemIndex + 1}. {item.title || `Page ${itemIndex + 1}`}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="rounded-lg border border-dashed border-border px-2 py-3 text-xs text-muted hover:border-foreground/30 hover:text-foreground"
            onClick={() => {
              const next = [...steps, designedStep(steps.length + 1)];
              onChange(next);
              setIndex(next.length - 1);
              setSelectedId(null);
            }}
          >
            Add page
          </button>
        </div>
        <div className="flex flex-col gap-1 border-t border-border p-3">
          <button
            type="button"
            className={smallButtonClass}
            disabled={index === 0}
            onClick={() => {
              if (index === 0) return;
              const copy = steps.slice();
              const [item] = copy.splice(index, 1);
              if (!item) return;
              copy.splice(index - 1, 0, item);
              onChange(copy);
              setIndex(index - 1);
            }}
          >
            Move up
          </button>
          <button
            type="button"
            className={smallButtonClass}
            disabled={index >= steps.length - 1}
            onClick={() => {
              if (index >= steps.length - 1) return;
              const copy = steps.slice();
              const [item] = copy.splice(index, 1);
              if (!item) return;
              copy.splice(index + 1, 0, item);
              onChange(copy);
              setIndex(index + 1);
            }}
          >
            Move down
          </button>
          <button
            type="button"
            className={smallButtonClass}
            onClick={() => {
              const copy = structuredClone(slide);
              copy.key = `slide_${steps.length + 1}`;
              copy.blocks = (copy.blocks ?? []).map((block) => ({ ...block, id: `${block.id}_c${steps.length}` }));
              const next = steps.slice();
              next.splice(index + 1, 0, copy);
              onChange(next);
              setIndex(index + 1);
              setSelectedId(null);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className={smallButtonClass}
            disabled={steps.length < 2}
            onClick={() => {
              const next = steps.filter((_, itemIndex) => itemIndex !== index);
              onChange(next);
              setIndex(Math.max(0, index - 1));
              setSelectedId(null);
            }}
          >
            Delete page
          </button>
        </div>
      </aside>
      )}

      <div className={`relative flex min-h-0 min-w-0 flex-1 flex-col ${full ? '' : 'bg-foreground/[0.04]'}`}>
        {full ? null : (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background px-3 py-2">
          <button type="button" className={smallButtonClass} onClick={() => addBlock(textBlock({ text: 'Text', x: 80, y: 80, w: 280, h: 64, fontSize: 28 }))}>
            Text
          </button>
          <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'round' }))}>
            Card
          </button>
          <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'ellipse', w: 120, h: 120 }))}>
            Circle
          </button>
          <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'line', w: 220, h: 28, arrow: true, stroke: '#44403c' }))}>
            Arrow
          </button>
          <button type="button" className={smallButtonClass} onClick={() => fileRef.current?.click()}>
            Picture
          </button>
          <button
            type="button"
            className={smallButtonClass}
            onClick={() => {
              const row = [0, 1, 2].flatMap((column) => {
                const x = 56 + column * 300;
                return [
                  shapeBlock({ shape: 'round', x, y: 180, w: 270, h: 250, fill: '#ffffff', stroke: '#e7e5e4' }),
                  textBlock({ text: `Card ${column + 1}`, x: x + 16, y: 200, w: 238, h: 48, fontSize: 22, fontWeight: 600 }),
                ];
              });
              update({ ...slide, background: slide.background || '#f7f4ef', blocks: [...currentBlocks(), ...row] });
            }}
          >
            3 cards
          </button>
          <button type="button" className={`${smallButtonClass} ml-auto inline-flex items-center`} aria-label="Full screen" onClick={() => void enterFull()}>
            <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={1.5} />
          </button>
        </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void placeImage(file, 480, 220);
          }}
        />
        <div className={full ? 'flex min-h-0 flex-1 items-center justify-center p-8 pb-28' : 'min-h-0 flex-1 overflow-auto p-8'}>
          <div className={full ? 'w-[min(92vw,calc((100svh-8rem)*16/9))] shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)]' : 'mx-auto w-full max-w-5xl shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)]'}>
            {designed ? (
              <SlideStage
                background={slide.background}
                blocks={blocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={(id, x, y) => updateBlock(id, { x, y })}
                onResize={(id, w, h) => updateBlock(id, { w, h })}
                onDropImage={(file, x, y) => void placeImage(file, x, y)}
              />
            ) : (
              <div className="flex aspect-video flex-col justify-center gap-3 rounded-lg border border-border bg-background p-8">
                <p className="text-sm text-muted">
                  This page is still title and points. Lay it out to place text, pictures, and cards.
                </p>
                <button
                  type="button"
                  className={`${smallButtonClass} w-fit`}
                  onClick={() =>
                    update({
                      ...slide,
                      background: slide.background || '#f7f4ef',
                      blocks: blocksFromLegacy(slide.title, slide.paragraphs, slide.points),
                    })
                  }
                >
                  Lay this page out
                </button>
                <Field label="On-screen text" hint="One paragraph per line.">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={slide.paragraphs.join('\n')}
                    onChange={(event) => update({ ...slide, paragraphs: event.target.value.split('\n') })}
                  />
                </Field>
                <Field label="Points" hint="One point per line.">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={slide.points.join('\n')}
                    onChange={(event) => update({ ...slide, points: event.target.value.split('\n') })}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
        {full ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-full flex-col items-center gap-2">
              {selected ? (
                <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-lg">
                  <span className="text-xs text-muted">
                    {selected.type === 'text' ? 'Text' : selected.type === 'image' ? 'Picture' : 'Shape'}
                  </span>
                  {selected.type === 'text' ? (
                    <>
                      <input
                        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs"
                        type="number"
                        min={10}
                        max={96}
                        aria-label="Size"
                        value={selected.fontSize}
                        onChange={(event) => updateBlock(selected.id, { fontSize: Number(event.target.value) || 16 })}
                      />
                      <input
                        className="h-8 w-8 cursor-pointer rounded border border-border bg-background"
                        type="color"
                        aria-label="Color"
                        value={/^#[0-9a-fA-F]{6}$/.test(selected.color) ? selected.color : '#1c1917'}
                        onChange={(event) => updateBlock(selected.id, { color: event.target.value })}
                      />
                    </>
                  ) : null}
                  {selected.type === 'shape' ? (
                    <input
                      className="h-8 w-8 cursor-pointer rounded border border-border bg-background"
                      type="color"
                      aria-label="Fill"
                      value={/^#[0-9a-fA-F]{6}$/.test(selected.fill) ? selected.fill : '#ffffff'}
                      onChange={(event) => updateBlock(selected.id, { fill: event.target.value })}
                    />
                  ) : null}
                  <button type="button" className={smallButtonClass} onClick={() => removeBlock(selected.id)}>
                    Delete
                  </button>
                </div>
              ) : null}
              <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-background/95 px-2 py-2 shadow-lg backdrop-blur">
                <button
                  type="button"
                  className={smallButtonClass}
                  disabled={index === 0}
                  onClick={() => {
                    setIndex(index - 1);
                    setSelectedId(null);
                  }}
                >
                  Previous
                </button>
                <span className="px-2 text-xs text-muted">
                  {index + 1} / {steps.length}
                </span>
                <button
                  type="button"
                  className={smallButtonClass}
                  disabled={index >= steps.length - 1}
                  onClick={() => {
                    setIndex(index + 1);
                    setSelectedId(null);
                  }}
                >
                  Next
                </button>
                <span className="mx-1 h-5 w-px bg-border" />
                <button type="button" className={smallButtonClass} onClick={() => addBlock(textBlock({ text: 'Text', x: 80, y: 80, w: 280, h: 64, fontSize: 28 }))}>
                  Text
                </button>
                <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'round' }))}>
                  Card
                </button>
                <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'ellipse', w: 120, h: 120 }))}>
                  Circle
                </button>
                <button type="button" className={smallButtonClass} onClick={() => addBlock(shapeBlock({ shape: 'line', w: 220, h: 28, arrow: true, stroke: '#44403c' }))}>
                  Arrow
                </button>
                <button type="button" className={smallButtonClass} onClick={() => fileRef.current?.click()}>
                  Picture
                </button>
                <span className="mx-1 h-5 w-px bg-border" />
                <button type="button" className={smallButtonClass} onClick={() => void exitFull()}>
                  Exit
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {full ? null : (
      <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-background p-4">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Page</p>
          <Field label="Page name">
            <input
              className={inputClass}
              value={slide.title}
              onChange={(event) => update({ ...slide, title: event.target.value })}
            />
          </Field>
          <Field label="Background">
            <div className="flex items-center gap-2">
              {pageSwatches.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={swatch}
                  className={`size-6 rounded-full border ${slide.background === swatch ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  style={{ background: swatch }}
                  onClick={() => update({ ...slide, background: swatch })}
                />
              ))}
              <input
                className="h-8 w-10 cursor-pointer rounded border border-border bg-background"
                type="color"
                value={slide.background && /^#[0-9a-fA-F]{6}$/.test(slide.background) ? slide.background : '#f7f4ef'}
                onChange={(event) => update({ ...slide, background: event.target.value })}
              />
            </div>
          </Field>
          <Field label="Voiceover" hint="Spoken when the slide opens. Leave empty to read the text on the slide.">
            <textarea
              className={inputClass}
              rows={3}
              value={slide.voiceover}
              onChange={(event) => update({ ...slide, voiceover: event.target.value })}
            />
          </Field>

          {selected ? (
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {selected.type === 'text' ? 'Text' : selected.type === 'image' ? 'Picture' : 'Shape'}
              </p>
              {selected.type === 'text' ? (
                <>
                  <Field label="Words">
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={selected.text}
                      onChange={(event) => updateBlock(selected.id, { text: event.target.value })}
                    />
                  </Field>
                  <Field label="Font">
                    <select
                      className={inputClass}
                      value={selected.fontFamily}
                      onChange={(event) => updateBlock(selected.id, { fontFamily: event.target.value })}
                    >
                      {SLIDE_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Size">
                    <input
                      className={inputClass}
                      type="number"
                      min={10}
                      max={96}
                      value={selected.fontSize}
                      onChange={(event) => updateBlock(selected.id, { fontSize: Number(event.target.value) || 16 })}
                    />
                  </Field>
                  <Field label="Weight">
                    <select
                      className={inputClass}
                      value={String(selected.fontWeight)}
                      onChange={(event) => updateBlock(selected.id, { fontWeight: Number(event.target.value) })}
                    >
                      <option value="400">Regular</option>
                      <option value="600">Semibold</option>
                    </select>
                  </Field>
                  <Field label="Align">
                    <select
                      className={inputClass}
                      value={selected.align}
                      onChange={(event) =>
                        updateBlock(selected.id, { align: event.target.value === 'center' || event.target.value === 'right' ? event.target.value : 'left' })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </Field>
                  <Field label="Color">
                    <input
                      className={inputClass}
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(selected.color) ? selected.color : '#1c1917'}
                      onChange={(event) => updateBlock(selected.id, { color: event.target.value })}
                    />
                  </Field>
                </>
              ) : null}
              {selected.type === 'shape' ? (
                <>
                  <Field label="Fill">
                    <input
                      className={inputClass}
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(selected.fill) ? selected.fill : '#ffffff'}
                      onChange={(event) => updateBlock(selected.id, { fill: event.target.value })}
                    />
                  </Field>
                  <Field label="Line">
                    <input
                      className={inputClass}
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(selected.stroke) ? selected.stroke : '#d6d3d1'}
                      onChange={(event) => updateBlock(selected.id, { stroke: event.target.value })}
                    />
                  </Field>
                  {selected.shape === 'line' ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.arrow}
                        onChange={(event) => updateBlock(selected.id, { arrow: event.target.checked })}
                      />
                      Arrow head
                    </label>
                  ) : null}
                </>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={smallButtonClass} onClick={() => shiftBlock(selected.id, 1)}>
                  Forward
                </button>
                <button type="button" className={smallButtonClass} onClick={() => shiftBlock(selected.id, -1)}>
                  Back
                </button>
                <button type="button" className={smallButtonClass} onClick={() => removeBlock(selected.id)}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Click something on the page to change it. You can also drop a picture onto the page.</p>
          )}
      </aside>
      )}
    </div>
  );
}

export { designedStep };
