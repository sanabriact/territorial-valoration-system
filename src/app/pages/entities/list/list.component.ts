import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { Entity } from "../../../models/Entity";
import { GenericTableComponent } from "../../../components/generic-table/generic-table.component";
import { PaginationInfo, TableAction, TableColumn } from "../../../models/components/generic-table/generic-table-types";
import { EntityService } from "../../../services/entities/entitiesService";
import { Router } from "@angular/router";

@Component({
    selector: 'app-entities',
    standalone: true,
    imports: [CommonModule, GenericTableComponent],
    templateUrl: './list.component.html',
})
export class EntitiesListComponent implements OnInit {

    private readonly entityService = inject(EntityService);
    private readonly router = inject(Router)

    readonly columns: TableColumn[] = [
        { key: 'logo_url', label: 'Logo', type: 'image', width: '80px' },
        { key: 'name', label: 'Nombre de la entidad' },
        { key: 'nit', label: 'NIT' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Teléfono' },
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
        { id: 'edit', icon: 'edit', tooltip: 'Editar entidad' },
        { id: 'delete', icon: 'delete', tooltip: 'Eliminar entidad' },
    ];

    loading = signal(false);
    entities = signal<Entity[]>([]);

    // Sin totalItems: GenericTable lo calcula de data.length
    pagination = signal<PaginationInfo>({
        currentPage: 1,
        itemsPerPage: 6,
        totalItems: 0,   // <-- GenericTable lo rellena con data.length
    });

    ngOnInit(): void {
        this.loadEntities();
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

    // La paginación es local: solo actualizamos currentPage
    onPageChange(page: number): void {
        this.pagination.update((p) => ({ ...p, currentPage: page }));
        // NO rellamamos al backend
    }

    onSearch(query: string): void {
        // Filtro local si quieres, o dejarlo para después
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    onActionClicked(event: { actionId: string; row: any }): void {
        switch (event.actionId) {
            case 'edit': 
                this.openEditEntity(event.row)
                break;
            case 'delete': 
                this.openDeleteEntity(event.row)
                break;
            case 'create-entity':
                this.openNewEntityPanel()
                break;
        }
    }

    private openEditEntity(entity: any) {
        console.log('Editar:', entity); 
        this.router.navigate([`/administration/entities/edit/${entity.id_entity}`])
    }

    private openDeleteEntity(entity: any) {
        console.log('Eliminar: ', entity)
    }

    private openNewEntityPanel(): void { 
        console.log('Crear nueva entidad'); 
        this.router.navigate([`/administration/entities/create`])
    }
}