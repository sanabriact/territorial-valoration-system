import { Routes } from '@angular/router';

export const entitiesRoutes: Routes = [
    {
        path: 'administration/entities',
        loadComponent: () =>
            import('./list/list.component').then((module) => module.EntitiesListComponent),
        data: {
            title: 'Gestion de entidades',
            subtitle: 'Administra las entidades que participan en el sistema',
        },
    },
    {
        path: 'administration/entities/create',
        loadComponent: () =>
            import('./create/create').then((module) => module.EntityCreateComponent),
        data: {
            title: 'Crear entidad',
            subtitle: 'Registra una nueva entidad en el sistema',
        },
    },
    {
        path: 'administration/entities/edit/:id',
        loadComponent: () =>
            import('./edit/edit.component').then((module) => module.EntityEditComponent),
        data: {
            title: 'Editar entidad',
            subtitle: 'Actualiza los datos de una entidad',
        },
    },
];
