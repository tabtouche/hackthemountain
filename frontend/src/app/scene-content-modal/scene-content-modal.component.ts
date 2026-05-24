import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Scene } from '../services/scene.service';


@Component({
  selector: 'app-scene-content-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close()">✖</button>
        
        <h2 style="margin-top: 0; margin-bottom: 5px;">{{ scene.title }}</h2>
        <p style="color: #666; margin-bottom: 25px;">Que souhaitez-vous configurer pour cette scène ?</p>
        
        <div class="button-group">
          <button class="action-btn webcam-btn">🎭 Mise en scène (webcam)</button>
          <button class="action-btn music-btn">🎵 Musique</button>
          <button class="action-btn decor-btn" (click)="openDecorEditor()">🖼️ Décor</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 12px;
      min-width: 320px;
      text-align: center;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .close-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #888;
    }
    .close-btn:hover { color: #333; }
    
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .action-btn {
      padding: 15px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.2s, opacity 0.2s;
    }
    .action-btn:hover { 
      opacity: 0.9; 
      transform: scale(1.02); 
    }
    
    .webcam-btn { background: #007bff; color: white; }
    .music-btn { background: #17a2b8; color: white; }
    .decor-btn { background: #fd7e14; color: white; }
  `]
})
export class SceneContentModalComponent {
  @Input() scene!: Scene;
  @Output() closeModal = new EventEmitter<void>();
  @Output() openDecorEditorRequested = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }

  openDecorEditor() {
    this.openDecorEditorRequested.emit();
  }

  onOverlayClick(event: MouseEvent) {
    // Si l'utilisateur clique en dehors de la modale, on ferme
    this.close();
  }
}