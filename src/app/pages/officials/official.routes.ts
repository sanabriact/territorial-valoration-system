import { Routes } from '@angular/router';

export const officialRoutes: Routes = [
  {
    path: 'administration/officials',
    loadComponent: () =>
      import('./list/list.component').then((module) => module.OfficialsListComponent),
    data: {
      title: 'Gestion de funcionarios',
      subtitle: 'Administra los funcionarios vinculados a las entidades',
    },
  },
  {
    path: 'administration/officials/create',
    loadComponent: () =>
      import('./create/create.component').then((module) => module.OfficialCreateComponent),
    data: {
      title: 'Crear funcionario',
      subtitle: 'Registra un funcionario vinculado a una entidad',
    },
  },
  {
    path: 'administration/officials/edit/:id',
    loadComponent: () =>
      import('./edit/edit.component').then((module) => module.OfficialEditComponent),
    data: {
      title: 'Editar funcionario',
      subtitle: 'Actualiza los datos de un funcionario',
    },
  },
];
