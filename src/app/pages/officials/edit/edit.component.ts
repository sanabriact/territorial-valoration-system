import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { OfficialFormComponent } from '../components/official-form/official-form.component';
import { Entity } from '../../../models/Entity';
import { Official} from '../../../models/Official';
import { EntityService } from '../../../services/entities/entities.service';
import { OfficialService } from '../../../services/officials/official.service';
import { OfficialFormValue } from '../../../models/interfaces/form/OfficialFormValue';

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

          return this.officialService.update(currentOfficial.id_official, this.toOfficial(formValue, currentOfficial.id_official));
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

    void Swal.fire('Error', this.getBackendErrorMessage(error), 'error');
  }

  private getBackendErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo guardar el funcionario.';
    }

    const backendMessage = error.error?.message ?? error.error?.error;

    if (Array.isArray(backendMessage)) {
      return backendMessage.join('\n');
    }

    return backendMessage || `No se pudo guardar el funcionario. Codigo HTTP: ${error.status}`;
  }

  private toOfficial(value: OfficialFormValue, officialId: number): Official {
    return {
      id_official: officialId,
      id_entity: Number(value.id_entity),
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      role: value.role,
      status: value.status,
      last_latitude: value.last_latitude,
      last_longitude: value.last_longitude,
      last_gps_update: null,
      gps_active: value.gps_active,
    };
  }
}
