import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { GenericTableComponent } from "../../../components/generic-table/generic-table.component";
import { PaginationInfo, TableAction, TableColumn } from "../../../models/components/generic-table/generic-table-types";
import { Entity } from "../../../models/Entity";
import { Official } from "../../../models/Official";
import { EntityService } from "../../../services/entities/entities.service";
import { OfficialService } from "../../../services/officials/official.service";

@Component({
    selector: 'app-entities',
    standalone: true,
    imports: [CommonModule, GenericTableComponent],
    templateUrl: './list.component.html',
})
export class EntitiesListComponent implements OnInit {

    private readonly entityService = inject(EntityService);
    private readonly officialService = inject(OfficialService);
    private readonly router = inject(Router)

    readonly columns: TableColumn[] = [
        { key: 'logo_url', label: 'Logo', type: 'image', width: '80px' },
        { key: 'name', label: 'Nombre de la entidad' },
        { key: 'nit', label: 'NIT' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telefono' },
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
        { id: 'create-entity', icon: 'add', label: 'Nueva entidad', isGlobal: true },
        { id: 'add-official', icon: 'add', tooltip: 'Agregar funcionario' },
        { id: 'edit', icon: 'edit', tooltip: 'Editar entidad' },
        { id: 'delete', icon: 'delete', tooltip: 'Eliminar entidad' },
    ];

    loading = signal(false);
    entities = signal<Entity[]>([]);
    officials = signal<Official[]>([]);
    searchQuery = signal('');

    readonly tableEntities = computed(() => this.filteredEntities());

    pagination = signal<PaginationInfo>({
        currentPage: 1,
        itemsPerPage: 6,
        totalItems: 0,
    });

    ngOnInit(): void {
        this.loadEntities();
        this.loadOfficials();
    }

    private loadEntities(): void {
        this.loading.set(true);

        this.entityService.getAll().subscribe({
            next: (data) => this.entities.set(data),
            error: (err) => {
                console.error('Error:', err);
                this.loading.set(false);
            },
            complete: () => this.loading.set(false),
        });
    }

    onPageChange(page: number): void {
        this.pagination.update((p) => ({ ...p, currentPage: page }));
    }

    onSearch(query: string): void {
        this.searchQuery.set(query);
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    onActionClicked(event: { actionId: string; row: Entity | null }): void {
        switch (event.actionId) {
            case 'edit':
                if (event.row) this.openEditEntity(event.row)
                break;
            case 'add-official':
                this.addOfficial()
                break;
            case 'delete':
                if (event.row) this.openDeleteEntity(event.row)
                break;
            case 'create-entity':
                this.openNewEntityPanel()
                break;
        }
    }

    private openEditEntity(entity: Entity) {
        this.router.navigate([`/administration/entities/edit/${entity.id_entity}`])
    }

    private openDeleteEntity(entity: Entity) {
        const dependentOfficials = this.officials().filter(
            (official) => Number(official.id_entity) === Number(entity.id_entity),
        );

        if (dependentOfficials.length > 0) {
            const names = dependentOfficials.map((official) => official.name).join(', ');
            void Swal.fire(
                'No se puede eliminar',
                `La entidad tiene funcionarios asociados: ${names}.`,
                'warning',
            );
            return;
        }

        void Swal.fire({
            title: 'Eliminar entidad',
            text: 'Solo se eliminara si no tiene funcionarios ni interesados asociados. Continuar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        }).then((result) => {
            if (!result.isConfirmed) return;

            this.entityService.delete(entity.id_entity).subscribe({
                next: () => {
                    this.loadEntities();
                    void Swal.fire('Eliminada', 'La entidad fue eliminada correctamente.', 'success');
                },
                error: (error: HttpErrorResponse) => {
                    const message =
                        error.status === 409
                            ? 'No se puede eliminar porque tiene funcionarios o interesados asociados.'
                            : 'No se pudo eliminar la entidad.';

                    void Swal.fire('Operacion cancelada', message, 'error');
                },
            });
        });
    }

    private openNewEntityPanel(): void {
        this.router.navigate([`/administration/entities/create`])
    }

    private addOfficial(): void {
        this.router.navigate([`/administration/officials`])
    }

    private loadOfficials(): void {
        this.officialService.getAll().subscribe({
            next: (officials) => this.officials.set(officials),
            error: () => void Swal.fire('Error', 'No se pudieron cargar los funcionarios asociados.', 'error'),
        });
    }

    private filteredEntities(): Entity[] {
        const query = this.searchQuery().trim().toLowerCase();

        if (!query) return this.entities();

        return this.entities().filter((entity) =>
            [
                entity.name,
                entity.nit,
                entity.email,
                entity.phone,
                entity.address ?? entity.adress,
                entity.status,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }
}
