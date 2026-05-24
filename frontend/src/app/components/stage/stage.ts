import { Component, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;    // résolution interne = taille CSS réelle
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

    // Draw entities
    this.entities.forEach((e) => {
      const x = (e.x / 100) * canvas.width;
      const y = canvas.height - (e.y / 100) * canvas.height;

      const size = 80;
      const drawX = x - size / 2;
      const drawY = y - size / 2;

      let img: HTMLImageElement | null = null;

      if (e.animal === 'rabbit') {
        img = this.rabbitLoaded ? this.rabbitImg : null;
      } else if (e.animal === 'wolf') {
        img = this.wolfLoaded ? this.wolfImg : null;
      }

      if (img) {
        ctx.drawImage(img, drawX, drawY, size, size);
      } else {
        ctx.fillStyle = e.animal === 'wolf' ? '#444' : '#4ecdc4';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#333';
      ctx.strokeRect(drawX, drawY, size, size);
    });
  }
}

