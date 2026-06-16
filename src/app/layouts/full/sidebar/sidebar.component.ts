import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../../material.module';
import { AppUser } from '../../../models/security/AppUser';
import { SidebarSection } from '../../../models/interfaces/sidebar/SidebarSection';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent implements OnChanges {
  @Input() user: AppUser | null = null;
  sections: SidebarSection[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.loadMenu();
    }
  }

  private loadMenu(): void {
    switch (this.user?.role) {
      case 'ADMIN':
        this.sections = this.getAdminMenu();
        break;

      case 'FUNCIONARIO':
        this.sections = this.getFuncionarioMenu();
        break;

      case 'CIUDADANO':
        this.sections = this.getCiudadanoMenu();
        break;

      default:
        this.sections = [];
        break;
    }
  }

  private getAdminMenu(): SidebarSection[] {
    return [
      {
        items: [
          {
            label: 'Inicio',
            icon: 'solar:home-2-linear',
            route: '/home',
          },
          {
            label: 'Mapa',
            icon: 'solar:map-linear',
            children: [
              {
                label: 'Seguimiento',
                route: '/map/followup',
              },
              {
                label: 'Demarcaciones',
                route: '/map/demarcation',
              },
              {
                label: 'Anotaciones',
                route: '/map/annotations',
              },
            ],
          },
          {
            label: 'Reportes',
            icon: 'solar:document-text-linear',
            route: '/reports',
          },
        ],
      },
      {
        title: 'Administracion',
        items: [
          {
            label: 'Entidades',
            icon: 'solar:buildings-linear',
            route: '/administration/entities',
          },
          {
            label: 'Funcionarios',
            icon: 'solar:users-group-rounded-linear',
            route: '/administration/officials',
          },
          {
            label: 'Ciudadanos',
            icon: 'solar:user-linear',
            route: '/administration/citizens',
          },
          {
            label: 'Categorias',
            icon: 'solar:tag-linear',
            route: '/administration/categories',
          },
          {
            label: 'Comunas',
            icon: 'solar:streets-map-point-linear',
            route: '/administration/communes',
          },
          {
            label: 'Barrios',
            icon: 'solar:city-linear',
            route: '/administration/neighborhoods',
          },
        ],
      },
    ];
  }

  private getFuncionarioMenu(): SidebarSection[] {
    return [
      {
        items: [
          {
            label: 'Inicio',
            icon: 'solar:home-2-linear',
            route: '/home',
          },
          {
            label: 'Mapa',
            icon: 'solar:map-linear',
            children: [
              {
                label: 'Seguimiento',
                route: '/map/followup',
              },
              {
                label: 'Demarcaciones',
                route: '/map/demarcation',
              },
              {
                label: 'Anotaciones',
                route: '/map/annotation',
              },
            ],
          },
          {
            label: 'Reportes',
            icon: 'solar:document-text-linear',
            route: '/reports',
          },
        ],
      },
    ];
  }

  private getCiudadanoMenu(): SidebarSection[] {
    return [
      {
        items: [
          {
            label: 'Inicio',
            icon: 'solar:home-2-linear',
            route: '/home',
          },
          {
            label: 'Mapa',
            icon: 'solar:map-linear',
            route: '/map/annotations',
          },
          {
            label: 'Reportes',
            icon: 'solar:document-text-linear',
            route: '/reports',
          },
        ],
      },
    ];
  }
}
