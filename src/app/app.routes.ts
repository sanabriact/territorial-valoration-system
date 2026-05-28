import { Routes } from '@angular/router';
import { authGuard } from './guards/app.guard';
import { BlankComponent } from './layouts/blank/blank.component';
import { AppSideLoginComponent } from './pages/authentication/side-login/side-login.component';
import { LayoutComponent } from './layouts/full/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { EntitiesListComponent } from './pages/entities/list/list.component';

export const routes: Routes = [
  {
    path: 'authentication/login',
    component: AppSideLoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
        data: { title: 'Inicio', subtitle: 'Bienvenido al sistema' }
      },
      {
        path: 'administration/entities',
        component: EntitiesListComponent,
        data: { title: 'Gestión de entidades', subtitle: 'Administra las entidades que participan en el sistema' }
      }
    ]
  },
  {
    path: '**',
    component: BlankComponent
  }
];