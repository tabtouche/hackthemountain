import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Play {
  id?: number;
  title: string;
  director_name: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayService {
  private apiUrl = 'http://localhost:3000/api/plays';

  constructor(private http: HttpClient) {}

  createPlay(title: string, director_name: string): Observable<Play> {
    return this.http.post<Play>(this.apiUrl, { title, director_name });
  }

  getPlay(id: number | string): Observable<Play> {
    return this.http.get<Play>(`${this.apiUrl}/${id}`);
  }
}
