import { Routes } from '@angular/router';

export const citizensRoutes: Routes = [
    {
        path: 'administration/citizens',
        loadComponent: () =>
            import('./list/list.component').then((module) => module.CitizenListComponent),
        data: {
            title: 'Gestion de ciudadanos',
            subtitle: 'Administra la informacion de los ciudadanos registrados en el sistema.',
        },
    },
    {
        path: 'administration/citizens/create',
        loadComponent: () =>
            import('./create/create.component').then((module) => module.CitizenCreateComponent),
        data: {
            title: 'Nuevo ciudadano',
            subtitle: 'Completa la informacion del ciudadano. La ubicacion se selecciona en el mapa.',
        },
    },
    {
        path: 'administration/citizens/edit/:id',
        loadComponent: () =>
            import('./edit/edit.component').then((module) => module.CitizenEditComponent),
        data: {
            title: 'Editar ciudadano',
            subtitle: 'Actualiza los datos de un ciudadano.',
        },
    },
];
