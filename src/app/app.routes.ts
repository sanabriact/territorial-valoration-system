import { Routes } from '@angular/router';
import { authGuard } from './guards/app.guard';
import { AppSideLoginComponent } from './pages/authentication/side-login/side-login.component';

export const routes: Routes = [
  {
    path: 'authentication/login',
    component: AppSideLoginComponent,
  },
  {
    path: '**',
    redirectTo: 'authentication/login',
  },
];