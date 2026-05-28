import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { EntitiesFormComponent } from '../components/entities-form/entities-form.component';
import { Entity } from '../../../models/Entity';
import { EntityService } from '../../../services/entities/entities.service';
import { EntityFormValue } from '../../../models/interfaces/form/EntityFormValue';

@Component({
  selector: 'app-entity-create',
  standalone: true,
  imports: [EntitiesFormComponent],
  templateUrl: `./create.component.html`,
  styleUrl:'./create.component.scss'
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

          return this.entityService.create(this.toEntity(formValue));
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

  private toEntity(value: EntityFormValue): Entity {
    return {
      id_entity: 0,
      name: value.name,
      nit: value.nit,
      phone: value.phone,
      email: value.email,
      address: value.address,
      logo_url: value.logo_url,
      status: value.status,
      file: value.file,
    };
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
