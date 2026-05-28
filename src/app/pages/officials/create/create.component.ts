import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { OfficialFormComponent } from '../components/official-form/official-form.component';
import { Entity } from '../../../models/Entity';
import { Official} from '../../../models/Official';
import { EntityService } from '../../../services/entities/entities.service';
import { OfficialService } from '../../../services/officials/official.service';
import { OfficialFormValue } from '../../../models/interfaces/form/OfficialFormValue';

@Component({
    selector: 'app-official-create',
    standalone: true,
    imports: [OfficialFormComponent],
    templateUrl: './create.component.html',
    styleUrl: './create.component.scss'
})
export class OfficialCreateComponent implements OnInit {
    private readonly entityService = inject(EntityService);
    private readonly officialService = inject(OfficialService);
    private readonly router = inject(Router);

    readonly entities = signal<Entity[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);

    ngOnInit(): void {
        this.loadEntities();
    }

    save(formValue: OfficialFormValue): void {
        this.saving.set(true);
        this.officialService
            .existsByEmail(formValue.email)
            .pipe(
                take(1),
                switchMap((emailExists) => {
                    if (emailExists) {
                        throw new Error('EMAIL_EXISTS');
                    }

                    return this.officialService.create(this.toOfficial(formValue));
                }),
                finalize(() => this.saving.set(false)),
            )
            .subscribe({
                next: () => {
                    void Swal.fire('Listo', 'El funcionario fue guardado correctamente.', 'success');
                    this.cancel();
                },
                error: (error) => this.handleSaveError(error),
            });
    }

    cancel(): void {
        void this.router.navigate(['/administration/officials']);
    }

    private loadEntities(): void {
        this.loading.set(true);
        this.entityService
            .getAll()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (entities) => {
                    this.entities.set(entities);

                    if (entities.length === 0) {
                        void Swal.fire('Sin entidades', 'Debes registrar al menos una entidad antes de crear funcionarios.', 'warning');
                        this.cancel();
                    }
                },
                error: () => {
                    void Swal.fire('Error', 'No se pudo cargar la informacion del formulario.', 'error');
                    this.cancel();
                },
            });
    }

    private handleSaveError(error: unknown): void {
        if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
            void Swal.fire('Correo duplicado', 'El correo ya existe. El sistema cancelo la operacion.', 'warning');
            return;
        }

        void Swal.fire('Error', 'No se pudo guardar el funcionario.', 'error');
    }

    private toOfficial(value: OfficialFormValue): Official {
        return {
            id_official: 0,
            id_entity: Number(value.id_entity),
            name: value.name.trim(),
            email: value.email.trim().toLowerCase(),
            phone: value.phone.trim(),
            role: value.role,
            status: value.status,
            last_latitude: null,
            last_longitude: null,
            last_gps_update: null,
            gps_active: false,
        };
    }
}
