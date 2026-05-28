import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { GenericTableComponent } from '../../../components/generic-table/generic-table.component';
import { PaginationInfo, TableAction, TableColumn } from '../../../models/components/generic-table/generic-table-types';
import { Entity } from '../../../models/Entity';
import { Official } from '../../../models/Official';
import { EntityService } from '../../../services/entities/entities.service';
import { OfficialService } from '../../../services/officials/official.service';

@Component({
  selector: 'app-officials-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class OfficialsListComponent implements OnInit {
  private readonly officialService = inject(OfficialService);
  private readonly entityService = inject(EntityService);
  private readonly router = inject(Router);

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'role', label: 'Rol' },
    { key: 'phone', label: 'Celular' },
    { key: 'entityName', label: 'Entidad' },
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
    { id: 'create-official', icon: 'add', label: 'Agregar funcionario', isGlobal: true },
    { id: 'edit', icon: 'edit', tooltip: 'Editar funcionario' },
    {
      id: 'deactivate',
      icon: 'custom',
      customIcon: 'solar:user-block-rounded-linear',
      tooltip: 'Desactivar funcionario',
      visible: (row) => row.status === 'active',
    },
    { id: 'delete', icon: 'delete', tooltip: 'Eliminar funcionario' },
  ];

  readonly loading = signal(false);
  readonly officials = signal<Official[]>([]);
  readonly entities = signal<Entity[]>([]);
  readonly searchQuery = signal('');

  readonly pagination = signal<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 6,
    totalItems: 0,
  });

  readonly tableOfficials = computed(() =>
    this.filteredOfficials().map((official) => ({
      ...official,
      entityName: this.getEntityName(official.id_entity),
    })),
  );

  ngOnInit(): void {
    this.loadInitialData();
  }

  onPageChange(page: number): void {
    this.pagination.update((pagination) => ({ ...pagination, currentPage: page }));
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.pagination.update((pagination) => ({ ...pagination, currentPage: 1 }));
  }

  onActionClicked(event: { actionId: string; row: Official | null }): void {
    switch (event.actionId) {
      case 'create-official':
        this.openCreateForm();
        break;
      case 'edit':
        if (event.row) this.openEditForm(event.row);
        break;
      case 'deactivate':
        if (event.row) this.deactivateOfficial(event.row);
        break;
      case 'delete':
        if (event.row) this.deleteOfficial(event.row);
        break;
    }
  }

  private loadInitialData(): void {
    this.loading.set(true);
    this.entityService.getAll().subscribe({
      next: (entities) => {
        this.entities.set(entities);
        this.loadOfficials();
      },
      error: () => {
        this.loading.set(false);
        void Swal.fire('Error', 'No se pudieron cargar las entidades registradas.', 'error');
      },
    });
  }

  private loadOfficials(): void {
    this.loading.set(true);
    this.officialService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (officials) => this.officials.set(officials),
        error: () => void Swal.fire('Error', 'No se pudieron cargar los funcionarios.', 'error'),
      });
  }

  private openCreateForm(): void {
    if (this.entities().length === 0) {
      void Swal.fire('Sin entidades', 'Debes registrar al menos una entidad antes de crear funcionarios.', 'warning');
      return;
    }

    void this.router.navigate(['/administration/officials/create']);
  }

  private openEditForm(official: Official): void {
    void this.router.navigate(['/administration/officials/edit', official.id_official]);
  }

  private deactivateOfficial(official: Official): void {
    void Swal.fire({
      title: 'Desactivar funcionario',
      text: `Quieres desactivar a ${official.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.officialService.update(official.id_official, { status: 'inactive' }).subscribe({
        next: () => {
          this.loadOfficials();
          void Swal.fire('Listo', 'El funcionario fue desactivado.', 'success');
        },
        error: () => void Swal.fire('Error', 'No se pudo desactivar el funcionario.', 'error'),
      });
    });
  }

  private deleteOfficial(official: Official): void {
    void Swal.fire({
      title: 'Eliminar funcionario',
      text: 'Solo se eliminara si no tiene anotaciones ni demarcaciones asociadas. Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.officialService.delete(official.id_official).subscribe({
        next: () => {
          this.loadOfficials();
          void Swal.fire('Eliminado', 'El funcionario fue eliminado correctamente.', 'success');
        },
        error: (error: HttpErrorResponse) => {
          const message =
            error.status === 409
              ? 'No se puede eliminar porque tiene anotaciones o demarcaciones asociadas.'
              : 'No se pudo eliminar el funcionario.';

          void Swal.fire('Operacion cancelada', message, 'error');
        },
      });
    });
  }

  private filteredOfficials(): Official[] {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) return this.officials();

    return this.officials().filter((official) =>
      [
        official.name,
        official.email,
        official.phone,
        official.role,
        this.getEntityName(official.id_entity),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }

  private getEntityName(entityId: number): string {
    const entity = this.entities().find((item) => item.id_entity === entityId);
    return entity?.name ?? 'Sin entidad';
  }
}
