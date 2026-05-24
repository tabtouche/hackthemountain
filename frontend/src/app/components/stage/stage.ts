import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Entity } from '../../services/entity-stream-service';
import { BetaService } from '../../services/beta.service';

@Component({
  selector: 'app-stage',
  imports: [],
  templateUrl: './stage.html',
  styleUrls: ['./stage.css'],
  standalone: true
})
export class Stage implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() entities: Entity[] = [];
  @Input() hasBackground: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hasBackground'] && this.isBrowser) {
      this.draw();
    }
  }

  private animationFrameId: number | null = null;
  private rabbitImg!: HTMLImageElement;
  private wolfUpperImg!: HTMLImageElement;
  private wolfMouthImg!: HTMLImageElement;
  private rabbitLoaded = false;
  private wolfUpperLoaded = false;
  private wolfMouthLoaded = false;

  // Hinge offset (in image-local pixels) applied to the mouth before
  // rotating. Adjust these values to fine-tune the mouth hinge point.
  mouthHinge = { x: 200, y: 200 };

  // Temporary debug toggle: draw the computed hinge point on canvas
  debugDrawHinge = false;

  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private betaService = inject(BetaService);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.rabbitImg = new Image();
    this.wolfUpperImg = new Image();
    this.wolfMouthImg = new Image();
    this.rabbitImg.onload = () => { this.rabbitLoaded = true; };
    this.wolfUpperImg.onload = () => { this.wolfUpperLoaded = true; };
    this.wolfMouthImg.onload = () => { this.wolfMouthLoaded = true; };
    this.rabbitImg.src = '/assets/avrage_rabbit.png';
    this.wolfUpperImg.src = '/assets/loup_upper.png';
    this.wolfMouthImg.src = '/assets/loup_mouth.png';
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  startAnimation(): void {
    const animate = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid paper placeholder if no background
    if (!this.hasBackground) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    this.entities.forEach((e) => {
      const x = (e.x / 100) * canvas.width;
      const y = canvas.height - (e.y / 100) * canvas.height;
      const size = 220;

      const img = e.animal === 'rabbit'
        ? (this.rabbitLoaded ? this.rabbitImg : null)
        : (this.wolfUpperLoaded ? this.wolfUpperImg : null);

      ctx.save();
      ctx.translate(x, y);
      
      if (e.facing === 'right') {
        ctx.scale(-1, 1);
        ctx.rotate(e.orientation ?? 0);
      } else {
        ctx.rotate(-(e.orientation ?? 0));
      }

      if (img) {
        // Draw the upper part (base wolf image)
        ctx.drawImage(img, -size / 2, -size / 2, size, size);

        // If beta is enabled use the new mouth logic (hinge, pre-rotation)
        // otherwise draw the mouth normally (no hinge rotation) to match
        // the previous behaviour.
        if (this.wolfMouthLoaded) {
          if (this.betaService.enabled) {
            // New behavior: apply hinge pre-rotation, then world transforms
            ctx.restore();

            ctx.save();
            ctx.translate(this.mouthHinge.x, this.mouthHinge.y);
            ctx.rotate(e.angleMouth ?? 0);
            ctx.translate(-this.mouthHinge.x, -this.mouthHinge.y);

            ctx.translate(x, y);
            if (e.facing === 'right') {
              ctx.scale(-1, 1);
              ctx.rotate(e.orientation ?? 0);
            } else {
              ctx.rotate(-(e.orientation ?? 0));
            }

            ctx.drawImage(this.wolfMouthImg, -size / 2, -size / 2, size, size);

            // debug hinge marker
            if (this.debugDrawHinge && this.wolfMouthImg.width && this.wolfMouthImg.height) {
              const imgW = this.wolfMouthImg.width;
              const imgH = this.wolfMouthImg.height;
              const scaleX = size / imgW;
              const scaleY = size / imgH;
              let localHx = -size / 2 + this.mouthHinge.x * scaleX;
              let localHy = -size / 2 + this.mouthHinge.y * scaleY;
              if (e.facing === 'right') localHx = -localHx;
              const rot = e.facing === 'right' ? (e.orientation ?? 0) : -(e.orientation ?? 0);
              const c = Math.cos(rot);
              const s = Math.sin(rot);
              const rx = localHx * c - localHy * s;
              const ry = localHx * s + localHy * c;
              const finalX = x + rx;
              const finalY = y + ry;
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.beginPath();
              ctx.arc(finalX, finalY, 4, 0, Math.PI * 2);
              ctx.fillStyle = 'red';
              ctx.fill();
              ctx.restore();
            }

            ctx.restore();
            ctx.save();
          } else {
            // Old behavior: simply draw mouth on top using same world transform
            ctx.drawImage(this.wolfMouthImg, -size / 2, -size / 2, size, size);
          }
        }
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fillStyle = e.animal === 'wolf' ? '#444' : '#4ecdc4';
        ctx.fill();
      }

      ctx.restore();
    });
  }
}
