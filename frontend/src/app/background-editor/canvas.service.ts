import { Injectable } from '@angular/core';
import { BackgroundAsset, BrushConfig, DrawingPath, Sticker } from './background-editor.models';

/** Manages two stacked canvases: bgCanvas (background + stickers) and drawCanvas (free drawing). */
@Injectable()
export class CanvasService {
  private bgCanvas: HTMLCanvasElement | null = null;
  private drawCanvas: HTMLCanvasElement | null = null;
  private bgCtx: CanvasRenderingContext2D | null = null;
  private drawCtx: CanvasRenderingContext2D | null = null;

  // Keeps the previously saved flat image in memory so redrawBg() can use it as the base layer.
  private savedBgImage: HTMLImageElement | null = null;

  init(bgCanvas: HTMLCanvasElement, drawCanvas: HTMLCanvasElement): void {
    this.bgCanvas = bgCanvas;
    this.drawCanvas = drawCanvas;
    this.bgCtx = bgCanvas.getContext('2d');
    this.drawCtx = drawCanvas.getContext('2d');
    this.savedBgImage = null;
  }

  redrawBg(background: BackgroundAsset, stickers: Sticker[]): void {
    if (!this.bgCtx || !this.bgCanvas) return;
    const { width, height } = this.bgCanvas;
    this.bgCtx.clearRect(0, 0, width, height);
    if (this.savedBgImage) {
      // Use the previously saved flat image as the base layer
      this.bgCtx.drawImage(this.savedBgImage, 0, 0, width, height);
      stickers.forEach(s => this.drawSticker(s));
      return;
    }

    // If background is an image, load it and draw stickers after load.
    if (background.type === 'image') {
      const img = new Image();
      // allow local assets without CORS; if remote, the server should set CORS headers
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!this.bgCtx || !this.bgCanvas) return;
        this.bgCtx.clearRect(0, 0, width, height);
        this.bgCtx.drawImage(img, 0, 0, width, height);
        stickers.forEach(s => this.drawSticker(s));
      };
      // support absolute '/assets/...' or relative paths
      img.src = background.value;
      return;
    }

    // Fallback: programmatic backgrounds (color/gradient)
    this.drawBackground(background, width, height);
    stickers.forEach(s => this.drawSticker(s));
  }

  /** Clears the saved image so the next redrawBg() uses the programmatic background. */
  clearSavedBgImage(): void {
    this.savedBgImage = null;
  }

  redrawDraw(paths: DrawingPath[], currentPath: DrawingPath | null = null): void {
    if (!this.drawCtx || !this.drawCanvas) return;
    const { width, height } = this.drawCanvas;
    this.drawCtx.clearRect(0, 0, width, height);
    paths.forEach(p => this.renderPath(p));
    if (currentPath && currentPath.points.length > 1) {
      this.renderPath(currentPath);
    }
  }

  clearDraw(): void {
    if (!this.drawCtx || !this.drawCanvas) return;
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
  }

  getCanvasCoords(event: MouseEvent): { x: number; y: number } {
    const canvas = this.bgCanvas;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  /** Returns the index of the topmost sticker hit at (x, y), or -1. */
  hitTestSticker(stickers: Sticker[], x: number, y: number): number {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return i;
      }
    }
    return -1;
  }

  /** Loads a previously saved flat image as the persistent base layer for all subsequent redraws. */
  loadBgImage(dataUrl: string): void {
    if (!this.bgCanvas || !this.bgCtx) return;
    const img = new Image();
    img.onload = () => {
      this.savedBgImage = img;
      this.bgCtx!.clearRect(0, 0, this.bgCanvas!.width, this.bgCanvas!.height);
      this.bgCtx!.drawImage(img, 0, 0, this.bgCanvas!.width, this.bgCanvas!.height);
    };
    img.src = dataUrl;
  }

  /** Flattens both canvases into a single PNG dataURL. */
  toDataURL(): string {
    if (!this.bgCanvas || !this.drawCanvas) return '';
    const temp = document.createElement('canvas');
    temp.width = this.bgCanvas.width;
    temp.height = this.bgCanvas.height;
    const ctx = temp.getContext('2d')!;
    ctx.drawImage(this.bgCanvas, 0, 0);
    ctx.drawImage(this.drawCanvas, 0, 0);
    return temp.toDataURL('image/png');
  }

  private drawBackground(bg: BackgroundAsset, w: number, h: number): void {
    if (!this.bgCtx) return;
    if (bg.type === 'color') {
      this.bgCtx.fillStyle = bg.value;
      this.bgCtx.fillRect(0, 0, w, h);
    } else if (bg.type === 'gradient') {
      const match = bg.value.match(/linear-gradient\(to bottom,\s*([^,]+),\s*([^)]+)\)/);
      if (match) {
        const grad = this.bgCtx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, match[1].trim());
        grad.addColorStop(1, match[2].trim());
        this.bgCtx.fillStyle = grad;
        this.bgCtx.fillRect(0, 0, w, h);
      }
    }
  }

  private drawSticker(s: Sticker): void {
    if (!this.bgCtx) return;

    // If sticker has an image, draw it (with caching)
    const anyS = s as any;
    if (anyS.image) {
      // cache images by URL
      if (!(this as any)._stickerImgCache) {
        (this as any)._stickerImgCache = {} as Record<string, HTMLImageElement>;
      }
      const cache: Record<string, HTMLImageElement> = (this as any)._stickerImgCache;
      const url = anyS.image;
      const drawImg = (img: HTMLImageElement) => {
        this.bgCtx!.drawImage(img, s.x, s.y, s.width, s.height);
      };

      const cached = cache[url];
      if (cached && cached.complete) {
        drawImg(cached);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cache[url] = img;
        drawImg(img);
      };
      img.onerror = () => {
        // fallback to colored box if image fails
        this.bgCtx!.fillStyle = s.color;
        this.bgCtx!.fillRect(s.x, s.y, s.width, s.height);
        this.bgCtx!.fillStyle = 'rgba(255,255,255,0.85)';
        this.bgCtx!.font = 'bold 14px sans-serif';
        this.bgCtx!.textAlign = 'center';
        this.bgCtx!.textBaseline = 'middle';
        this.bgCtx!.fillText(s.label, s.x + s.width / 2, s.y + s.height / 2);
      };
      img.src = url;
      return;
    }

    // Default: colored box with label
    this.bgCtx.fillStyle = s.color;
    this.bgCtx.fillRect(s.x, s.y, s.width, s.height);
    this.bgCtx.fillStyle = 'rgba(255,255,255,0.85)';
    this.bgCtx.font = 'bold 14px sans-serif';
    this.bgCtx.textAlign = 'center';
    this.bgCtx.textBaseline = 'middle';
    this.bgCtx.fillText(s.label, s.x + s.width / 2, s.y + s.height / 2);
  }

  private renderPath(path: DrawingPath): void {
    if (!this.drawCtx || path.points.length < 2) return;
    this.drawCtx.save();
    if (path.brush.isEraser) {
      this.drawCtx.globalCompositeOperation = 'destination-out';
      this.drawCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.drawCtx.globalCompositeOperation = 'source-over';
      this.drawCtx.strokeStyle = path.brush.color;
    }
    this.drawCtx.lineWidth = path.brush.size;
    this.drawCtx.lineCap = 'round';
    this.drawCtx.lineJoin = 'round';
    this.drawCtx.beginPath();
    this.drawCtx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      this.drawCtx.lineTo(path.points[i].x, path.points[i].y);
    }
    this.drawCtx.stroke();
    this.drawCtx.restore();
  }
}
