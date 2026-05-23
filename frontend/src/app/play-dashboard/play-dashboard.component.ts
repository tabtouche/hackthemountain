import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlayService, Play } from '../services/play.service';

@Component({
  selector: 'app-play-dashboard',
  standalone: true,
  imports: [CommonModule],
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
          <button style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">+ Ajouter une scène</button>
          <button style="padding: 10px 20px; background-color: #ffc107; color: white; border: none; border-radius: 4px; cursor: pointer;">▶ Lancer le film</button>
        </div>
        
        <div style="border: 2px dashed #ccc; padding: 50px; text-align: center; color: #999; border-radius: 8px;">
          (Interface Squelette - La liste des scènes apparaîtra ici)
        </div>
      </div>

      <div *ngIf="!loading && !play" style="text-align: center; margin-top: 50px; color: red;">
        <h2>Pièce introuvable (ID: {{ playId }})</h2>
      </div>
    </div>
  `
})
export class PlayDashboardComponent implements OnInit {
  playId: string | null = null;
  play: Play | null = null;
  loading = true;

  constructor(private route: ActivatedRoute, private playService: PlayService) {}

  ngOnInit() {
    this.playId = this.route.snapshot.paramMap.get('id');
    if (this.playId) {
      this.playService.getPlay(this.playId).subscribe({
        next: (data) => {
          this.play = data;
          this.loading = false;
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
}
