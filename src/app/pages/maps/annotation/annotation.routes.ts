import { Routes } from '@angular/router';
import { roleGuard } from '../../../guards/role.guard';

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
  {
    path: 'map/annotations',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./explorer/annotations.component').then((module) => module.AnnotationsComponent),
    data: {
      title: 'Mapa de anotaciones',
      subtitle: 'Explora y filtra anotaciones ciudadanas por categoria y territorio.',
      roles: ['ADMIN', 'FUNCIONARIO', 'CIUDADANO'],
    },
  },
];
