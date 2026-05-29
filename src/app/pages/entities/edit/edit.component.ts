import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { EntitiesFormComponent } from '../entities-form/entities-form.component';
import { Entity} from '../../../models/Entity';
import { EntityService } from '../../../services/entities/entities.service';
import { EntityFormValue } from '../../../models/interfaces/form/EntityFormValue';

@Component({
  selector: 'app-entity-edit',
  standalone: true,
  imports: [EntitiesFormComponent],
  templateUrl: './edit.component.html',
})
export class EntityEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly entityService = inject(EntityService);
  private readonly router = inject(Router);

  readonly entityId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly entity = signal<Entity | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadEntity();
  }

  save(formValue: EntityFormValue): void {
    const currentEntity = this.entity();

    if (!currentEntity) {
      void Swal.fire('Error', 'No se encontro la entidad a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.entityService
      .getAll()
      .pipe(
        take(1),
        map((entities) => this.hasDuplicatedName(entities, formValue.name, currentEntity.id_entity)),
        switchMap((nameExists) => {
          if (nameExists) {
            throw new Error('ENTITY_NAME_EXISTS');
          }

          return this.entityService.update(
            currentEntity.id_entity,
            this.toEntity(formValue, currentEntity.id_entity),
          );
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La entidad fue actualizada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/entities']);
  }

  private loadEntity(): void {
    const entityId = this.entityId();

    if (!entityId) {
      void Swal.fire('Error', 'No se encontro la entidad a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);
    forkJoin({
      entity: this.entityService.getById(entityId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ entity }) => this.entity.set(entity),
        error: () => {
          void Swal.fire('Error', 'No se pudo cargar la informacion del formulario.', 'error');
          this.cancel();
        },
      });
  }

  private hasDuplicatedName(entities: Entity[], name: string, excludedEntityId: number): boolean {
    const normalizedName = this.normalizeText(name);

    return entities.some(
      (entity) =>
        this.normalizeText(entity.name) === normalizedName &&
        entity.id_entity !== excludedEntityId,
    );
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'ENTITY_NAME_EXISTS') {
      void Swal.fire('Entidad duplicada', 'Ya existe una entidad con ese nombre. El sistema cancelo la operacion.', 'warning');
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar la entidad.', 'error');
  }

  private toEntity(value: EntityFormValue, entityId: number): Entity {
    return {
      id_entity: entityId,
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
