import { Routes } from '@angular/router';
import { entitiesRoutes } from './entities/entities.routes';
import { officialRoutes } from './officials/official.routes';
import { citizensRoutes } from './citizens/citizens.routes';
import { categoriesRoutes } from './categories/categories.routes';
import { neighborhoodsRoutes } from './neighborhoods/neighborhoods.routes';

export const pagesRoutes: Routes = [
    {
        path: 'home',
        loadComponent: () =>
            import('./home/home.component').then((module) => module.HomeComponent),
        data: { title: 'Inicio', subtitle: 'Bienvenido al sistema' },
    },
    ...entitiesRoutes,
    ...officialRoutes,
    ...citizensRoutes,
    ...categoriesRoutes,
    ...neighborhoodsRoutes
];
