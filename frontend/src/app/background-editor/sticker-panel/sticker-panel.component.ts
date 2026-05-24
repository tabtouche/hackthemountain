import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STICKER_TEMPLATES, StickerTemplate } from '../background-editor.models';

@Component({
  selector: 'app-sticker-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <h3 class="panel-title">Stickers</h3>
      <p class="hint">Cliquez pour ajouter</p>
      <div class="sticker-list">
        <div
          *ngFor="let tmpl of templates"
          class="sticker-item"
          (click)="addSticker.emit(tmpl)"
        >
          <img *ngIf="tmpl.image" [src]="tmpl.image" [alt]="tmpl.label" />
          <span *ngIf="!tmpl.image">{{ tmpl.label }}</span>
        </div>
      </div>
      <hr class="divider" />
      <button class="delete-btn" (click)="deleteSelected.emit()" title="Supprimer le sticker sélectionné">
        🗑 Supprimer
      </button>
    </div>
  `,
  styles: [`
    .panel {
      width: 130px;
      min-width: 130px;
      background: #f8f9fa;
      border-right: 1px solid #dee2e6;
      padding: 15px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      user-select: none;
      box-sizing: border-box;
    }
    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: bold;
      color: #343a40;
    }
    .hint {
      margin: 0;
      font-size: 11px;
      color: #adb5bd;
    }
    .sticker-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sticker-item {
      height: 55px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .sticker-item img {
      max-height: 48px;
      max-width: 100%;
      object-fit: contain;
    }
    .sticker-item:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    }
    .divider { border: none; border-top: 1px solid #dee2e6; margin: 4px 0; }
    .delete-btn {
      padding: 7px;
      border: 1px solid #dc3545;
      border-radius: 6px;
      background: white;
      color: #dc3545;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s, color 0.15s;
    }
    .delete-btn:hover { background: #dc3545; color: white; }
  `]
})
export class StickerPanelComponent {
  @Output() addSticker = new EventEmitter<StickerTemplate>();
  @Output() deleteSelected = new EventEmitter<void>();

  templates = STICKER_TEMPLATES;
}
