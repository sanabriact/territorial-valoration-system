import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { GenericTableComponent } from '../../../components/generic-table/generic-table.component';
import {
  FilterGroup,
  PaginationInfo,
  TableAction,
  TableColumn,
} from '../../../models/components/generic-table/generic-table-types';
import { Commune } from '../../../models/Commune';
import { City } from '../../../models/City';
import { CommuneService, CommuneWithCount } from '../../../services/communes/commune.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';
import { CityService } from '../../../services/cities/city.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-commune-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent],
  templateUrl: './list.component.html',
})
export class CommuneListComponent implements OnInit {

  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly cityService = inject(CityService);
  private readonly router = inject(Router);

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Comuna' },
    { key: 'cityName', label: 'Ciudad' },   // ← clave virtual, no id_city
    { key: 'neighborhoodCount', label: 'Barrios asociados', width: '160px' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '120px',
      badgeConfig: {
        activeValue: 'active',
        activeLabel: 'Activa',
        inactiveLabel: 'Inactiva',
      },
    },
  ];

  readonly actions: TableAction[] = [
    { id: 'create-commune', icon: 'add', label: 'Nueva comuna', isGlobal: true },
    { id: 'edit', icon: 'edit', tooltip: 'Editar comuna' },
    { id: 'delete', icon: 'delete', tooltip: 'Eliminar comuna' },
  ];

  loading = signal(false);
  communes = signal<CommuneWithCount[]>([]);
  cities = signal<City[]>([]);
  searchQuery = signal('');
  activeFilters = signal<Record<string, string | number | boolean>>({});
  filterGroups = signal<FilterGroup[]>([]);

  pagination = signal<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  // Comunas enriquecidas con cityName para la tabla
  private enrichedCommunes = computed(() => {
    const cityMap = new Map(this.cities().map((c) => [c.id_city, c.name]));
    return this.communes().map((commune) => ({
      ...commune,
      cityName: cityMap.get(commune.id_city) ?? String(commune.id_city),
    }));
  });

  readonly tableCommunes = computed(() => this.filteredCommunes());

  ngOnInit(): void {
    this.loadCommunes();
  }

  private loadCommunes(): void {
    this.loading.set(true);

    forkJoin({
      communes: this.communeService.getAllWithNeighborhoodCount(),
      cities: this.cityService.getAll(),
    }).subscribe({
      next: ({ communes, cities }) => {
        this.cities.set(cities);
        this.communes.set(communes);
        this.pagination.update((p) => ({ ...p, totalItems: communes.length }));
        this.buildFilterGroups(cities);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
      },
    });
  }

  private buildFilterGroups(cities: City[]): void {
    // Filtro por ciudades que realmente tienen comunas
    const usedCityIds = new Set(this.communes().map((c) => c.id_city));
    const relevantCities = cities
      .filter((c) => usedCityIds.has(c.id_city))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.filterGroups.set([
      {
        type: 'select',
        key: 'id_city',
        label: 'Ciudad',
        placeholder: 'Todas las ciudades',
        options: relevantCities.map((c) => ({ label: c.name, value: String(c.id_city) })),
      },
    ]);
  }

  onPageChange(page: number): void {
    this.pagination.update((p) => ({ ...p, currentPage: page }));
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.pagination.update((p) => ({ ...p, currentPage: 1 }));
  }

  onFiltersApplied(filters: Record<string, string | number | boolean>): void {
    this.activeFilters.set(filters);
    this.pagination.update((p) => ({ ...p, currentPage: 1 }));
  }

  onActionClicked(event: { actionId: string; row: CommuneWithCount | null }): void {
    switch (event.actionId) {
      case 'create-commune':
        this.router.navigate(['/administration/communes/create']);
        break;
      case 'edit':
        if (event.row) this.router.navigate([`/administration/communes/edit/${event.row.id_commune}`]);
        break;
      case 'delete':
        if (event.row) this.openDeleteCommune(event.row);
        break;
    }
  }

  private filteredCommunes(): (CommuneWithCount & { cityName: string })[] {
    const query = this.searchQuery().trim().toLowerCase();
    const filters = this.activeFilters();

    return this.enrichedCommunes().filter((commune) => {
      const matchesQuery =
        !query ||
        [commune.name, commune.cityName, commune.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query));

      const matchesCity =
        !filters['id_city'] || String(commune.id_city) === String(filters['id_city']);

      return matchesQuery && matchesCity;
    });
  }

  // El resto de métodos (openDeleteCommune, etc.) se mantienen igual
  private openDeleteCommune(commune: CommuneWithCount): void {
    if (commune.neighborhoodCount > 0) {
      this.neighborhoodService.getAll().subscribe({
        next: (neighborhoods) => {
          const dependents = neighborhoods
            .filter((n) => n.id_commune === commune.id_commune)
            .map((n) => n.name);

          const list = dependents.map((n) => `<li>${n}</li>`).join('');

          void Swal.fire({
            title: 'No se puede eliminar',
            html: `La comuna <strong>${commune.name}</strong> tiene ${commune.neighborhoodCount} barrio(s) asociado(s). Reasígnalos antes de eliminarla.<br><br><ul style="text-align:left;margin-top:8px">${list}</ul>`,
            icon: 'warning',
          });
        },
        error: () => {
          void Swal.fire(
            'No se puede eliminar',
            `La comuna tiene ${commune.neighborhoodCount} barrio(s) asociado(s). Reasígnalos antes de eliminarla.`,
            'warning',
          );
        },
      });
      return;
    }

    void Swal.fire({
      title: 'Eliminar comuna',
      text: `¿Deseas eliminar la comuna "${commune.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.communeService.delete(commune.id_commune).subscribe({
        next: () => {
          this.loadCommunes();
          void Swal.fire('Eliminada', 'La comuna fue eliminada correctamente.', 'success');
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            void Swal.fire(
              'No se puede eliminar',
              'La comuna tiene barrios asociados. Reasígnalos antes de eliminarla.',
              'warning',
            );
          } else {
            void Swal.fire('Operación cancelada', 'No se pudo eliminar la comuna.', 'error');
          }
        },
      });
    });
  }
}