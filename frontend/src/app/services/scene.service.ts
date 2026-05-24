import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { signal } from '@angular/core';

export interface Scene {
  id: number;
  play_id: number;
  title: string;
  sequence_order: number;
  background_image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SceneService {
  private apiUrlPlays = 'http://localhost:3000/api/plays';
  private apiUrlScenes = 'http://localhost:3000/api/scenes';

  // Track the currently active scene for mise en scène / webcam capture
  currentSceneId = signal<number | null>(null);

  constructor(private http: HttpClient) {}

  getScenes(playId: string | number): Observable<Scene[]> {
    return this.http.get<Scene[]>(`${this.apiUrlPlays}/${playId}/scenes`);
  }

  createScene(playId: string | number, title?: string): Observable<Scene> {
    const body = title ? { title } : {};
    return this.http.post<Scene>(`${this.apiUrlPlays}/${playId}/scenes`, body);
  }

  updateScene(id: number, title?: string, sequence_order?: number): Observable<Scene> {
    return this.http.put<Scene>(`${this.apiUrlScenes}/${id}`, { title, sequence_order });
  }

  deleteScene(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlScenes}/${id}`);
  }

  saveBackground(id: number, backgroundImage: string): Observable<Scene> {
    return this.http.put<Scene>(`${this.apiUrlScenes}/${id}`, { background_image: backgroundImage });
  }

  // Permet de sauvegarder l'ordre en une seule requête suite à un drag & drop
  bulkReorder(scenes: { id: number; sequence_order: number }[]): Observable<any> {
    return this.http.put(`${this.apiUrlScenes}/bulk/reorder`, { scenes });
  }
}
