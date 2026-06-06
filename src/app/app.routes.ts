import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then((module) => module.AuthComponent)
  },
  {
    path: 'lobby',
    canActivate: [authGuard],
    loadComponent: () => import('./features/lobby/lobby.component').then((module) => module.LobbyComponent)
  },
  {
    path: 'arena',
    canActivate: [authGuard],
    loadComponent: () => import('./features/arena/arena.component').then((module) => module.ArenaComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'lobby' },
  { path: '**', redirectTo: 'lobby' }
];
