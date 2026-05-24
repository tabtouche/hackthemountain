import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Stage } from './components/stage/stage';
import { VideoStreamService } from './services/video-stream.service';
import { EntityStreamService, Entity } from './services/entity-stream-service';
import { SequenceRecorderService, Sequence } from './services/sequence-recorder.service';
import { SceneService } from './services/scene.service';
import { AudioRecorderService, AudioRecording } from './services/audio-recorder.service';

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
  private audioRecorder = inject(AudioRecorderService);

  // Camera
  cameraActive = false;
  isLoading = false;

  // Stage
  stageEntities: Entity[] = [];

  // Recording
  recordingState: RecordingState = 'idle';
  currentSequence: Sequence | null = null;
  currentAudioRecording: AudioRecording | null = null;
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
  private audioElement: HTMLAudioElement | null = null;
  private backgroundMusicElement: HTMLAudioElement | null = null;
  backgroundImage: string | null = null;
  musicPath: string | null = null;
  
  get hasBackground(): boolean {
    return !!this.backgroundImage;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sceneId = params['sceneId'];
      this.playId = params['playId'];
      
      // Load scene data for background and music
      if (this.sceneId) {
        this.sceneService.getScene(Number(this.sceneId)).subscribe({
          next: (scene) => {
            this.backgroundImage = scene.background_image || null;
            
            // Only use music_path (uploaded files), not music_track (which is just an ID)
            this.musicPath = scene.music_path || null;
            
            // Setup background music if available (only for uploaded music files)
            if (this.musicPath && typeof Audio !== 'undefined') {
              this.backgroundMusicElement = new Audio(this.musicPath);
              this.backgroundMusicElement.loop = true;
              this.backgroundMusicElement.volume = 0.5;
            }
          },
          error: (err) => console.error('Failed to load scene:', err)
        });
      }
    });

  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.entitySubscription?.unsubscribe();
    this.stopPuppetProcess();
    this.clearPreviewTimer();
    if (this.backgroundMusicElement) {
      this.backgroundMusicElement.pause();
      this.backgroundMusicElement = null;
    }
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
    
    this.entitySubscription = this.entityStream.stream().subscribe(entities => {
      if (this.recordingState !== 'preview') {
        this.stageEntities = entities;
      }
      this.recorder.record(entities);
    });
  }

  stopCamera(): void {
    this.videoSubscription?.unsubscribe();
    this.videoSubscription = null;
    this.entitySubscription?.unsubscribe();
    this.entitySubscription = null;
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

  async startRecording(): Promise<void> {
    try {
      await this.audioRecorder.startRecording();
      this.recorder.start();
      this.recordingState = 'recording';
      
      // Start background music if available
      if (this.backgroundMusicElement) {
        this.backgroundMusicElement.currentTime = 0;
        this.backgroundMusicElement.play().catch(err => console.error('Failed to play background music:', err));
      }
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      alert('Could not access microphone. Please grant permission and try again.');
    }
  }

  pauseRecording(): void {
    this.recorder.pause();
    this.recordingState = 'paused';
    
    // Pause background music
    if (this.backgroundMusicElement) {
      this.backgroundMusicElement.pause();
    }
  }

  resumeRecording(): void {
    this.recorder.resume();
    this.recordingState = 'recording';
    
    // Resume background music
    if (this.backgroundMusicElement) {
      this.backgroundMusicElement.play().catch(err => console.error('Failed to resume background music:', err));
    }
  }

  async stopRecording(): Promise<void> {
    this.currentSequence = this.recorder.stop();
    
    // Stop background music
    if (this.backgroundMusicElement) {
      this.backgroundMusicElement.pause();
      this.backgroundMusicElement.currentTime = 0;
    }
    
    try {
      this.currentAudioRecording = await this.audioRecorder.stopRecording();
    } catch (error) {
      console.error('Failed to stop audio recording:', error);
      this.currentAudioRecording = null;
    }
    
    // Check if any frames were recorded
    if (!this.currentSequence || this.currentSequence.frames.length === 0) {
      alert('⚠️ Aucune image enregistrée!\n\nLe serveur de suivi des marionnettes (ws://localhost:8765) ne semble pas être en cours d\'exécution.\n\nVeuillez démarrer le serveur de suivi pour enregistrer les mouvements des marionnettes.');
      this.restartRecording();
      return;
    }
    
    this.recordingState = 'preview';
    this.previewCurrentFrameIndex = 0;
    this.previewPlaying = true;
    this.previewEntities = this.currentSequence.frames[0]?.entities ?? [];
    this.setupAudioPlayback();
    this.scheduleNextFrame();
  }

  restartRecording(): void {
    this.clearPreviewTimer();
    this.recorder.reset();
    this.currentSequence = null;
    if (this.currentAudioRecording) {
      URL.revokeObjectURL(this.currentAudioRecording.url);
      this.currentAudioRecording = null;
    }
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
      this.audioElement?.play();
      this.scheduleNextFrame();
    } else {
      this.audioElement?.pause();
      this.clearPreviewTimer();
    }
  }

  seekTo(index: number): void {
    if (!this.currentSequence) return;
    this.clearPreviewTimer();
    this.previewPlaying = false;
    this.previewCurrentFrameIndex = index;
    this.previewEntities = this.currentSequence.frames[index]?.entities ?? [];
    if (this.audioElement && this.currentSequence.frames[index]) {
      this.audioElement.pause();
      this.audioElement.currentTime = this.currentSequence.frames[index].t / 1000;
    }
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

  async validateSequence(): Promise<void> {
    if (!this.currentSequence || !this.sceneId) return;
    this.saving = true;
    
    try {
      // Save sequence data
      await this.sceneService.saveSequence(Number(this.sceneId), JSON.stringify(this.currentSequence)).toPromise();
      
      // Save audio recording if available
      if (this.currentAudioRecording) {
        const reader = new FileReader();
        const audioDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(this.currentAudioRecording!.blob);
        });
        await this.sceneService.saveAudioRecording(Number(this.sceneId), audioDataUrl).toPromise();
      }
      
      this.saving = false;
      this.finishPreview();
      
      // Navigate back to play dashboard
      if (this.playId) {
        this.router.navigate(['/plays', this.playId]);
      }
    } catch (error) {
      console.error('Failed to save sequence:', error);
      this.saving = false;
    }
  }

  deleteSequence(): void {
    this.finishPreview();
  }

  private finishPreview(): void {
    this.clearPreviewTimer();
    this.cleanupAudioPlayback();
    this.recorder.reset();
    this.currentSequence = null;
    if (this.currentAudioRecording) {
      URL.revokeObjectURL(this.currentAudioRecording.url);
      this.currentAudioRecording = null;
    }
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

  private setupAudioPlayback(): void {
    this.cleanupAudioPlayback();
    if (this.currentAudioRecording) {
      this.audioElement = new Audio(this.currentAudioRecording.url);
      this.audioElement.loop = true;
      this.audioElement.play().catch(err => console.error('Audio playback failed:', err));
    }
  }

  private cleanupAudioPlayback(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  goBack(): void {
    if (this.playId) this.router.navigate(['/plays', this.playId]);
    else this.router.navigate(['/']);
  }
}
