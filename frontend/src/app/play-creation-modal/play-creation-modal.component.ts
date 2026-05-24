import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayService } from '../services/play.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-play-creation-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 style="margin-top:0;">Créer une nouvelle pièce</h2>
        <form [formGroup]="playForm" (ngSubmit)="onSubmit()">
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom: 5px;">Nom de la pièce :</label>
            <input formControlName="title" type="text" placeholder="Ex: Le Petit Chaperon Rouge" style="width: 100%; padding: 8px; box-sizing: border-box;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom: 5px;">Nom du réalisateur :</label>
            <input formControlName="director_name" type="text" placeholder="Ex: Jean" style="width: 100%; padding: 8px; box-sizing: border-box;" />
          </div>
          <div class="actions">
            <button type="button" (click)="close.emit()" style="padding: 8px 15px;">Annuler</button>
            <button type="submit" [disabled]="playForm.invalid || isLoading" style="padding: 8px 15px;">
              {{ isLoading ? 'Création en cours...' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;
    }
    .modal-content {
      background: white; padding: 25px; border-radius: 8px; min-width: 320px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .actions { display: flex; justify-content: space-between; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class PlayCreationModalComponent {
  @Output() close = new EventEmitter<void>();
  playForm: FormGroup;
  isLoading = false;

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
          alert('Erreur lors de la création de la pièce.');
        }
      });
    }
  }
}
