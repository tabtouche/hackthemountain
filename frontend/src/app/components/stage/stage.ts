import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';

interface Entity {
  id: string;
  animal: 'rabbit' | 'wolf' | string;
  x: number;
  y: number;
  orientation: number;
  angleMouth: number;
  facing: 'left' | 'right' | string;
}

@Component({
  selector: 'app-stage',
  imports: [],
  templateUrl: './stage.html',
  styleUrl: './stage.css',
  standalone: true
})
export class Stage implements OnInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  entities: Entity[] = [];
  private animationFrameId: number | null = null;
  private eventSource: EventSource | null = null;
  private rabbitImg: HTMLImageElement | null = null;
  private rabbitLoaded = false;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.rabbitImg = new Image();
      this.rabbitImg.onload = () => { this.rabbitLoaded = true; };
      this.rabbitImg.src = 'http://localhost:3000/avrage_rabbit.png';
    }

    if (typeof window !== 'undefined' && typeof (window as any).EventSource !== 'undefined') {
      this.startStream();
    }
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    this.closeStream();
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

      if (this.rabbitLoaded && this.rabbitImg) {
        ctx.drawImage(this.rabbitImg, drawX, drawY, size, size);
      } else {
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY, size, size);
    });
  }
}
