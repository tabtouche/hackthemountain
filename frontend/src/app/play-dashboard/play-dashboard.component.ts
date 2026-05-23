import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlayService, Play } from '../services/play.service';
import { SceneService, Scene } from '../services/scene.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { SceneContentModalComponent } from '../scene-content-modal/scene-content-modal.component';

@Component({
  selector: 'app-play-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, SceneContentModalComponent],
  template: `
    <div style="padding: 30px; font-family: sans-serif;">
      <div *ngIf="loading" style="text-align: center; margin-top: 50px;">
        <h2>Chargement de la pièce...</h2>
      </div>
      
      <div *ngIf="!loading && play">
        <div style="background-color: #f4f4f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">🎬 {{ play.title }}</h1>
          <p style="margin: 5px 0 0 0; color: #666;">Réalisé par : <strong>{{ play.director_name }}</strong></p>
        </div>
        
        <h2>Mes scènes</h2>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button (click)="addScene()" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
            + Ajouter une scène
          </button>
          <button style="padding: 10px 20px; background-color: #ffc107; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ▶ Lancer le film
          </button>
        </div>
        
        <!-- Zone Drag & Drop -->
        <div 
          cdkDropList 
          cdkDropListOrientation="mixed" 
          (cdkDropListDropped)="drop($event)" 
          style="display: flex; flex-wrap: wrap; gap: 20px; min-height: 200px; padding: 20px; border: 2px dashed #ccc; border-radius: 8px;">
          
          <div *ngIf="scenes.length === 0" style="width: 100%; text-align: center; color: #999; margin-top: 40px;">
            Aucune scène pour le moment. Cliquez sur "Ajouter une scène".
          </div>

          <div *ngFor="let scene of scenes; let i = index" cdkDrag style="width: 200px; background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; cursor: grab; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" class="scene-card">
            <!-- Thumbnail Placeholder -->
            <div (click)="openModal(scene)" style="height: 120px; background: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #bbb; cursor: pointer;" title="Cliquer pour configurer le contenu">
              🖼️
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

      <div *ngIf="!loading && !play" style="text-align: center; margin-top: 50px; color: red;">
        <h2>Pièce introuvable (ID: {{ playId }})</h2>
      </div>

      <!-- Pop-up Sélecteur de Contenu -->
      <app-scene-content-modal 
        *ngIf="selectedSceneForModal" 
        [scene]="selectedSceneForModal" 
        (closeModal)="closeModal()">
      </app-scene-content-modal>
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
  `]
})
export class PlayDashboardComponent implements OnInit {
  playId: string | null = null;
  play: Play | null = null;
  loading = true;
  // Modal de sélection
  selectedSceneForModal: Scene | null = null;

  
  scenes: Scene[] = [];
  
  // Variables pour l'édition inline
  editingSceneId: number | null = null;
  editTitle: string = '';

  constructor(
    private route: ActivatedRoute, 
    private playService: PlayService,
    private sceneService: SceneService
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
  cancelEdit() {
    this.editingSceneId = null;
  }
}
