import { Routes } from '@angular/router';

export const communesRoutes: Routes = [
  {
    path: 'administration/communes',
    loadComponent: () =>
      import('./list/list.component').then((module) => module.CommuneListComponent),
    data: {
      title: 'Gestión de comunas',
      subtitle: 'Administra las comunas del municipio seleccionado.',
    },
  },
  {
    path: 'administration/communes/create',
    loadComponent: () =>
      import('./create/create.component').then((module) => module.CommuneCreateComponent),
    data: {
      title: 'Crear comuna',
      subtitle: 'Registra una nueva comuna en el sistema',
    },
  },
  {
    path: 'administration/communes/edit/:id',
    loadComponent: () =>
      import('./edit/edit.component').then((module) => module.CommuneEditComponent),
    data: {
      title: 'Editar comuna',
      subtitle: 'Actualiza los datos de una comuna',
    },
  },
];
