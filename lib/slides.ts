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
