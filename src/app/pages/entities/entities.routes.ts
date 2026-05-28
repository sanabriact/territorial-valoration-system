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
];
