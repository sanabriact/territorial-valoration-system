import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  {
    path: 'administration/categories',
    loadComponent: () =>
      import('./list/list.component').then((module) => module.CategoryListComponent),
    data: {
      title: 'Gestion de categorias',
      subtitle: 'Administra categorias y subcategorias del sistema',
    },
  },
  {
    path: 'administration/categories/create',
    loadComponent: () =>
      import('./create/create').then((module) => module.CategoryCreateComponent),
    data: {
      title: 'Crear categoria',
      subtitle: 'Registra una nueva categoria en el sistema',
    },
  },
  {
    path: 'administration/categories/edit/:id',
    loadComponent: () =>
      import('./edit/edit').then((module) => module.CategoryEditComponent),
    data: {
      title: 'Editar categoria',
      subtitle: 'Actualiza los datos de una categoria',
    },
  },
];
