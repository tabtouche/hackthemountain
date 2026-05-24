import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayCreationModalComponent } from '../play-creation-modal/play-creation-modal.component';
import { PlayService, Play } from '../services/play.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PlayCreationModalComponent],
  template: `
    <div style="padding: 40px; max-width: 1400px; margin: 0 auto; height: 100vh; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Comic Sans MS', cursive, sans-serif;">
      <div style="text-align: center; margin-bottom: 50px;">
        <h1 style="font-size: 4.5rem; color: #fff; text-shadow: 4px 4px 8px rgba(0,0,0,0.3); margin: 0; animation: bounce 2s infinite;">🎭 HackTheMountain</h1>
        <p style="font-size: 2rem; color: #ffeaa7; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin: 10px 0;">Spectacle de Marionnettes 2D</p>
        <br/>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button (click)="showModal = true" style="padding: 18px 36px; font-size: 20px; cursor: pointer; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 30px; font-weight: bold; box-shadow: 0 6px 20px rgba(0,0,0,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1) rotate(-2deg)'" onmouseout="this.style.transform='scale(1) rotate(0)';">
            ✨ + Créer un nouveau spectacle
          </button>
          <button *ngIf="plays.length > 0" (click)="manageMode = !manageMode" [style.background]="manageMode ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'" style="padding: 18px 36px; font-size: 20px; cursor: pointer; color: white; border: none; border-radius: 30px; font-weight: bold; box-shadow: 0 6px 20px rgba(0,0,0,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1) rotate(2deg)'" onmouseout="this.style.transform='scale(1) rotate(0)';">
            {{ manageMode ? '✓ Terminé' : '⚙️ Gérer' }}
          </button>
        </div>
      </div>

      <!-- Liste des spectacles existants -->
      <div *ngIf="plays.length > 0" style="margin-top: 60px;">
        <h2 style="text-align: center; margin-bottom: 40px; font-size: 3rem; color: white; text-shadow: 3px 3px 6px rgba(0,0,0,0.3);">🎬 Mes Spectacles</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; max-height: 600px; overflow-y: auto; padding: 20px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.5) transparent;">
          <div *ngFor="let play of plays" 
               style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border: 4px solid white; border-radius: 20px; padding: 25px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; position: relative; box-shadow: 0 8px 25px rgba(0,0,0,0.2); margin: 10px;"
               onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 12px 35px rgba(0,0,0,0.3)'"
               onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.2)'">
            
            <!-- Delete button (top-right, only in manage mode) -->
            <button *ngIf="manageMode" (click)="play.id && deletePlay(play.id)" style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: #dc3545; color: white; border: 3px solid white; border-radius: 50%; cursor: pointer; font-size: 20px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;" title="Supprimer">
              ×
            </button>
            
            <div (click)="play.id && (manageMode ? null : viewPlay(play.id))">
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
  `
})
export class HomeComponent implements OnInit {
  showModal = false;
  plays: Play[] = [];
  loading = true;
  manageMode = false;

  constructor(
    private playService: PlayService,
    private router: Router
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

  editPlay(playId: number): void {
    this.router.navigate(['/plays', playId]);
  }

  deletePlay(playId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce spectacle ? Cette action est irréversible.')) {
      return;
    }
    
    this.playService.deletePlay(playId).subscribe({
      next: () => {
        this.loadPlays();
      },
      error: (err: any) => {
        console.error('Error deleting play:', err);
        alert('Erreur lors de la suppression du spectacle.');
      }
    });
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
