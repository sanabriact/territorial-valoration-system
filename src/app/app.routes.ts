import { Routes } from '@angular/router';
import { authGuard } from './guards/app.guard';
import { BlankComponent } from './layouts/blank/blank.component';
import { AppSideLoginComponent } from './pages/authentication/side-login/side-login.component';
import { LayoutComponent } from './layouts/full/layout.component';
import { HomeComponent } from './pages/home/home.component';

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
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },

      {
        path: 'home',
        component: HomeComponent
      }

    ]
  },
  {
    path: '**',
    component: BlankComponent
  }
];