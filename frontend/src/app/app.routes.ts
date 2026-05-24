import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayDashboardComponent } from './play-dashboard/play-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'plays/:id', component: PlayDashboardComponent },
  { path: 'plays/:playId/viewer', loadComponent: () => import('./play-viewer/play-viewer.component').then(m => m.PlayViewerComponent) },
  { path: 'plays/:playId/scene/:sceneId/decor', loadComponent: () => import('./background-editor/background-editor.component').then(m => m.BackgroundEditorComponent) },
  { path: 'plays/:playId/scene/:sceneId/webcam', loadComponent: () => import('./scene.component').then(m => m.SceneComponent) },
  { path: 'plays/:playId/scene/:sceneId/music', loadComponent: () => import('./music.component').then(m => m.Music) },
  { path: 'scene', loadComponent: () => import('./scene.component').then(m => m.SceneComponent) },
  { path: 'stage', loadComponent: () => import('./components/stage/stage').then(m => m.Stage) },
  { path: '**', redirectTo: '' }
];