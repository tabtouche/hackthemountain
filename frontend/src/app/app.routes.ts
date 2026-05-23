import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayDashboardComponent } from './play-dashboard/play-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'plays/:id', component: PlayDashboardComponent },
  { path: '**', redirectTo: '' }
];
