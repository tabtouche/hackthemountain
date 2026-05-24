import { Component, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EntityStreamService, Entity } from '../../services/entity-stream-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stage',
  imports: [],
  templateUrl: './stage.html',
  styleUrls: ['./stage.css'],
  standalone: true
})
export class Stage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  entities: Entity[] = [];
  private animationFrameId: number | null = null;
  private eventSource: EventSource | null = null;
  private subscription: Subscription | null = null;
  private rabbitImg!: HTMLImageElement;
  private wolfImg!: HTMLImageElement;
  private rabbitLoaded = false;
  private wolfLoaded = false;

  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private entityStream: EntityStreamService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.rabbitImg = new Image();
      this.wolfImg = new Image();

      this.rabbitImg.onload = () => {
        this.rabbitLoaded = true;
        console.log('✅ Rabbit loaded');
      };

      this.rabbitImg.onerror = (e) => {
        console.error('❌ Rabbit failed to load', e);
      };

      this.wolfImg.onload = () => {
        this.wolfLoaded = true;
      };

      this.rabbitImg.src = '/assets/avrage_rabbit.png';
      this.wolfImg.src = '/assets/loup.png';
    }

    this.subscription = this.entityStream.stream().subscribe({
      next: (entities) => (this.entities = entities),
      error: (e) => console.error('Stream error', e),
    });
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
    this.subscription?.unsubscribe(); 
  }

  startStream(): void {
    if (this.eventSource) return;
    this.eventSource = new EventSource('http://localhost:3000/stream/entities');
    this.eventSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.payload) {
          this.entities = data.payload.map((e: any, idx: number) => ({
            ...e,
            id: e.id || `entity-${idx}`
          }));
        }
      } catch (e) {
        console.error('Invalid event data', e);
      }
    };
    this.eventSource.onerror = (e) => {
      console.error('EventSource error', e);
    };
  }

  closeStream(): void {
    this.eventSource?.close();
    this.eventSource = null;
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

    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional light grid)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw entities with orientation and facing
    this.entities.forEach((e) => {
      const x = (e.x / 100) * canvas.width;
      const y = canvas.height - (e.y / 100) * canvas.height;
      const size = 80;

      const img = e.animal === 'rabbit'
        ? (this.rabbitLoaded ? this.rabbitImg : null)
        : (this.wolfLoaded ? this.wolfImg : null);

      ctx.save();
      ctx.translate(x, y);
      // Derive facing from orientation angle (avoids camera-mirror mismatch on the `facing` field).
      // orientation is in canvas space: 0=right, π/2=down, ±π=left.
      // For left-facing: subtract π so the base angle stays small, then flip horizontally.
      const angle = e.orientation ?? 0;
      const isLeft = Math.abs(angle) > Math.PI / 2;
      ctx.rotate(isLeft ? angle - Math.PI : angle);
      if (isLeft) ctx.scale(-1, 1);

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

