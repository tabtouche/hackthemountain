export interface BackgroundAsset {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface StickerTemplate {
  id: string;
  label: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
  image?: string;
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
  image?: string;
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
  { id: 'bg1', name: 'Ciel la nuit', type: 'image', value: '/assets/ciel_nuit.png' },
  { id: 'bg2', name: 'Forêt', type: 'image', value: '/assets/foret.png' },
  { id: 'bg3', name: 'Paysage naturel', type: 'image', value: '/assets/landscape.png' },
  { id: 'bg4', name: 'Montagne', type: 'image', value: '/assets/mountain.png' },
  { id: 'bg5', name: 'Arbre', type: 'image', value: '/assets/tree.png' },
];

export const STICKER_TEMPLATES: StickerTemplate[] = [
  { id: 'obj1', label: 'oeuf', color: '#e74c3c', defaultWidth: 80, defaultHeight: 80, image: '/assets/oeuf.png' },
  { id: 'obj2', label: 'boeuf', color: '#3498db', defaultWidth: 80, defaultHeight: 80, image: '/assets/beef.png' },
  { id: 'obj3', label: 'carote', color: '#f39c12', defaultWidth: 80, defaultHeight: 80, image: '/assets/carhote.png' },
];
