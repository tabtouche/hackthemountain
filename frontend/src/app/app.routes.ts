import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'scene', loadComponent: () => import('./scene.component').then(m => m.SceneComponent) },
  { path: 'stage', loadComponent: () => import('./components/stage/stage').then(m => m.Stage) }
]