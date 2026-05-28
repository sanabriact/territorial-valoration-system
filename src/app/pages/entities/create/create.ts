import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { EntitiesFormComponent } from '../../../components/entities-form/entities-form.component';
import { Entity, EntityFormValue } from '../../../models/Entity';
import { EntityService } from '../../../services/entities/entities.service';

@Component({
  selector: 'app-entity-create',
  standalone: true,
  imports: [EntitiesFormComponent],
  templateUrl: `./create.html`,
})
export class EntityCreateComponent {
  private readonly entityService = inject(EntityService);
  private readonly router = inject(Router);

  readonly saving = signal(false);

  save(formValue: EntityFormValue): void {
    this.saving.set(true);
    this.entityService
      .getAll()
      .pipe(
        take(1),
        map((entities) => this.hasDuplicatedName(entities, formValue.name)),
        switchMap((nameExists) => {
          if (nameExists) {
            throw new Error('ENTITY_NAME_EXISTS');
          }

          return this.entityService.create(this.toFormData(formValue) as unknown as Omit<Entity, 'id_entity'>);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La entidad fue guardada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/entities']);
  }

  private hasDuplicatedName(entities: Entity[], name: string): boolean {
    const normalizedName = this.normalizeText(name);
    return entities.some((entity) => this.normalizeText(entity.name) === normalizedName);
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'ENTITY_NAME_EXISTS') {
      void Swal.fire('Entidad duplicada', 'Ya existe una entidad con ese nombre. El sistema cancelo la operacion.', 'warning');
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar la entidad.', 'error');
  }

  private toFormData(value: EntityFormValue): FormData {
    const formData = new FormData();

    formData.append('name', value.name.trim());
    formData.append('description', value.description.trim());
    formData.append('type', value.type);
    formData.append('nit', value.nit.trim());
    formData.append('phone', value.phone.trim());
    formData.append('email', value.email.trim().toLowerCase());
    formData.append('address', value.address.trim());
    formData.append('logo_url', value.logo_url.trim());
    formData.append('status', value.status);

    if (value.file) {
      formData.append('file', value.file);
    }

    return formData;
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
