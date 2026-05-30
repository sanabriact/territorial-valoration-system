import { Routes } from '@angular/router';

export const neighborhoodsRoutes: Routes = [
  {
    path: 'administration/neighborhoods',
    loadComponent: () =>
      import('./list/list.component').then((module) => module.NeighborhoodListComponent),
    data: {
      title: 'Gestion de barrios',
      subtitle: 'Administra barrios asociados a comunas',
    },
  },
  {
    path: 'administration/neighborhoods/create',
    loadComponent: () =>
      import('./create/create.component').then((module) => module.NeighborhoodCreateComponent),
    data: {
      title: 'Crear barrio',
      subtitle: 'Registra un barrio asociado a una comuna',
    },
  },
  {
    path: 'administration/neighborhoods/edit/:id',
    loadComponent: () =>
      import('./edit/edit.component').then((module) => module.NeighborhoodEditComponent),
    data: {
      title: 'Editar barrio',
      subtitle: 'Actualiza los datos de un barrio',
    },
  },
];
