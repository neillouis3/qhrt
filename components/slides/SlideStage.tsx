'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { SLIDE_FONTS, SLIDE_H, SLIDE_W, type SlideBlock } from '@/lib/slides';

function fontFamily(id: string) {
  return SLIDE_FONTS.find((font) => font.id === id)?.family ?? 'inherit';
}

function BlockView({ block }: { block: SlideBlock }) {
  if (block.type === 'image' && block.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={block.src}
        alt=""
        className={`h-full w-full ${block.w >= 900 && block.h >= 500 ? 'object-cover' : 'object-contain'}`}
        draggable={false}
      />
    );
  }
  if (block.type === 'shape') {
    if (block.shape === 'line') {
      return (
        <div className="relative h-full w-full">
          <div
            className="absolute top-1/2 right-3 left-0 -translate-y-1/2 border-t-[3px]"
            style={{ borderColor: block.stroke || '#44403c' }}
          />
          {block.arrow ? (
            <div
              className="absolute top-1/2 right-0 -translate-y-1/2 border-y-[7px] border-l-[12px] border-y-transparent"
              style={{ borderLeftColor: block.stroke || '#44403c' }}
            />
          ) : null}
        </div>
      );
    }
    return (
      <div
        className="h-full w-full border"
        style={{
          background: block.fill,
          borderColor: block.stroke,
          borderRadius: block.shape === 'ellipse' ? 9999 : block.shape === 'round' ? block.radius : 0,
        }}
      />
    );
  }
  return (
    <div
      className="h-full w-full overflow-hidden whitespace-pre-wrap"
      style={{
        fontFamily: fontFamily(block.fontFamily),
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
        color: block.color,
        textAlign: block.align,
        lineHeight: 1.45,
      }}
    >
      {block.text}
    </div>
  );
}

export default function SlideStage({
  background,
  blocks,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onDropImage,
  flush = false,
}: {
  background?: string | null;
  blocks: SlideBlock[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, w: number, h: number) => void;
  onDropImage?: (file: File, x: number, y: number) => void;
  flush?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const drag = useRef<{
    id: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
  } | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setScale(frame.clientWidth / SLIDE_W);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const moveDrag = (event: PointerEvent, id: string) => {
    const active = drag.current;
    if (!active || active.id !== id || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = ((event.clientX - active.startX) / rect.width) * SLIDE_W;
    const dy = ((event.clientY - active.startY) / rect.height) * SLIDE_H;
    if (active.mode === 'move' && onMove) {
      onMove(active.id, Math.round(active.originX + dx), Math.round(active.originY + dy));
    }
    if (active.mode === 'resize' && onResize) {
      onResize(active.id, Math.max(24, Math.round(active.originW + dx)), Math.max(16, Math.round(active.originH + dy)));
    }
  };

  const point = (clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * SLIDE_W,
      y: ((clientY - rect.top) / rect.height) * SLIDE_H,
    };
  };

  return (
    <div
      ref={frameRef}
      className={`relative w-full overflow-hidden ${flush ? '' : 'rounded-lg border border-border shadow-sm'}`}
      style={{ aspectRatio: '16 / 9', background: background || '#f7f4ef' }}
      onPointerDown={() => onSelect?.(null)}
      onDragOver={(event) => {
        if (onDropImage) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!onDropImage) return;
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const where = point(event.clientX, event.clientY);
        onDropImage(file, where.x, where.y);
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {blocks.map((block) => {
          const selected = block.id === selectedId;
          return (
            <div
              key={block.id}
              className={`absolute select-none ${onSelect ? 'cursor-grab' : ''}`}
              style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
              onPointerDown={(event) => {
                if (!onSelect || !onMove) return;
                event.stopPropagation();
                onSelect(block.id);
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = {
                  id: block.id,
                  mode: 'move',
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: block.x,
                  originY: block.y,
                  originW: block.w,
                  originH: block.h,
                };
              }}
              onPointerMove={(event) => moveDrag(event, block.id)}
              onPointerUp={() => {
                drag.current = null;
              }}
            >
              <BlockView block={block} />
              {selected && onResize ? (
                <>
                  <div className="pointer-events-none absolute inset-0 ring-2 ring-emerald-700" />
                  <button
                    type="button"
                    aria-label="Resize"
                    className="absolute right-0 bottom-0 size-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm bg-emerald-700"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      drag.current = {
                        id: block.id,
                        mode: 'resize',
                        startX: event.clientX,
                        startY: event.clientY,
                        originX: block.x,
                        originY: block.y,
                        originW: block.w,
                        originH: block.h,
                      };
                    }}
                    onPointerMove={(event) => moveDrag(event, block.id)}
                    onPointerUp={() => {
                      drag.current = null;
                    }}
                  />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
