import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { GenericTableComponent } from '../../../components/generic-table/generic-table.component';
import { PaginationInfo, TableAction, TableColumn } from '../../../models/components/generic-table/generic-table-types';
import { Neighborhood, NeighborhoodListItem } from '../../../models/Neighborhood';
import { CommuneApi, NeighborhoodApi, NeighborhoodDependencyApi } from '../data-access/neighborhood-api';
import { NeighborhoodRules } from '../utils/neighborhood-rules';
import { Commune } from '../../../models/Commune';

@Component({
  selector: 'app-neighborhood-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent],
  templateUrl: './list.component.html',
  providers: [CommuneApi, NeighborhoodApi, NeighborhoodDependencyApi],
})
export class NeighborhoodListComponent implements OnInit {
  private readonly communeApi = inject(CommuneApi);
  private readonly neighborhoodApi = inject(NeighborhoodApi);
  private readonly dependencyApi = inject(NeighborhoodDependencyApi);
  private readonly router = inject(Router);

  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Barrio' },
    { key: 'communeName', label: 'Comuna' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: '120px',
      badgeConfig: {
        activeValue: 'active',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
    },
  ];

  readonly actions: TableAction[] = [
    { id: 'create', icon: 'add', label: 'Nuevo barrio', isGlobal: true },
    { id: 'edit', icon: 'edit', tooltip: 'Editar barrio' },
    { id: 'delete', icon: 'delete', tooltip: 'Eliminar barrio' },
  ];

  readonly pagination = signal<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 6,
    totalItems: 0,
  });

  readonly tableData = computed<NeighborhoodListItem[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const rows = this.neighborhoods().map((neighborhood) =>
      NeighborhoodRules.toListItem(neighborhood, this.communes()),
    );

    if (!query) return rows;

    return rows.filter((row) =>
      [row.name, row.communeName, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  onPageChange(page: number): void {
    this.pagination.update((pagination) => ({ ...pagination, currentPage: page }));
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.pagination.update((pagination) => ({ ...pagination, currentPage: 1 }));
  }

  onActionClicked(event: { actionId: string; row: NeighborhoodListItem | null }): void {
    switch (event.actionId) {
      case 'create':
        this.openCreate();
        break;
      case 'edit':
        if (event.row) this.openEdit(event.row);
        break;
      case 'delete':
        if (event.row) this.confirmDelete(event.row);
        break;
    }
  }

  private loadData(): void {
    this.loading.set(true);

    forkJoin({
      communes: this.communeApi.getAll(),
      neighborhoods: this.neighborhoodApi.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
        },
        error: () => void Swal.fire('Error', 'No se pudieron cargar los barrios.', 'error'),
      });
  }

  private openCreate(): void {
    if (this.communes().length === 0) {
      void Swal.fire('Sin comunas', 'Debes registrar al menos una comuna antes de crear barrios.', 'warning');
      return;
    }

    void this.router.navigate(['/administration/neighborhoods/create']);
  }

  private openEdit(neighborhood: Neighborhood): void {
    void this.router.navigate(['/administration/neighborhoods/edit', neighborhood.id_neighborhood]);
  }

  private confirmDelete(neighborhood: NeighborhoodListItem): void {
    this.loading.set(true);
    this.dependencyApi
      .findByNeighborhood(neighborhood.id_neighborhood)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dependencies) => {
          if (NeighborhoodRules.hasDependencies(dependencies)) {
            void Swal.fire({
              title: 'No se puede eliminar',
              text: `El barrio tiene dependencias asociadas:\n${NeighborhoodRules.dependencyMessage(dependencies)}`,
              icon: 'warning',
            });
            return;
          }

          this.deleteNeighborhood(neighborhood);
        },
        error: () => {
          void Swal.fire(
            'No se pudieron verificar dependencias',
            'Intenta de nuevo antes de eliminar el barrio.',
            'error',
          );
        },
      });
  }

  private deleteNeighborhood(neighborhood: NeighborhoodListItem): void {
    void Swal.fire({
      title: 'Eliminar barrio',
      text: `Quieres eliminar ${neighborhood.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.neighborhoodApi.delete(neighborhood.id_neighborhood).subscribe({
        next: () => {
          this.loadData();
          void Swal.fire('Eliminado', 'El barrio fue eliminado correctamente.', 'success');
        },
        error: (error: HttpErrorResponse) => {
          const message =
            error.status === 409
              ? 'El barrio tiene puntos o anotaciones asociadas.'
              : 'No se pudo eliminar el barrio.';
          void Swal.fire('Operacion cancelada', message, 'error');
        },
      });
    });
  }
}
