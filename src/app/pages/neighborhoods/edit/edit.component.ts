import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Commune, Neighborhood, NeighborhoodFormValue } from '../../../models/Neighborhood';
import { CommuneApi, NeighborhoodApi } from '../data-access/neighborhood-api';
import { NeighborhoodFormComponent } from '../components/neighborhood-form/neighborhood-form.component';
import { NeighborhoodRules } from '../utils/neighborhood-rules';

@Component({
  selector: 'app-neighborhood-edit',
  standalone: true,
  imports: [NeighborhoodFormComponent],
  template: `
    <app-neighborhood-form
      mode="edit"
      [communes]="communes()"
      [neighborhood]="neighborhood()"
      [loading]="loading()"
      [saving]="saving()"
      (formSubmit)="save($event)"
      (formCancel)="cancel()"
    />
  `,
  providers: [CommuneApi, NeighborhoodApi],
})
export class NeighborhoodEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly communeApi = inject(CommuneApi);
  private readonly neighborhoodApi = inject(NeighborhoodApi);
  private readonly router = inject(Router);

  readonly neighborhoodId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly communes = signal<Commune[]>([]);
  readonly neighborhood = signal<Neighborhood | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadFormData();
  }

  save(formValue: NeighborhoodFormValue): void {
    const currentNeighborhood = this.neighborhood();

    if (!currentNeighborhood) {
      void Swal.fire('Error', 'No se encontro el barrio a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.neighborhoodApi
      .searchByCommune(Number(formValue.id_commune))
      .pipe(
        take(1),
        map((neighborhoods) =>
          NeighborhoodRules.hasDuplicatedName(
            neighborhoods,
            formValue,
            currentNeighborhood.id_neighborhood,
          ),
        ),
        switchMap((duplicated) => {
          if (duplicated) {
            throw new Error('NEIGHBORHOOD_NAME_EXISTS');
          }

          return this.neighborhoodApi.update(
            currentNeighborhood.id_neighborhood,
            NeighborhoodRules.toRequest(formValue),
          );
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'El barrio fue actualizado correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/neighborhoods']);
  }

  private loadFormData(): void {
    const neighborhoodId = this.neighborhoodId();

    if (!neighborhoodId) {
      void Swal.fire('Error', 'No se encontro el barrio a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);

    forkJoin({
      communes: this.communeApi.getAll(),
      neighborhood: this.neighborhoodApi.getById(neighborhoodId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhood }) => {
          this.communes.set(communes);
          this.neighborhood.set(neighborhood);

          if (communes.length === 0) {
            void Swal.fire('Sin comunas', 'Debes registrar al menos una comuna antes de editar barrios.', 'warning');
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
    if (error instanceof Error && error.message === 'NEIGHBORHOOD_NAME_EXISTS') {
      void Swal.fire(
        'Barrio duplicado',
        'Ya existe un barrio con ese nombre en la comuna seleccionada. El sistema cancelo la operacion.',
        'warning',
      );
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar el barrio.', 'error');
  }
}
