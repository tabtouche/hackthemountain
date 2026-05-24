import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Stage } from './components/stage/stage';

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css'],
  standalone: true,
  imports: [Stage]
})
export class SceneComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  mediaStream: MediaStream | null = null;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  recording = false;
  eventSource: EventSource | null = null;

  ngOnInit(): void {
    // Intentionally empty: entity stream will start when camera is started in browser.
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.closeEntityStream();
  }

  async startCamera() {
    if (this.mediaStream) return;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.mediaStream;
        await this.videoRef.nativeElement.play();
      }
      // Start entity stream now that we're in a browser user session
      if (typeof window !== 'undefined' && typeof (window as any).EventSource !== 'undefined') {
        if (!this.eventSource) this.startEntityStream();
      }
    } catch (e) {
      console.error('Camera error', e);
    }
  }

  stopCamera() {
    if (!this.mediaStream) return;
    this.mediaStream.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
  }

  startRecording() {
    if (!this.mediaStream) return;
    this.recordedChunks = [];
    const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp8' };
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(this.mediaStream as MediaStream);
    }

    this.mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) this.recordedChunks.push(ev.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // upload to backend
        fetch('http://localhost:3000/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: `scene-${Date.now()}.webm`, dataUrl })
        }).then(r => r.json()).then(console.log).catch(console.error);
      };
      reader.readAsDataURL(blob);
    };

    this.mediaRecorder.start(1000);
    this.recording = true;
  }

  pauseRecording() {
    this.mediaRecorder?.pause();
    this.recording = false;
  }

  resumeRecording() {
    this.mediaRecorder?.resume();
    this.recording = true;
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.recording = false;
  }

  restartRecording() {
    this.stopRecording();
    this.recordedChunks = [];
  }

  startEntityStream() {
    if (typeof window === 'undefined' || typeof (window as any).EventSource === 'undefined') return;
    if (this.eventSource) return;
    this.eventSource = new EventSource('http://localhost:3000/stream/entities');
    this.eventSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        this.drawEntities(data.payload);
      } catch (e) {
        console.error('Invalid event data', e);
      }
    };
    this.eventSource.onerror = (e) => {
      console.error('EventSource error', e);
      // keep it simple: close on error
      // this.closeEntityStream();
    };
  }

  closeEntityStream() {
    this.eventSource?.close();
    this.eventSource = null;
  }

  drawEntities(entities: any[]) {
    const canvas = this.canvasRef?.nativeElement;
    const video = this.videoRef?.nativeElement;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // simple rendering: draw circle per entity and label
    entities.forEach((e) => {
      const x = (e.x / 100) * canvas.width;
      const y = (e.y / 100) * canvas.height;
      ctx.beginPath();
      ctx.fillStyle = e.animal === 'wolf' ? 'rgba(255,0,0,0.6)' : 'rgba(0,200,0,0.6)';
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(e.animal, x - 20, y + 6);
    });
  }
}
