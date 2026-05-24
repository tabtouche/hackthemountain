import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayService } from '../services/play.service';
import { CommonModule } from '@angular/common';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';

@Component({
  selector: 'app-play-creation-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AlertModalComponent],
  template: `
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 style="margin-top:0; font-size: 2.5rem; color: #d63031; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">🎭 Créer une nouvelle pièce</h2>
        <form [formGroup]="playForm" (ngSubmit)="onSubmit()">
          <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom: 8px; font-size: 1.2rem; font-weight: bold; color: #2d3436;">Nom de la pièce :</label>
            <input formControlName="title" type="text" placeholder="Ex: Le Petit Chaperon Rouge" style="width: 100%; padding: 12px 16px; box-sizing: border-box; border: 3px solid #ddd; border-radius: 15px; font-size: 1.1rem; font-family: 'Comic Sans MS', cursive, sans-serif;" />
          </div>
          <div style="margin-bottom: 25px;">
            <label style="display:block; margin-bottom: 8px; font-size: 1.2rem; font-weight: bold; color: #2d3436;">Nom du réalisateur :</label>
            <input formControlName="director_name" type="text" placeholder="Ex: Jean" style="width: 100%; padding: 12px 16px; box-sizing: border-box; border: 3px solid #ddd; border-radius: 15px; font-size: 1.1rem; font-family: 'Comic Sans MS', cursive, sans-serif;" />
          </div>
          <div class="actions">
            <button type="button" (click)="close.emit()" style="padding: 12px 24px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 25px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">Annuler</button>
            <button type="submit" [disabled]="playForm.invalid || isLoading" style="padding: 12px 24px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 25px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              {{ isLoading ? '⏳ Création en cours...' : '✨ Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
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
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }
    .modal-content {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      padding: 35px;
      border-radius: 25px;
      min-width: 420px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border: 5px solid white;
    }
    .actions { display: flex; justify-content: space-between; gap: 15px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button:not(:disabled):hover { transform: scale(1.05); transition: transform 0.2s; }
  `]
})
export class PlayCreationModalComponent {
  @Output() close = new EventEmitter<void>();
  playForm: FormGroup;
  isLoading = false;
  alertConfig: any = null;

  constructor(private fb: FormBuilder, private playService: PlayService, private router: Router) {
    // Initialisation du formulaire réactif avec validation requise
    this.playForm = this.fb.group({
      title: ['', Validators.required],
      director_name: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.playForm.valid) {
      this.isLoading = true;
      const { title, director_name } = this.playForm.value;
      
      this.playService.createPlay(title, director_name).subscribe({
        next: (play) => {
          // Redirection vers le dashboard de la pièce créée
          this.router.navigate(['/plays', play.id]);
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.isLoading = false;
          this.alertConfig = {
            title: 'Erreur',
            message: 'Erreur lors de la création de la pièce.',
            icon: '❌',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: () => {},
            onCancel: () => {}
          };
        }
      });
    }
  }
}
