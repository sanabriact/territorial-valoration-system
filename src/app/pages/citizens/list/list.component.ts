import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { GenericTableComponent } from "../../../components/generic-table/generic-table.component";
import { PaginationInfo, TableAction, TableColumn } from "../../../models/components/generic-table/generic-table-types";
import { Citizen } from "../../../models/Citizen";
import { CitizenService } from "../../../services/citizens/citizen.service";

@Component({
    selector: 'app-entities',
    standalone: true,
    imports: [CommonModule, GenericTableComponent],
    templateUrl: './list.component.html',
})
export class CitizenListComponent implements OnInit {

    private readonly citizenService = inject(CitizenService);
    private readonly router = inject(Router)

    readonly columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Correo electrónico' },
        { key: 'phone', label: 'Celular' },
        { key: 'direction', label: 'Dirección'},
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
        { id: 'create-citizen', icon: 'add', label: 'Nuevo ciudadano', isGlobal: true },
        { id: 'view-citizen', icon: 'view', tooltip: 'Ver ciudadano' },
        { id: 'edit', icon: 'edit', tooltip: 'Editar entidad' },
        { id: 'delete', icon: 'delete', tooltip: 'Eliminar entidad' },
    ];

    loading = signal(false);
    citizens = signal<Citizen[]>([]);
    searchQuery = signal('');

    readonly tableCitizens = computed(() => this.filteredCitizens());

    pagination = signal<PaginationInfo>({
        currentPage: 1,
        itemsPerPage: 6,
        totalItems: 0,
    });

    ngOnInit(): void {
        this.loadCitizens();
    }

    private loadCitizens(): void {
        this.loading.set(true);

        this.citizenService.getAll().subscribe({
            next: (data) => this.citizens.set(data),
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

    onActionClicked(event: { actionId: string; row: Citizen | null }): void {
        switch (event.actionId) {
            case 'create-citizen':
                this.openNewCitizenPanel()
                break;
            case 'edit':
                if (event.row) this.openEditCitizen(event.row)
                break;
            case 'delete':
                if (event.row) this.openDeleteCitizen(event.row)
                break;
        }
    }

    private openEditCitizen(citizen: Citizen) {
        this.router.navigate([`/administration/citizens/edit/${citizen.id_citizen}`])
    }

    private openDeleteCitizen(citizen: Citizen) {
        void Swal.fire({
            title: 'Eliminar ciudadano',
            text: 'Se eliminará al ciudadano. ¿Continuar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        }).then((result) => {
            if (!result.isConfirmed) return;

            this.citizenService.delete(citizen.id_citizen).subscribe({
                next: () => {
                    this.loadCitizens();
                    void Swal.fire('Eliminado', 'El ciudadano fue eliminado correctamente.', 'success');
                },
                error: (error: HttpErrorResponse) => {
                    const message = 'No se pudo eliminar al ciudadano.';

                    void Swal.fire('Operacion cancelada', message, 'error');
                },
            });
        });
    }

    private openNewCitizenPanel(): void {
        this.router.navigate([`/administration/citizens/create`])
    }

    private filteredCitizens(): Citizen[] {
        const query = this.searchQuery().trim().toLowerCase();

        if (!query) return this.citizens();

        return this.citizens().filter((citizen) =>
            [
                citizen.name,
                citizen.email,
                citizen.phone,
                citizen.address,
                citizen.status,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }
}
