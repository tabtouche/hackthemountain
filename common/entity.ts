export interface Entity {
  animal: 'rabbit' | 'wolf' | string;
  x: number;
  y: number;
  orientation: number;
  angleMouth: number;
  facing: 'left' | 'right' | string;
}