import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MaterialModule } from '../../material.module';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

import { User } from '../../models/User';
import { filter } from 'rxjs';

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

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  title = signal<string>('');
  subtitle = signal<string>('');

  constructor() {
    // 3. Escuchamos activamente cuando la navegación termine con éxito (NavigationEnd)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed() // Angular 16+ se encarga de desuscribirse al destruir el componente
    ).subscribe(() => {
      this.updateHeaderData();
    });
  }

  ngOnInit(): void {
    // Ejecutamos una vez al cargar el componente por primera vez
    this.updateHeaderData();
  }

  private updateHeaderData(): void {
    let currentRoute = this.activatedRoute;

    // 4. Truco clave: Viajamos a través del árbol de rutas hasta llegar a la ruta hija más profunda (la activa)
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    // 5. Extraemos la 'data' que configuramos en app.routes.ts
    const routeData = currentRoute.snapshot.data;

    // 6. Actualizamos las señales. Si no tienen data, ponemos un valor por defecto.
    this.title.set(routeData['title'] || 'Sistema');
    this.subtitle.set(routeData['subtitle'] || '');
  }

  user: User = {
    id: 1,
    name: 'Juan Felipe',
    email: 'juan@gmail.com',
    phone: 123456789,
    status: true,
    role: 'FUNCIONARIO'
  };
}