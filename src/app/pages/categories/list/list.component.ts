import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { catchError, concatMap, from, map, of, switchMap, timer } from "rxjs";
import Swal from "sweetalert2";
import { GenericTableComponent } from "../../../components/generic-table/generic-table.component";
import { PaginationInfo, TableAction, TableColumn } from "../../../models/components/generic-table/generic-table-types";
import { Category } from "../../../models/Category";
import { CategoryService } from "../../../services/categories/categoryService";

@Component({
    selector: 'app-citizen-list',
    standalone: true,
    imports: [CommonModule, GenericTableComponent],
    templateUrl: './list.component.html',
})
export class CategoryListComponent implements OnInit {
    private readonly categoryService = inject(CategoryService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router)

    readonly columns: TableColumn[] = [
        { key: 'category', label: 'Categoría/Subcategoría' },
        { key: '', label: 'Tipo' },
        { key: '', label: 'Categoría padre' },
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
        { id: 'create-citizen', icon: 'add', label: 'Nueva categoría', isGlobal: true },
        { id: 'edit', icon: 'edit', tooltip: 'Editar categoría' },
        { id: 'delete', icon: 'delete', tooltip: 'Eliminar categoría' },
    ];

    loading = signal(false);
    categories = signal<Category[]>([]);
    searchQuery = signal('');

    readonly tableCategories = computed(() => this.filteredCategories());
    

    pagination = signal<PaginationInfo>({
        currentPage: 1,
        itemsPerPage: 6,
        totalItems: 0,
    });

    ngOnInit(): void {
        this.loadCategories();
    }

    private loadCategories(): void {
        this.loading.set(true);

        this.categoryService.getAll().subscribe({
            next: (data) => this.categories.set(data),
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

    onActionClicked(event: { actionId: string; row: Category | null }): void {
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

    private openEditCitizen(citizen: CitizenTableRow) {
        this.router.navigate([`/administration/citizens/edit/${citizen.id_citizen}`])
    }

    private openDeleteCitizen(citizen: CitizenTableRow) {
        void Swal.fire({
            title: 'Eliminar ciudadano',
            text: 'Se eliminara al ciudadano. Continuar?',
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

    private filteredCitizens(): CitizenTableRow[] {
        const query = this.searchQuery().trim().toLowerCase();

        if (!query) return this.citizens();

        return this.citizens().filter((citizen) =>
            [
                citizen.name,
                citizen.email,
                citizen.phone,
                citizen.address,
                citizen.direction,
                citizen.status,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }

    private resolveCitizenDirections(citizens: Citizen[]): void {
        from(citizens)
            .pipe(
                concatMap((citizen, index) =>
                    timer(index === 0 ? 0 : 1100).pipe(
                        switchMap(() => this.openMapsService.reverseGeocode(citizen)),
                        catchError(() => of(this.getFallbackDirection(citizen))),
                        map((direction) => ({ citizenId: citizen.id_citizen, direction })),
                    ),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(({ citizenId, direction }) => {
                this.citizens.update((rows) =>
                    rows.map((row) =>
                        row.id_citizen === citizenId
                            ? { ...row, direction }
                            : row,
                    ),
                );
            });
    }

    private toTableRow(citizen: Citizen): CitizenTableRow {
        return {
            ...citizen,
            direction: this.getFallbackDirection(citizen),
        };
    }

    private getFallbackDirection(citizen: Citizen): string {
        return citizen.address?.trim() || this.openMapsService.formatCoordinates(citizen);
    }
}
