import { Routes } from '@angular/router';

export const annotationsRoutes: Routes = [
  {
    path: 'map/annotations',
    loadComponent: () =>
      import('./annotations.component').then((module) => module.AnnotationsComponent),
    data: {
      title: 'Mapa de anotaciones',
      subtitle: 'Explora y consulta las anotaciones ciudadanas en el territorio.',
    },
  },
];
