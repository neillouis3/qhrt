/** A presentation slide is a 16:9 canvas. Positions are in this space. */
export const SLIDE_W = 960;
export const SLIDE_H = 540;

export const SLIDE_FONTS = [
  { id: 'inherit', label: 'App', family: 'inherit' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
  { id: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'mono', label: 'Mono', family: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
] as const;

export type SlideAlign = 'left' | 'center' | 'right';
export type SlideShape = 'rect' | 'round' | 'ellipse' | 'line';

export interface SlideBlock {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: SlideAlign;
  src: string;
  shape: SlideShape;
  fill: string;
  stroke: string;
  radius: number;
  arrow: boolean;
}

function num(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeSrc(value: string) {
  if (value.startsWith('data:image/')) return value;
  if (value.startsWith('https://') || value.startsWith('/')) return value;
  return '';
}

export function newBlockId() {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

export function textBlock(partial: Partial<SlideBlock> & { text: string }): SlideBlock {
  return {
    id: partial.id ?? newBlockId(),
    type: 'text',
    x: partial.x ?? 56,
    y: partial.y ?? 48,
    w: partial.w ?? 480,
    h: partial.h ?? 80,
    text: partial.text,
    fontFamily: partial.fontFamily ?? 'inherit',
    fontSize: partial.fontSize ?? 28,
    fontWeight: partial.fontWeight ?? 400,
    color: partial.color ?? '#1c1917',
    align: partial.align ?? 'left',
    src: '',
    shape: 'rect',
    fill: 'transparent',
    stroke: 'transparent',
    radius: 0,
    arrow: false,
  };
}

export function shapeBlock(partial: Partial<SlideBlock> & { shape: SlideShape }): SlideBlock {
  return {
    id: partial.id ?? newBlockId(),
    type: 'shape',
    x: partial.x ?? 56,
    y: partial.y ?? 160,
    w: partial.w ?? 260,
    h: partial.h ?? partial.shape === 'line' ? 32 : 140,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: '#1c1917',
    align: 'left',
    src: '',
    shape: partial.shape,
    fill: partial.fill ?? (partial.shape === 'line' ? 'transparent' : '#ffffff'),
    stroke: partial.stroke ?? '#d6d3d1',
    radius: partial.radius ?? 18,
    arrow: partial.arrow ?? false,
  };
}

export function imageBlock(partial: Partial<SlideBlock> & { src: string }): SlideBlock {
  return {
    id: partial.id ?? newBlockId(),
    type: 'image',
    x: partial.x ?? 560,
    y: partial.y ?? 80,
    w: partial.w ?? 340,
    h: partial.h ?? 240,
    text: '',
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 400,
    color: '#1c1917',
    align: 'left',
    src: safeSrc(partial.src),
    shape: 'rect',
    fill: 'transparent',
    stroke: 'transparent',
    radius: 12,
    arrow: false,
  };
}

export function parseSlideBlocks(raw: unknown): SlideBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: SlideBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const type = record.type === 'image' || record.type === 'shape' || record.type === 'text' ? record.type : null;
    if (!type) continue;
    const align: SlideAlign = record.align === 'center' || record.align === 'right' ? record.align : 'left';
    const shape: SlideShape =
      record.shape === 'ellipse' || record.shape === 'line' || record.shape === 'rect' || record.shape === 'round'
        ? record.shape
        : 'round';
    blocks.push({
      id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : newBlockId(),
      type,
      x: num(record.x, 40),
      y: num(record.y, 40),
      w: Math.max(20, num(record.w, 200)),
      h: Math.max(12, num(record.h, 80)),
      text: typeof record.text === 'string' ? record.text : '',
      fontFamily: typeof record.fontFamily === 'string' ? record.fontFamily : 'inherit',
      fontSize: Math.min(120, Math.max(8, num(record.fontSize, 24))),
      fontWeight: num(record.fontWeight, 400) >= 600 ? 600 : 400,
      color: typeof record.color === 'string' ? record.color : '#1c1917',
      align,
      src: typeof record.src === 'string' ? safeSrc(record.src) : '',
      shape,
      fill: typeof record.fill === 'string' ? record.fill : '#ffffff',
      stroke: typeof record.stroke === 'string' ? record.stroke : '#d6d3d1',
      radius: num(record.radius, 18),
      arrow: record.arrow === true,
    });
  }
  return blocks;
}

export function blocksFromLegacy(title: string, paragraphs: string[], points: string[]): SlideBlock[] {
  const blocks: SlideBlock[] = [];
  let y = 48;
  if (title.trim()) {
    blocks.push(textBlock({ x: 56, y, w: 848, h: 88, text: title.trim(), fontSize: 40, fontWeight: 600 }));
    y += 100;
  }
  if (paragraphs.length > 0) {
    const height = Math.min(220, 36 + paragraphs.length * 40);
    blocks.push(
      textBlock({
        x: 56,
        y,
        w: 848,
        h: height,
        text: paragraphs.join('\n\n'),
        fontSize: 20,
        color: '#57534e',
      })
    );
    y += height + 20;
  }
  if (points.length > 0) {
    blocks.push(
      textBlock({
        x: 56,
        y,
        w: 848,
        h: Math.min(280, 24 + points.length * 32),
        text: points.map((point) => `• ${point}`).join('\n'),
        fontSize: 18,
      })
    );
  }
  if (blocks.length === 0) {
    blocks.push(textBlock({ text: 'Title', fontSize: 42, fontWeight: 600, w: 800, h: 90 }));
  }
  return blocks;
}

export function starterBlocks(): SlideBlock[] {
  return [
    textBlock({ x: 56, y: 46, w: 820, h: 78, text: 'Slide title', fontSize: 42, fontWeight: 600 }),
    textBlock({
      x: 56,
      y: 140,
      w: 620,
      h: 72,
      text: 'A short line under the title.',
      fontSize: 22,
      color: '#57534e',
    }),
    shapeBlock({ shape: 'round', x: 56, y: 240, w: 260, h: 220, fill: '#ffffff', stroke: '#e7e5e4' }),
    shapeBlock({ shape: 'round', x: 340, y: 240, w: 260, h: 220, fill: '#ffffff', stroke: '#e7e5e4' }),
    shapeBlock({ shape: 'round', x: 624, y: 240, w: 260, h: 220, fill: '#ffffff', stroke: '#e7e5e4' }),
  ];
}
