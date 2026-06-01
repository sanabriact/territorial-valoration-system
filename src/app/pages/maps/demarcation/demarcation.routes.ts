import { Routes } from '@angular/router';

export const demarcationRoutes: Routes = [
  {
    path: 'map/demarcation',
    loadComponent: () =>
      import('./demarcation.component').then((module) => module.DemarcationComponent),
    data: {
      title: 'Demarcar puntos de un barrio',
      subtitle: 'Seleccione un barrio y delimite su polígono haciendo clic en el mapa.',
    },
  },
];