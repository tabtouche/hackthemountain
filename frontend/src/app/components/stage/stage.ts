import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Entity } from '../../services/entity-stream-service';

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
  private wolfImg!: HTMLImageElement;
  private rabbitLoaded = false;
  private wolfLoaded = false;

  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.rabbitImg = new Image();
      this.wolfImg = new Image();
      this.rabbitImg.onload = () => { this.rabbitLoaded = true; };
      this.wolfImg.onload = () => { this.wolfLoaded = true; };
      this.rabbitImg.src = '/assets/avrage_rabbit.png';
      this.wolfImg.src = '/assets/loup.png';
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
      const size = 80;

      const img = e.animal === 'rabbit'
        ? (this.rabbitLoaded ? this.rabbitImg : null)
        : (this.wolfLoaded ? this.wolfImg : null);

      ctx.save();
      ctx.translate(x, y);
      
      if (e.facing === 'right') {
        ctx.scale(-1, 1);
        ctx.rotate(e.orientation ?? 0);
      } else {
        ctx.rotate(-(e.orientation ?? 0));
      }

      if (img) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
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
