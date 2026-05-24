import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayCreationModalComponent } from '../play-creation-modal/play-creation-modal.component';
import { PlayService, Play } from '../services/play.service';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PlayCreationModalComponent, AlertModalComponent],
  template: `
    <div style="padding: 15px; max-width: 1400px; margin: 0 auto; height: 100vh; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Comic Sans MS', cursive, sans-serif; box-sizing: border-box; display: flex; flex-direction: column;">
      <div style="text-align: center; margin-bottom: 20px; flex-shrink: 0;">
        <h1 style="font-size: 3.5rem; color: #fff; text-shadow: 4px 4px 8px rgba(0,0,0,0.3); margin: 0; animation: bounce 2s infinite;">🎭 HackTheMountain</h1>
        <p style="font-size: 1.5rem; color: #ffeaa7; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin: 5px 0;">Spectacle de Marionnettes 2D</p>
        <br/>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button (click)="showModal = true" class="fancy" style="padding: 18px 36px; font-size: 20px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 30px; font-weight: bold; box-shadow: 0 6px 20px rgba(0,0,0,0.3);">
            ✨ + Créer un nouveau spectacle
          </button>
          <button *ngIf="plays.length > 0" (click)="ui.toggleManage()" [style.background]="(ui.manageMode$ | async) ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'" class="fancy" style="padding: 18px 36px; font-size: 20px; color: white; border: none; border-radius: 30px; font-weight: bold; box-shadow: 0 6px 20px rgba(0,0,0,0.3);">
            {{ (ui.manageMode$ | async) ? '✓ Terminé' : '⚙️ Gérer' }}
          </button>
        </div>
      </div>

      <!-- Liste des spectacles existants -->
      <div *ngIf="plays.length > 0" style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
        <h2 style="text-align: center; margin: 0 0 15px 0; font-size: 2rem; color: white; text-shadow: 3px 3px 6px rgba(0,0,0,0.3); flex-shrink: 0;">🎬 Mes Spectacles</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; overflow-y: auto; padding: 20px; flex: 1; min-height: 0;" class="custom-scrollbar">
          <div *ngFor="let play of plays" 
               class="play-card"
               style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border: 4px solid white; border-radius: 20px; padding: 25px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.2); margin: 10px;">
            
            <!-- Delete button (top-right, only in manage mode) -->
            <button *ngIf="(ui.manageMode$ | async)" (click)="play.id && deletePlay(play.id)" class="btn-x" style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: #dc3545; color: white; border: 3px solid white; border-radius: 50%; font-size: 20px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;" title="Supprimer">
              ×
            </button>
            
            <div (click)="play.id && viewIfNotManage(play.id)">
              <h3 style="margin: 0 0 15px 0; color: #d63031; font-size: 2rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">🎬 {{ play.title }}</h3>
              <p style="margin: 0; color: #2d3436; font-size: 1.2rem; font-weight: bold;">Par {{ play.director_name }}</p>
              <p *ngIf="play.created_at" style="margin: 15px 0 0 0; color: #636e72; font-size: 1rem;">Créé le {{ formatDate(play.created_at) }}</p>
            </div>
            
            <!-- Edit button (always visible) -->
            <div style="margin-top: 20px;">
              <button (click)="play.id && editPlay(play.id)" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 15px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ✏️ Éditer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="plays.length === 0 && !loading" style="text-align: center; margin-top: 60px; color: white; background: rgba(255,255,255,0.2); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
        <p style="font-size: 1.8rem; font-weight: bold;">🎭 Aucun spectacle pour le moment. Créez-en un pour commencer !</p>
      </div>
    </div>

    <!-- Modale de création superposée -->
    <app-play-creation-modal *ngIf="showModal" (close)="onModalClose()"></app-play-creation-modal>
    
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
  `,
  styles: [`
    .play-card:hover {
      transform: translateY(-5px) scale(1.02) !important;
      box-shadow: 0 12px 35px rgba(0,0,0,0.3) !important;
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
export class HomeComponent implements OnInit {
  showModal = false;
  plays: Play[] = [];
  loading = true;
  alertConfig: any = null;

  constructor(
    private playService: PlayService,
    private router: Router
    , public ui: UiService
  ) {}

  ngOnInit(): void {
    this.loadPlays();
  }

  loadPlays(): void {
    this.playService.getPlays().subscribe({
      next: (plays: Play[]) => {
        this.plays = plays;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading plays:', err);
        this.loading = false;
      }
    });
  }

  viewPlay(playId: number): void {
    this.router.navigate(['/plays', playId, 'viewer']);
  }

  viewIfNotManage(playId: number): void {
    if (!this.ui.value) this.viewPlay(playId);
  }

  editPlay(playId: number): void {
    this.router.navigate(['/plays', playId]);
  }

  deletePlay(playId: number): void {
    this.alertConfig = {
      title: 'Supprimer le spectacle',
      message: 'Êtes-vous sûr de vouloir supprimer ce spectacle ?\nCette action est irréversible.',
      icon: '🗑️',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm: () => {
        this.playService.deletePlay(playId).subscribe({
          next: () => {
            this.loadPlays();
          },
          error: (err: any) => {
            console.error('Error deleting play:', err);
            this.alertConfig = {
              title: 'Erreur',
              message: 'Erreur lors de la suppression du spectacle.',
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

  onModalClose(): void {
    this.showModal = false;
    this.loadPlays(); // Reload plays after creating a new one
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
