import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Stage } from './components/stage/stage';
import { VideoStreamService } from './services/video-stream.service';

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css'],
  standalone: true,
  imports: [Stage]
})
export class SceneComponent implements OnInit, OnDestroy {
  @ViewChild('videoCanvas') videoCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private videoStream = inject(VideoStreamService);

  recording = false;
  isLoading = false;
  puppetStarted = false;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private videoSubscription: Subscription | null = null;
  private frameImg = typeof window !== 'undefined' ? new Image() : null;

  private sceneId: string | null = null;
  private playId: string | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sceneId = params['sceneId'];
      this.playId = params['playId'];
    });
  }

  ngOnDestroy(): void {
    this.stopVideo();
    this.stopPuppetProcess();
  }

  async startCamera(): Promise<void> {
    if (this.puppetStarted) return;
    this.puppetStarted = true;
    this.isLoading = true;
    await this.startPuppetProcess();
    this.videoSubscription = this.videoStream.stream().subscribe(dataUrl => {
      if (this.isLoading) this.isLoading = false;
      this.drawFrame(dataUrl);
    });
  }

  private drawFrame(dataUrl: string): void {
    const canvas = this.videoCanvasRef?.nativeElement;
    if (!canvas || !this.frameImg) return;
    this.frameImg.onload = () => {
      if (canvas.width !== this.frameImg!.naturalWidth) {
        canvas.width = this.frameImg!.naturalWidth;
        canvas.height = this.frameImg!.naturalHeight;
      }
      canvas.getContext('2d')?.drawImage(this.frameImg!, 0, 0);
    };
    this.frameImg.src = dataUrl;
  }

  stopVideo(): void {
    this.videoSubscription?.unsubscribe();
    this.videoSubscription = null;
    this.puppetStarted = false;
    this.isLoading = false;
  }

  private async startPuppetProcess(): Promise<void> {
    try {
      await fetch('http://localhost:3000/api/puppet/start', { method: 'POST' });
    } catch { }
  }

  private stopPuppetProcess(): void {
    fetch('http://localhost:3000/api/puppet/stop', { method: 'POST' }).catch(() => { });
  }

  startRecording(): void {
    const canvas = this.videoCanvasRef?.nativeElement;
    if (!canvas) return;
    this.recordedChunks = [];
    const stream = (canvas as any).captureStream(25) as MediaStream;
    const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp8' };
    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
    } catch {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) this.recordedChunks.push(ev.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const filename = this.sceneId ? `scene-${this.sceneId}-${Date.now()}.webm` : `scene-${Date.now()}.webm`;
        fetch('http://localhost:3000/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, dataUrl })
        }).then(r => r.json()).then(console.log).catch(console.error);
      };
      reader.readAsDataURL(blob);
    };

    this.mediaRecorder.start(1000);
    this.recording = true;
  }

  pauseRecording(): void {
    this.mediaRecorder?.pause();
    this.recording = false;
  }

  resumeRecording(): void {
    this.mediaRecorder?.resume();
    this.recording = true;
  }

  stopRecording(): void {
    this.mediaRecorder?.stop();
    this.recording = false;
  }

  restartRecording(): void {
    this.stopRecording();
    this.recordedChunks = [];
  }

  goBack(): void {
    if (this.playId) {
      this.router.navigate(['/plays', this.playId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
