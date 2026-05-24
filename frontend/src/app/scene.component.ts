import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Stage } from './components/stage/stage';
import { VideoStreamService } from './services/video-stream.service';
import { EntityStreamService, Entity } from './services/entity-stream-service';
import { SequenceRecorderService, Sequence } from './services/sequence-recorder.service';
import { SceneService } from './services/scene.service';

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css'],
  standalone: true,
  imports: [Stage]
})
export class SceneComponent implements OnInit, OnDestroy {
  @ViewChild('videoCanvas') videoCanvasRef!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private videoStream = inject(VideoStreamService);
  private entityStream = inject(EntityStreamService);
  private recorder = inject(SequenceRecorderService);
  private sceneService = inject(SceneService);

  // Camera
  cameraActive = false;
  isLoading = false;

  // Stage
  stageEntities: Entity[] = [];

  // Recording
  recordingState: RecordingState = 'idle';
  currentSequence: Sequence | null = null;
  saving = false;

  // Preview playback
  previewEntities: Entity[] = [];
  previewPlaying = false;
  previewCurrentFrameIndex = 0;

  private sceneId: string | null = null;
  private playId: string | null = null;
  private videoSubscription: Subscription | null = null;
  private entitySubscription: Subscription | null = null;
  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private frameImg = typeof window !== 'undefined' ? new Image() : null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sceneId = params['sceneId'];
      this.playId = params['playId'];
    });

    this.entitySubscription = this.entityStream.stream().subscribe(entities => {
      if (this.recordingState !== 'preview') {
        this.stageEntities = entities;
      }
      this.recorder.record(entities);
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.entitySubscription?.unsubscribe();
    this.stopPuppetProcess();
    this.clearPreviewTimer();
  }

  // ── Camera ───────────────────────────────────────────────────────────────

  toggleCamera(): void {
    if (this.cameraActive) this.stopCamera();
    else this.startCamera();
  }

  async startCamera(): Promise<void> {
    if (this.cameraActive) return;
    this.cameraActive = true;
    this.isLoading = true;
    await this.startPuppetProcess();
    this.videoSubscription = this.videoStream.stream().subscribe(dataUrl => {
      if (this.isLoading) this.isLoading = false;
      this.drawVideoFrame(dataUrl);
    });
  }

  stopCamera(): void {
    this.videoSubscription?.unsubscribe();
    this.videoSubscription = null;
    this.cameraActive = false;
    this.isLoading = false;
    this.stopPuppetProcess();
  }

  private drawVideoFrame(dataUrl: string): void {
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

  private async startPuppetProcess(): Promise<void> {
    try { await fetch('http://localhost:3000/api/puppet/start', { method: 'POST' }); } catch { }
  }

  private stopPuppetProcess(): void {
    fetch('http://localhost:3000/api/puppet/stop', { method: 'POST' }).catch(() => { });
  }

  // ── Recording ────────────────────────────────────────────────────────────

  startRecording(): void {
    this.recorder.start();
    this.recordingState = 'recording';
  }

  pauseRecording(): void {
    this.recorder.pause();
    this.recordingState = 'paused';
  }

  resumeRecording(): void {
    this.recorder.resume();
    this.recordingState = 'recording';
  }

  stopRecording(): void {
    this.currentSequence = this.recorder.stop();
    this.recordingState = 'preview';
    this.previewCurrentFrameIndex = 0;
    this.previewPlaying = true;
    this.previewEntities = this.currentSequence.frames[0]?.entities ?? [];
    this.scheduleNextFrame();
  }

  restartRecording(): void {
    this.clearPreviewTimer();
    this.recorder.reset();
    this.currentSequence = null;
    this.recordingState = 'idle';
    this.stageEntities = [];
    this.previewEntities = [];
    this.previewPlaying = false;
    this.previewCurrentFrameIndex = 0;
  }

  // ── Preview playback ─────────────────────────────────────────────────────

  private scheduleNextFrame(): void {
    if (!this.previewPlaying || !this.currentSequence) return;
    const frames = this.currentSequence.frames;
    const nextIndex = this.previewCurrentFrameIndex + 1;

    if (nextIndex >= frames.length) {
      this.previewTimer = setTimeout(() => {
        this.previewCurrentFrameIndex = 0;
        this.previewEntities = frames[0]?.entities ?? [];
        this.scheduleNextFrame();
      }, 700);
      return;
    }

    const delay = frames[nextIndex].t - frames[this.previewCurrentFrameIndex].t;
    this.previewTimer = setTimeout(() => {
      this.previewCurrentFrameIndex = nextIndex;
      this.previewEntities = frames[nextIndex].entities;
      this.scheduleNextFrame();
    }, Math.max(1, delay));
  }

  togglePreviewPlayback(): void {
    this.previewPlaying = !this.previewPlaying;
    if (this.previewPlaying) {
      this.scheduleNextFrame();
    } else {
      this.clearPreviewTimer();
    }
  }

  seekTo(index: number): void {
    if (!this.currentSequence) return;
    this.clearPreviewTimer();
    this.previewPlaying = false;
    this.previewCurrentFrameIndex = index;
    this.previewEntities = this.currentSequence.frames[index]?.entities ?? [];
  }

  onSeekInput(event: Event): void {
    this.seekTo(+(event.target as HTMLInputElement).value);
  }

  stepBack(): void {
    if (!this.currentSequence) return;
    this.seekTo(Math.max(0, this.previewCurrentFrameIndex - 15));
  }

  stepForward(): void {
    if (!this.currentSequence) return;
    this.seekTo(Math.min(this.currentSequence.frames.length - 1, this.previewCurrentFrameIndex + 15));
  }

  private clearPreviewTimer(): void {
    if (this.previewTimer !== null) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
  }

  // ── Validate / delete ────────────────────────────────────────────────────

  validateSequence(): void {
    if (!this.currentSequence || !this.sceneId) return;
    this.saving = true;
    this.sceneService.saveSequence(Number(this.sceneId), JSON.stringify(this.currentSequence)).subscribe({
      next: () => { this.saving = false; this.finishPreview(); },
      error: () => { this.saving = false; }
    });
  }

  deleteSequence(): void {
    this.finishPreview();
  }

  private finishPreview(): void {
    this.clearPreviewTimer();
    this.recorder.reset();
    this.currentSequence = null;
    this.recordingState = 'idle';
    this.stageEntities = [];
    this.previewEntities = [];
    this.previewPlaying = false;
    this.previewCurrentFrameIndex = 0;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  get durationLabel(): string {
    if (!this.currentSequence) return '0:00';
    const s = Math.round(this.currentSequence.duration / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get previewTimeLabel(): string {
    if (!this.currentSequence) return '0:00';
    const t = this.currentSequence.frames[this.previewCurrentFrameIndex]?.t ?? 0;
    const s = Math.floor(t / 1000);
    const cs = Math.floor((t % 1000) / 10);
    return `${s}:${cs.toString().padStart(2, '0')}`;
  }

  get totalFrames(): number {
    return this.currentSequence?.frames.length ?? 0;
  }

  goBack(): void {
    if (this.playId) this.router.navigate(['/plays', this.playId]);
    else this.router.navigate(['/']);
  }
}
