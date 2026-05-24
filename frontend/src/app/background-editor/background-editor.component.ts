import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, signal, computed,
  PLATFORM_ID, afterNextRender, inject, OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SceneService, Scene } from '../services/scene.service';
import { CanvasService } from './canvas.service';
import {
  BACKGROUND_ASSETS, BrushConfig,
  DrawingPath, Sticker, StickerTemplate,
} from './background-editor.models';
import { StickerPanelComponent } from './sticker-panel/sticker-panel.component';
import { DrawingToolsComponent } from './drawing-tools/drawing-tools.component';

@Component({
  selector: 'app-background-editor',
  standalone: true,
  imports: [CommonModule, StickerPanelComponent, DrawingToolsComponent],
  providers: [CanvasService],
  template: `
    <div class="editor-overlay">
      <div class="editor-container">

        <!-- Header -->
        <div class="editor-header">
          <h2 class="editor-title">🎨 Éditeur de Décor — {{ scene?.title || 'Chargement...' }}</h2>
          <div class="header-actions">
            <button class="btn btn-validate" (click)="validate()" [disabled]="saving()">
              {{ saving() ? 'Sauvegarde...' : '✔ Valider' }}
            </button>
            <button class="btn btn-cancel" (click)="cancel()">✖ Annuler</button>
          </div>
        </div>

        <!-- Body : Stickers | ← Canvas → | Outils -->
        <div class="editor-body">
          <app-sticker-panel
            (addSticker)="addSticker($event)"
            (deleteSelected)="deleteSelectedSticker()">
          </app-sticker-panel>

          <div class="canvas-area">
            <span class="bg-label">{{ currentBg().name }}</span>
            <div class="canvas-row">
              <button class="nav-btn" (click)="prevBg()" title="Décor précédent">&#8592;</button>

              <div class="canvas-wrapper"
                (mousedown)="onMouseDown($event)"
                (mousemove)="onMouseMove($event)"
                (mouseup)="onMouseUp($event)"
                (mouseleave)="onMouseUp($event)">
                <canvas #bgCanvas width="960" height="540" class="canvas-layer"></canvas>
                <canvas #drawCanvas width="960" height="540" class="canvas-layer"></canvas>
              </div>

              <button class="nav-btn" (click)="nextBg()" title="Décor suivant">&#8594;</button>
            </div>
          </div>

          <app-drawing-tools
            [brush]="brushConfig()"
            (colorChanged)="setBrushColor($event)"
            (sizeChanged)="setBrushSize($event)"
            (toggleEraser)="toggleEraser()"
            (clearDrawing)="clearAllDrawing()">
          </app-drawing-tools>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .editor-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      font-family: sans-serif;
    }
    .editor-container {
      width: 95vw;
      height: 95vh;
      background: #fff;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ---- Header ---- */
    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 56px;
      flex-shrink: 0;
      background: #343a40;
      color: white;
    }
    .editor-title { margin: 0; font-size: 16px; font-weight: bold; }
    .header-actions { display: flex; gap: 10px; }
    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-validate { background: #28a745; color: white; }
    .btn-validate:hover:not(:disabled) { background: #218838; }
    .btn-cancel { background: #6c757d; color: white; }
    .btn-cancel:hover { background: #5a6268; }

    /* ---- Body ---- */
    .editor-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    /* ---- Canvas area (centre) ---- */
    .canvas-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      gap: 10px;
      padding: 16px 0;
      min-width: 0;
    }
    .bg-label {
      color: rgba(255,255,255,0.75);
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .canvas-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Canvas sized via min() : width-constrained vs height-constrained */
    .canvas-wrapper {
      position: relative;
      width: min(
        calc(95vw - 360px),
        calc((95vh - 116px) * 16 / 9)
      );
      aspect-ratio: 16 / 9;
      cursor: crosshair;
      box-shadow: 0 4px 24px rgba(0,0,0,0.7);
      flex-shrink: 0;
    }
    .canvas-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Nav arrows */
    .nav-btn {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.35);
      color: white;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      line-height: 1;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.35); }
  `]
})
export class BackgroundEditorComponent implements OnInit {
  @Input() scene?: Scene;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('drawCanvas') drawCanvasRef!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sceneService = inject(SceneService);
  private canvasService = inject(CanvasService);
  private platformId = inject(PLATFORM_ID);

  bgIndex = signal(0);
  stickers = signal<Sticker[]>([]);
  selectedStickerIndex = signal(-1);
  brushConfig = signal<BrushConfig>({ color: '#e74c3c', size: 8, isEraser: false });
  drawingPaths = signal<DrawingPath[]>([]);
  saving = signal(false);

  currentBg = computed(() => BACKGROUND_ASSETS[this.bgIndex()]);

  private isDragging = false;
  private dragStickerIdx = -1;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private isDrawing = false;
  private currentPath: DrawingPath | null = null;

  private sceneId: number | null = null;
  private playId: string | null = null;

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.canvasService.init(
          this.bgCanvasRef.nativeElement,
          this.drawCanvasRef.nativeElement
        );
        if (this.scene?.background_image) {
          this.canvasService.loadBgImage(this.scene.background_image);
        } else {
          this.redrawBg();
        }
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.playId = params['playId'];
      this.sceneId = params['sceneId'];
    });
  }

  prevBg(): void {
    const len = BACKGROUND_ASSETS.length;
    this.canvasService.clearSavedBgImage();
    this.bgIndex.update(i => (i - 1 + len) % len);
    this.redrawBg();
  }

  nextBg(): void {
    const len = BACKGROUND_ASSETS.length;
    this.canvasService.clearSavedBgImage();
    this.bgIndex.update(i => (i + 1) % len);
    this.redrawBg();
  }

  addSticker(tmpl: StickerTemplate): void {
    const newSticker: Sticker = {
      instanceId: `${tmpl.id}-${Date.now()}`,
      templateId: tmpl.id,
      label: tmpl.label,
      color: tmpl.color,
      x: 960 / 2 - tmpl.defaultWidth / 2,
      y: 540 / 2 - tmpl.defaultHeight / 2,
      width: tmpl.defaultWidth,
      height: tmpl.defaultHeight,
      image: tmpl.image,
    };
    this.stickers.update(list => [...list, newSticker]);
    this.selectedStickerIndex.set(this.stickers().length - 1);
    this.redrawBg();
  }

  deleteSelectedSticker(): void {
    const idx = this.selectedStickerIndex();
    if (idx < 0) return;
    this.stickers.update(list => list.filter((_, i) => i !== idx));
    this.selectedStickerIndex.set(-1);
    this.redrawBg();
  }

  setBrushColor(color: string): void {
    this.brushConfig.update(b => ({ ...b, color, isEraser: false }));
  }

  setBrushSize(size: number): void {
    this.brushConfig.update(b => ({ ...b, size }));
  }

  toggleEraser(): void {
    this.brushConfig.update(b => ({ ...b, isEraser: !b.isEraser }));
  }

  clearAllDrawing(): void {
    this.drawingPaths.set([]);
    this.canvasService.clearDraw();
  }

  onMouseDown(event: MouseEvent): void {
    const { x, y } = this.canvasService.getCanvasCoords(event);
    const hitIdx = this.canvasService.hitTestSticker(this.stickers(), x, y);

    if (hitIdx >= 0) {
      this.isDragging = true;
      this.dragStickerIdx = hitIdx;
      this.selectedStickerIndex.set(hitIdx);
      const s = this.stickers()[hitIdx];
      this.dragOffsetX = x - s.x;
      this.dragOffsetY = y - s.y;
    } else {
      this.isDrawing = true;
      this.currentPath = { brush: { ...this.brushConfig() }, points: [{ x, y }] };
    }
  }

  onMouseMove(event: MouseEvent): void {
    const { x, y } = this.canvasService.getCanvasCoords(event);

    if (this.isDragging && this.dragStickerIdx >= 0) {
      this.stickers.update(list => {
        const updated = [...list];
        updated[this.dragStickerIdx] = {
          ...updated[this.dragStickerIdx],
          x: x - this.dragOffsetX,
          y: y - this.dragOffsetY,
        };
        return updated;
      });
      this.redrawBg();
    } else if (this.isDrawing && this.currentPath) {
      this.currentPath.points.push({ x, y });
      this.canvasService.redrawDraw(this.drawingPaths(), this.currentPath);
    }
  }

  onMouseUp(_event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragStickerIdx = -1;
    }
    if (this.isDrawing && this.currentPath && this.currentPath.points.length > 1) {
      this.drawingPaths.update(paths => [...paths, this.currentPath!]);
      this.currentPath = null;
    }
    this.isDrawing = false;
  }

  validate(): void {
    if (this.saving() || !this.sceneId) return;
    this.saving.set(true);
    const dataUrl = this.canvasService.toDataURL();
    this.sceneService.saveBackground(this.sceneId, dataUrl).subscribe({
      next: (updated) => {
        if (this.scene) {
          this.scene.background_image = updated.background_image;
        }
        this.saving.set(false);
        this.goBack();
      },
      error: (err) => {
        console.error('Erreur sauvegarde décor', err);
        this.saving.set(false);
        this.goBack();
      }
    });
  }

  cancel(): void {
    this.goBack();
  }

  private goBack(): void {
    if (this.playId) {
      this.router.navigate(['/plays', this.playId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private redrawBg(): void {
    this.canvasService.redrawBg(this.currentBg(), this.stickers());
  }
}
