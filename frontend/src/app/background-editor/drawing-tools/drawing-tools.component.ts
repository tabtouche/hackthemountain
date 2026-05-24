import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrushConfig } from '../background-editor.models';

@Component({
  selector: 'app-drawing-tools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <h3 class="panel-title">Dessin</h3>

      <div class="tool-group">
        <label class="tool-label">Couleur</label>
        <input
          type="color"
          [value]="brush.color"
          (input)="onColorChange($event)"
          class="color-picker"
        />
      </div>

      <div class="tool-group">
        <label class="tool-label">Taille : {{ brush.size }}px</label>
        <input
          type="range"
          min="1" max="40"
          [value]="brush.size"
          (input)="onSizeChange($event)"
          class="slider"
        />
      </div>

      <button
        class="tool-btn"
        [class.active]="brush.isEraser"
        (click)="toggleEraser.emit()"
      >
        {{ brush.isEraser ? '✏️ Pinceau' : '🧹 Gomme' }}
      </button>

      <button class="tool-btn danger-btn" (click)="clearDrawing.emit()">
        🗑 Effacer tout
      </button>
    </div>
  `,
  styles: [`
    .panel {
      width: 130px;
      min-width: 130px;
      background: #f8f9fa;
      border-left: 1px solid #dee2e6;
      padding: 15px 10px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      user-select: none;
      box-sizing: border-box;
    }
    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: bold;
      color: #343a40;
    }
    .tool-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .tool-label {
      font-size: 11px;
      color: #6c757d;
    }
    .color-picker {
      width: 100%;
      height: 36px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      cursor: pointer;
      padding: 2px;
      box-sizing: border-box;
    }
    .slider { width: 100%; cursor: pointer; }
    .tool-btn {
      padding: 8px 6px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s, color 0.15s;
    }
    .tool-btn:hover { background: #e9ecef; }
    .tool-btn.active {
      background: #495057;
      color: white;
      border-color: #495057;
    }
    .danger-btn { border-color: #dc3545; color: #dc3545; }
    .danger-btn:hover { background: #dc3545; color: white; }
  `]
})
export class DrawingToolsComponent {
  @Input() brush!: BrushConfig;
  @Output() colorChanged = new EventEmitter<string>();
  @Output() sizeChanged = new EventEmitter<number>();
  @Output() toggleEraser = new EventEmitter<void>();
  @Output() clearDrawing = new EventEmitter<void>();

  onColorChange(event: Event): void {
    this.colorChanged.emit((event.target as HTMLInputElement).value);
  }

  onSizeChange(event: Event): void {
    this.sizeChanged.emit(Number((event.target as HTMLInputElement).value));
  }
}
