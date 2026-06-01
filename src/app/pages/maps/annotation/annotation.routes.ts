import { Routes } from '@angular/router';

export const annotationRoutes: Routes = [
  {
    path: 'map/annotation',
    loadComponent: () =>
      import('./annotation.component').then((module) => module.AnnotationComponent),
    data: {
      title: 'Crear anotacion',
      subtitle: 'Haz clic en el mapa para agregar una anotacion en el territorio.',
    },
  },
];
