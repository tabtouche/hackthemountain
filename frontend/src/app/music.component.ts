import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SceneService } from './services/scene.service';

interface Track {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
}

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.css'],
})
export class Music implements OnInit {
  playId: string | null = null;
  sceneId: string | null = null;
  uploadedFile: File | null = null;
  uploadedAudioUrl: string | null = null;
  selectedTrack: Track | null = null;
  currentSelectionLabel: string | null = null;
  confirmationMessage = '';
  isSaving = false;
  loadingScene = false;

  availableTracks: Track[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sceneService: SceneService
  ) {
    this.playId = this.route.snapshot.paramMap.get('playId');
    this.sceneId = this.route.snapshot.paramMap.get('sceneId');
    this.availableTracks = [
      {
        id: 'magie',
        title: 'Rêve magique',
        description: 'Calme et doux.',
        audioUrl: this.buildToneDataUrl(330)
      },
      {
        id: 'aventure',
        title: 'Aventure',
        description: 'Rapide et drôle.',
        audioUrl: this.buildToneDataUrl(550)
      },
      {
        id: 'cocasse',
        title: 'Rigolo',
        description: 'Joyeux et sauteur.',
        audioUrl: this.buildToneDataUrl(770)
      }
    ];
  }

  ngOnInit() {
    if (this.sceneId) {
      this.loadSceneSelection(Number(this.sceneId));
    }
  }

  private buildToneDataUrl(freq: number, duration = 1.5): string {
    const sampleRate = 22050;
    const sampleCount = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, sampleCount * 2, true);

    let offset = 44;
    for (let i = 0; i < sampleCount; i++) {
      const t = i / sampleRate;
      const amplitude = 0.55 * (1 - t / duration);
      const sample = Math.round(amplitude * 0x7fff * Math.sin(2 * Math.PI * freq * t));
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    const audioBytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < audioBytes.length; i += chunkSize) {
      const chunk = audioBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  private loadSceneSelection(sceneId: number) {
    this.loadingScene = true;
    this.sceneService.getScene(sceneId).subscribe({
      next: (scene) => {
        if (scene.music_track) {
          const track = this.availableTracks.find(t => t.id === scene.music_track);
          if (track) {
            this.selectedTrack = track;
            this.currentSelectionLabel = track.title;
          }
        }

        if (scene.music_path) {
          this.uploadedAudioUrl = scene.music_path.startsWith('http')
            ? scene.music_path
            : `http://localhost:3000${scene.music_path}`;
          this.selectedTrack = null;
          this.currentSelectionLabel = scene.music_path.split('/').pop() || 'Musique uploadée';
        }
      },
      error: (err) => {
        console.error('Impossible de charger la scène', err);
      },
      complete: () => {
        this.loadingScene = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('audio/')) {
      this.confirmationMessage = 'Veuillez sélectionner un fichier audio valide.';
      return;
    }

    this.uploadedFile = file;
    this.selectedTrack = null;
    this.currentSelectionLabel = file.name;
    this.confirmationMessage = '';

    if (this.uploadedAudioUrl) {
      URL.revokeObjectURL(this.uploadedAudioUrl);
    }
    this.uploadedAudioUrl = URL.createObjectURL(file);
  }

  selectTrack(track: Track) {
    this.selectedTrack = track;
    this.uploadedFile = null;
    if (this.uploadedAudioUrl) {
      URL.revokeObjectURL(this.uploadedAudioUrl);
      this.uploadedAudioUrl = null;
    }
    this.currentSelectionLabel = track.title;
    this.confirmationMessage = '';
  }

  async saveSelection() {
    if (!this.sceneId) {
      this.confirmationMessage = 'Scène introuvable.';
      return;
    }

    if (!this.uploadedFile && !this.selectedTrack) {
      this.confirmationMessage = 'Aucune musique sélectionnée.';
      return;
    }

    this.isSaving = true;
    this.confirmationMessage = '';

    try {
      let musicPath: string | undefined;
      let musicTrack: string | undefined;

      if (this.uploadedFile) {
        musicPath = await this.uploadFile(this.uploadedFile);
      } else if (this.selectedTrack) {
        musicTrack = this.selectedTrack.id;
      }

      await firstValueFrom(
        this.sceneService.saveMusic(
          Number(this.sceneId),
          musicPath,
          musicTrack
        )
      );

      this.currentSelectionLabel = this.uploadedFile
        ? this.uploadedFile.name
        : this.selectedTrack?.title ?? this.currentSelectionLabel;
      this.confirmationMessage = this.uploadedFile
        ? `Musique uploadée et enregistrée !`
        : `Musique choisie et enregistrée !`;
    } catch (err) {
      console.error(err);
      this.confirmationMessage = 'Erreur lors de l’enregistrement de la musique.';
    } finally {
      this.isSaving = false;
    }
  }

  private async uploadFile(file: File): Promise<string> {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch('http://localhost:3000/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, dataUrl })
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.path;
  }

  goBack() {
    if (this.playId) {
      this.router.navigate(['/plays', this.playId]);
      return;
    }
    this.router.navigate(['/']);
  }
}
