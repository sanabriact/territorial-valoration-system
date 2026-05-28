import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { OfficialFormComponent } from '../../../components/official-form/official-form.component';
import { Entity } from '../../../models/Entity';
import { Official, OfficialFormValue, UpdateOfficialRequest } from '../../../models/Official';
import { EntityService } from '../../../services/entities/entities.service';
import { OfficialService } from '../../../services/officials/official.service';

@Component({
  selector: 'app-official-edit',
  standalone: true,
  imports: [OfficialFormComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class OfficialEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly entityService = inject(EntityService);
  private readonly officialService = inject(OfficialService);
  private readonly router = inject(Router);

  readonly officialId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly entities = signal<Entity[]>([]);
  readonly official = signal<Official | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadFormData();
  }

  save(formValue: OfficialFormValue): void {
    const currentOfficial = this.official();

    if (!currentOfficial) {
      void Swal.fire('Error', 'No se encontro el funcionario a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.officialService
      .existsByEmail(formValue.email, currentOfficial.id_official)
      .pipe(
        take(1),
        switchMap((emailExists) => {
          if (emailExists) {
            throw new Error('EMAIL_EXISTS');
          }

          return this.officialService.update(currentOfficial.id_official, this.toUpdateRequest(formValue));
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

  private loadFormData(): void {
    const officialId = this.officialId();

    if (!officialId) {
      void Swal.fire('Error', 'No se encontro el funcionario a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);
    forkJoin({
      entities: this.entityService.getAll(),
      official: this.officialService.getById(officialId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ entities, official }) => {
          this.entities.set(entities);
          this.official.set(official);

          if (entities.length === 0) {
            void Swal.fire('Sin entidades', 'Debes registrar al menos una entidad antes de editar funcionarios.', 'warning');
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

  private toUpdateRequest(value: OfficialFormValue): UpdateOfficialRequest {
    return {
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
