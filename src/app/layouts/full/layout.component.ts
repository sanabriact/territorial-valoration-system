import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../material.module';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

import { User } from '../../models/User';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  pageTitle = 'Inicio';
  pageSubtitle =
    'Bienvenido al sistema de valoración territorial.';
    
  user: User = {
    id: 1,
    name: 'Juan Felipe',
    email: 'juan@gmail.com',
    phone: 123456789,
    status: true,
    role: 'ADMIN'
  };
}