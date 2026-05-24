import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlayService, Play } from '../services/play.service';
import { SceneService, Scene } from '../services/scene.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { SceneContentModalComponent } from '../scene-content-modal/scene-content-modal.component';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-play-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, SceneContentModalComponent, AlertModalComponent],
  template: `
    <div style="padding: 15px; font-family: 'Comic Sans MS', cursive, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column;">
          <button (click)="goHome()" class="btn-back" style="position: fixed; top: 20px; left: 20px; padding: 12px 24px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        ← Accueil
      </button>
      
      <div *ngIf="loading" style="text-align: center; margin-top: 50px; color: white;">
        <h2 style="font-size: 2.5rem;">🎭 Chargement de la pièce...</h2>
      </div>
      
      <div *ngIf="!loading && play" style="padding-top: 70px; display: flex; flex-direction: column;">
        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 15px; border-radius: 15px; margin-bottom: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 4px solid #fff;">
          <h1 style="margin: 0; color: #d63031; font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">🎬 {{ play.title }}</h1>
          <p style="margin: 3px 0 0 0; color: #2d3436; font-size: 1rem;">Réalisé par : <strong>{{ play.director_name }}</strong></p>
        </div>
        
        <h2 style="color: white; font-size: 1.8rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin: 0 0 10px 0;">🎭 Mes scènes</h2>
        <div style="display: flex; gap: 15px; margin-bottom: 10px; flex-wrap: wrap;">
          <button (click)="addScene()" class="fancy" style="padding: 15px 30px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            ✨ + Ajouter une scène
          </button>
          <button (click)="playShow()" [disabled]="!hasCompletedScenes()" class="fancy" style="padding: 15px 30px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2);" [style.opacity]="hasCompletedScenes() ? '1' : '0.5'" [style.cursor]="hasCompletedScenes() ? 'pointer' : 'not-allowed'">
            🎬 ▶ Lancer le film
          </button>
          <button *ngIf="scenes.length > 0" (click)="ui.toggleManage()" [style.background]="(ui.manageMode$ | async) ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'" class="fancy" style="padding: 15px 30px; color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            {{ (ui.manageMode$ | async) ? '✓ Terminé' : '⚙️ Gérer' }}
          </button>
        </div>
        
        <!-- Zone Drag & Drop -->
        <div 
          cdkDropList 
          cdkDropListOrientation="mixed" 
          (cdkDropListDropped)="drop($event)" 
          class="custom-scrollbar"
          style="display: flex; flex-wrap: wrap; gap: 20px; overflow-y: auto; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; max-height: calc(100vh - 400px); align-content: flex-start;">
          
          <div *ngIf="scenes.length === 0" style="width: 100%; text-align: center; color: #999; margin-top: 40px;">
            Aucune scène pour le moment. Cliquez sur "Ajouter une scène".
          </div>

          <div *ngFor="let scene of scenes; let i = index" cdkDrag style="width: 220px; cursor: grab; transition: transform 0.2s; position: relative;" class="scene-card">
            <!-- Delete button (only in manage mode) -->
            <button *ngIf="(ui.manageMode$ | async)" (click)="deleteScene(scene.id!)" class="btn-x" style="position: absolute; top: -8px; right: -8px; width: 30px; height: 30px; background: #dc3545; color: white; border: 2px solid white; border-radius: 50%; font-size: 16px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: center; justify-content: center;" title="Supprimer">
              ×
            </button>
            
            <!-- Card content with clipping -->
            <div style="background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border: 3px solid #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.15);">
              <!-- Thumbnail -->
              <div (click)="openModal(scene)" style="height: 120px; background: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #bbb; cursor: pointer; overflow: hidden; position: relative;" title="Cliquer pour configurer le contenu">
              <img *ngIf="scene.background_image" [src]="scene.background_image" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0;" alt="Décor" />
              <span *ngIf="!scene.background_image">🖼️</span>
              
              <!-- Completion indicators -->
              <div style="position: absolute; bottom: 4px; right: 4px; display: flex; gap: 2px; background: rgba(0,0,0,0.7); padding: 2px 4px; border-radius: 3px; font-size: 14px; line-height: 1;">
                <span [style.opacity]="scene.background_image ? '1' : '0.3'" title="Décor">🖼️</span>
                <span [style.opacity]="scene.music_path || scene.music_track ? '1' : '0.3'" title="Musique">🎵</span>
                <span [style.opacity]="scene.sequence_data ? '1' : '0.3'" title="Mise en scène">🎭</span>
                <span [style.opacity]="scene.audio_recording ? '1' : '0.3'" title="Audio">🎤</span>
              </div>
              </div>
              
              <!-- Zone Titre -->
              <div style="padding: 10px; text-align: center;">
                <div *ngIf="editingSceneId !== scene.id" (dblclick)="startEdit(scene)" style="font-weight: bold; cursor: text;" title="Double-cliquez pour renommer">
                  {{ scene.title }}
                </div>
                
                <input 
                  *ngIf="editingSceneId === scene.id" 
                  [(ngModel)]="editTitle" 
                  (blur)="saveEdit(scene)" 
                  (keyup.enter)="saveEdit(scene)"
                  (keyup.escape)="cancelEdit()"
                  autoFocus
                  style="width: 90%; text-align: center; padding: 4px;"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div *ngIf="!loading && !play" style="text-align: center; margin-top: 50px; color: red;">
        <h2>Pièce introuvable (ID: {{ playId }})</h2>
      </div>

      <!-- Pop-up Sélecteur de Contenu -->
      <app-scene-content-modal
        *ngIf="selectedSceneForModal"
        [scene]="selectedSceneForModal"
        (closeModal)="closeModal()"
        (openDecorEditorRequested)="openDecorEditor()"
        (openWebcamRequested)="openWebcam()"
        (openMusicEditorRequest)="openMusicEditor()">
      </app-scene-content-modal>
      
      <!-- Alert Modal -->
      <app-alert-modal 
        *ngIf="alertConfig"
        [title]="alertConfig.title"
        [message]="alertConfig.message"
        [icon]="alertConfig.icon"
        [confirmText]="alertConfig.confirmText"
        [cancelText]="alertConfig.cancelText"
        [showCancel]="alertConfig.showCancel"
        (confirm)="alertConfig.onConfirm()"
        (cancel)="alertConfig.onCancel()"
        (close)="alertConfig = null">
      </app-alert-modal>
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.15);
      opacity: 0.9;
    }
    .cdk-drag-placeholder {
      opacity: 0;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .scene-card:active {
      cursor: grabbing !important;
    }

    .scene-card:hover {
      transform: translateY(-8px) rotate(2deg);
    }

    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.6) rgba(255,255,255,0.1);
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.6);
      border-radius: 10px;
      border: 2px solid rgba(255,255,255,0.1);
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.8);
    }
  `]
})
export class PlayDashboardComponent implements OnInit {
  playId: string | null = null;
  play: Play | null = null;
  loading = true;
  selectedSceneForModal: Scene | null = null;
  alertConfig: any = null;
  // manageMode is now global in UiService

  
  scenes: Scene[] = [];
  
  // Variables pour l'édition inline
  editingSceneId: number | null = null;
  editTitle: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playService: PlayService,
    private sceneService: SceneService
    , public ui: UiService
  ) {}

  ngOnInit() {
    this.playId = this.route.snapshot.paramMap.get('id');
    if (this.playId) {
      this.playService.getPlay(this.playId).subscribe({
        next: (data) => {
          this.play = data;
          this.loadScenes();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  loadScenes() {
    if (!this.playId) return;
    this.sceneService.getScenes(this.playId).subscribe({
      next: (scenes) => {
        this.scenes = scenes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement scènes', err);
        this.loading = false;
      }
    });
  }

  addScene() {
    if (!this.playId) return;
    this.sceneService.createScene(this.playId).subscribe({
      next: (newScene) => {
        this.scenes.push(newScene);
      },
      error: (err) => {
        console.error('Erreur création scène', err);
      }
    });
  }

  drop(event: CdkDragDrop<Scene[]>) {
    // Si l'élément n'a pas bougé, on ne fait rien
    if (event.previousIndex === event.currentIndex) return;

    // Met à jour visuellement le tableau local instantanément
    moveItemInArray(this.scenes, event.previousIndex, event.currentIndex);

    // Prépare le payload pour mettre à jour la BDD
    // On réassigne le sequence_order (ex: 1, 2, 3...)
    const reorderPayload = this.scenes.map((scene, index) => ({
      id: scene.id,
      sequence_order: index + 1
    }));

    // Appel l'API bulk pour tout sauvegarder d'un coup
    this.sceneService.bulkReorder(reorderPayload).subscribe({
      error: (err) => console.error('Erreur de réorganisation', err)
    });
  }

  startEdit(scene: Scene) {
    this.editingSceneId = scene.id;
    this.editTitle = scene.title;
  }

  saveEdit(scene: Scene) {
    if (this.editingSceneId !== scene.id) return;
    
    // Si le titre a changé
    if (this.editTitle.trim() && this.editTitle !== scene.title) {
      const newTitle = this.editTitle.trim();
      // Maj locale optimiste
      scene.title = newTitle;
      
      // Maj en BDD
      this.sceneService.updateScene(scene.id, newTitle).subscribe({
        error: (err) => {
          console.error('Erreur lors du renommage', err);
          // Si erreur, il faudrait idéalement rollback localement
        }
      });
    }
    
    this.editingSceneId = null;
  }


  openModal(scene: Scene) {
    this.selectedSceneForModal = scene;
  }

  closeModal() {
    this.selectedSceneForModal = null;
  }

  openDecorEditor() {
    if (this.selectedSceneForModal) {
      this.router.navigate(['/plays', this.playId, 'scene', this.selectedSceneForModal.id, 'decor']);
      this.selectedSceneForModal = null;
    }
  }

  openWebcam() {
    if (this.selectedSceneForModal) {
      this.router.navigate(['/plays', this.playId, 'scene', this.selectedSceneForModal.id, 'webcam']);
      this.selectedSceneForModal = null;
    }
  }

  openMusicEditor(){
    if (this.selectedSceneForModal) {
      this.router.navigate(['/plays', this.playId, 'scene', this.selectedSceneForModal.id, 'music']);
      this.selectedSceneForModal = null;
    }
  }

  cancelEdit() {
    this.editingSceneId = null;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  hasCompletedScenes(): boolean {
    return this.scenes.some(s => s.sequence_data);
  }

  playShow() {
    if (!this.hasCompletedScenes()) {
      this.alertConfig = {
        title: 'Aucune scène à jouer',
        message: 'Vous devez d\'abord enregistrer au moins une scène avant de lancer le spectacle.',
        icon: '🎬',
        confirmText: 'OK',
        showCancel: false,
        autoDismiss: 3000,
        onConfirm: () => {},
        onCancel: () => {}
      };
      return;
    }
    
    if (this.playId) {
      this.router.navigate(['/plays', this.playId, 'viewer']);
    }
  }

  deleteScene(sceneId: number): void {
    this.alertConfig = {
      title: 'Supprimer la scène',
      message: 'Êtes-vous sûr de vouloir supprimer cette scène ?',
      icon: '🗑️',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: () => {
        this.sceneService.deleteScene(sceneId).subscribe({
          next: () => {
            this.loadScenes();
          },
          error: (err) => {
            console.error('Error deleting scene:', err);
            this.alertConfig = {
              title: 'Erreur',
              message: 'Erreur lors de la suppression de la scène.',
              icon: '❌',
              confirmText: 'OK',
              showCancel: false,
              onConfirm: () => {},
              onCancel: () => {}
            };
          }
        });
      },
      onCancel: () => {}
    };
  }
}
