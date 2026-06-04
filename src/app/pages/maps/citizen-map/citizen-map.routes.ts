import { Routes } from '@angular/router';
import { roleGuard } from '../../../guards/role.guard';

export const citizenMapRoutes: Routes = [
  {
    path: 'map',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./citizen-map.component').then((module) => module.CitizenMapComponent),
    data: {
      title: 'Mapa de anotaciones',
      subtitle: 'Explora y califica las anotaciones ciudadanas del territorio.',
      roles: ['CIUDADANO'],
    },
  },
];
