import { Routes } from '@angular/router';
import { authGuard } from './guards/app.guard';
import { LayoutComponent } from './layouts/full/layout.component';
import { pagesRoutes } from './pages/pages.routes';

export const routes: Routes = [
  {
    path: 'authentication/login',
    loadComponent: () =>
      import('./pages/authentication/side-login/side-login.component').then(
        (module) => module.AppSideLoginComponent,
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: pagesRoutes,
  },
  {
    path: '**',
    loadComponent: () =>
      import('./layouts/blank/blank.component').then((module) => module.BlankComponent),
  },
];
