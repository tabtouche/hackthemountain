import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Stage } from '../components/stage/stage';
import { SceneService, Scene } from '../services/scene.service';
import { PlayService } from '../services/play.service';
import { Sequence, SequenceFrame } from '../services/sequence-recorder.service';
import { Entity } from '../services/entity-stream-service';
import { TRACK_URLS } from '../music-tracks';

@Component({
  selector: 'app-play-viewer',
  templateUrl: './play-viewer.component.html',
  styleUrls: ['./play-viewer.component.css'],
  standalone: true,
  imports: [CommonModule, Stage]
})
export class PlayViewerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sceneService = inject(SceneService);
  private playService = inject(PlayService);

  playId: string | null = null;
  playTitle: string = '';
  playDirector: string = '';
  scenes: Scene[] = [];
  currentSceneIndex = -1; // Start at -1 for title card
  currentSequence: Sequence | null = null;
  currentFrameIndex = 0;
  stageEntities: Entity[] = [];
  isPlaying = false;
  isLoading = true;
  showingTitleCard = true;
  hasBackground = false;

  private frameTimer: ReturnType<typeof setTimeout> | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.playId = params['playId'];
      if (this.playId) {
        this.loadScenes();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private loadScenes(): void {
    if (!this.playId) return;
    
    // Load play info first
    this.playService.getPlay(this.playId).subscribe({
      next: (play: any) => {
        this.playTitle = play.title;
        this.playDirector = play.director_name;
      },
      error: (err: any) => {
        console.error('Failed to load play info:', err);
      }
    });
    
    // Load scenes
    this.sceneService.getScenes(this.playId).subscribe({
      next: (scenes: Scene[]) => {
        this.scenes = scenes.filter((s: Scene) => s.sequence_data);
        this.isLoading = false;
        // Start with title card (index -1)
        this.showingTitleCard = true;
      },
      error: (err: any) => {
        console.error('Failed to load scenes:', err);
        this.isLoading = false;
      }
    });
  }

  private loadScene(index: number): void {
    if (index >= this.scenes.length) {
      this.isPlaying = false;
      return;
    }

    this.currentSceneIndex = index;
    const scene = this.scenes[index];
    
    this.hasBackground = !!scene.background_image;

    if (scene.sequence_data) {
      try {
        this.currentSequence = JSON.parse(scene.sequence_data);
        this.currentFrameIndex = 0;
        this.stageEntities = this.currentSequence?.frames[0]?.entities ?? [];
      } catch (err) {
        console.error('Failed to parse sequence data:', err);
        this.currentSequence = null;
      }
    }

    this.setupAudio(scene);
  }

  private setupAudio(scene: Scene): void {
    this.cleanupAudio();

    if (typeof Audio === 'undefined') return; // Skip audio setup during SSR

    if (scene.audio_recording) {
      this.audioElement = new Audio(scene.audio_recording);
      this.audioElement.load();
    }

    const musicUrl = scene.music_path || (scene.music_track ? TRACK_URLS[scene.music_track] : null);
    if (musicUrl) {
      this.backgroundAudio = new Audio(musicUrl);
      this.backgroundAudio.loop = true;
      this.backgroundAudio.volume = 0.5;
      this.backgroundAudio.load();
    }
  }

  play(): void {
    if (this.showingTitleCard) {
      this.showingTitleCard = false;
      if (this.scenes.length > 0) {
        this.loadScene(0);
        setTimeout(() => this.play(), 100);
      }
      return;
    }
    
    if (!this.currentSequence) return;
    this.isPlaying = true;
    
    // Play audio with proper error handling
    if (this.audioElement) {
      this.audioElement.play().catch(err => {
        // Silently ignore - audio may not be available
      });
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.play().catch(err => {
        // Silently ignore - music may not be available
      });
    }
    
    this.scheduleNextFrame();
  }

  pause(): void {
    this.isPlaying = false;
    this.clearFrameTimer();
    this.audioElement?.pause();
    this.backgroundAudio?.pause();
  }

  private scheduleNextFrame(): void {
    if (!this.isPlaying || !this.currentSequence) return;

    const frames = this.currentSequence.frames;
    const nextIndex = this.currentFrameIndex + 1;

    if (nextIndex >= frames.length) {
      this.playNextScene();
      return;
    }

    const delay = frames[nextIndex].t - frames[this.currentFrameIndex].t;
    this.frameTimer = setTimeout(() => {
      this.currentFrameIndex = nextIndex;
      this.stageEntities = frames[nextIndex].entities;
      this.scheduleNextFrame();
    }, Math.max(1, delay));
  }

  private playNextScene(): void {
    this.cleanupAudio();
    this.clearFrameTimer();
    
    const nextIndex = this.currentSceneIndex + 1;
    if (nextIndex < this.scenes.length) {
      this.loadScene(nextIndex);
      setTimeout(() => this.play(), 500);
    } else {
      this.isPlaying = false;
    }
  }

  restart(): void {
    this.cleanup();
    this.showingTitleCard = true;
    this.currentSceneIndex = -1;
    this.isPlaying = false;
  }

  private clearFrameTimer(): void {
    if (this.frameTimer !== null) {
      clearTimeout(this.frameTimer);
      this.frameTimer = null;
    }
  }

  private cleanupAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.src = '';
      this.backgroundAudio = null;
    }
  }

  private cleanup(): void {
    this.clearFrameTimer();
    this.cleanupAudio();
  }

  get currentScene(): Scene | null {
    if (this.showingTitleCard) return null;
    return this.scenes[this.currentSceneIndex] ?? null;
  }

  get sceneProgress(): string {
    if (this.showingTitleCard) return 'Titre';
    return `Scène ${this.currentSceneIndex + 1} / ${this.scenes.length}`;
  }

  getBackgroundStyle(): string {
    if (this.currentScene?.background_image) {
      return `url("${this.currentScene.background_image}")`;
    }
    return 'none';
  }

  getTitleCardBackground(): string {
    return 'url("assets/stage.jpg")';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
