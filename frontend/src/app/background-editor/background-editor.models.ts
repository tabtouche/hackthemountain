export interface BackgroundAsset {
  id: string;
  name: string;
  type: 'color' | 'gradient';
  value: string;
}

export interface StickerTemplate {
  id: string;
  label: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface Sticker {
  instanceId: string;
  templateId: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrushConfig {
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawingPath {
  brush: BrushConfig;
  points: { x: number; y: number }[];
}

export const BACKGROUND_ASSETS: BackgroundAsset[] = [
  { id: 'bg1', name: 'Ciel', type: 'color', value: '#87CEEB' },
  { id: 'bg2', name: 'Forêt', type: 'color', value: '#228B22' },
  { id: 'bg3', name: 'Nuit', type: 'gradient', value: 'linear-gradient(to bottom, #1a1a2e, #16213e)' },
];

export const STICKER_TEMPLATES: StickerTemplate[] = [
  { id: 'obj1', label: 'Objet 1', color: '#e74c3c', defaultWidth: 80, defaultHeight: 80 },
  { id: 'obj2', label: 'Objet 2', color: '#3498db', defaultWidth: 80, defaultHeight: 80 },
  { id: 'obj3', label: 'Objet 3', color: '#f39c12', defaultWidth: 80, defaultHeight: 80 },
];
