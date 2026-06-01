import { Routes } from '@angular/router';

export const followupRoutes: Routes = [
  {
    path: 'map/followup',
    loadComponent: () =>
      import('./followup.component').then((module) => module.FollowupComponent),
    data: {
      title: 'Seguimiento en tiempo real',
      subtitle: 'Visualiza la ubicacion actual de los funcionarios activos.',
    },
  },
];
