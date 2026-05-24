import { Injectable } from '@angular/core';
import { Observable, interval, map } from 'rxjs';

export interface Entity {
  animal: 'rabbit' | 'wolf' | string;
  x: number;
  y: number;
  orientation: number;
  angleMouth: number;
  facing: 'left' | 'right' | string;
}

export const MOCK_STREAM: Entity[][] = [
  [
    {
      animal: 'rabbit',
      x: 30,
      y: 50,
      orientation: 0,
      angleMouth: 0,
      facing: 'left'
    },
  ],
  [
    {
      animal: 'rabbit',
      x: 32,
      y: 52,
      orientation: 0.1,
      angleMouth: 0.2,
      facing: 'left'
    },
    {
      animal: 'wolf',
      x: 68,
      y: 48,
      orientation: 3.0,
      angleMouth: 0.1,
      facing: 'right'
    }
  ]
];

@Injectable({
  providedIn: 'root'
})
export class EntityStreamService {
    stream(): Observable<Entity[]> {
        return interval(200).pipe(
            map(i => MOCK_STREAM[i % MOCK_STREAM.length])
        );
    }
}