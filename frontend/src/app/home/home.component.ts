import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayCreationModalComponent } from '../play-creation-modal/play-creation-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PlayCreationModalComponent],
  template: `
    <div style="text-align: center; margin-top: 100px;">
      <h1>🎭 HackTheMountain</h1>
      <p style="font-size: 1.2rem; color: #555;">Spectacle de Marionnettes 2D</p>
      <br/>
      <button (click)="showModal = true" style="padding: 15px 30px; font-size: 18px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 5px;">
        Créer un spectacle
      </button>
    </div>

    <!-- Modale de création superposée -->
    <app-play-creation-modal *ngIf="showModal" (close)="showModal = false"></app-play-creation-modal>
  `
})
export class HomeComponent {
  showModal = false;
}
