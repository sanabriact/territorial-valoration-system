import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Commune, Neighborhood, NeighborhoodFormValue } from '../../../models/Neighborhood';
import { CommuneApi, NeighborhoodApi } from '../data-access/neighborhood-api';
import { NeighborhoodFormComponent } from '../components/neighborhood-form/neighborhood-form.component';
import { NeighborhoodRules } from '../utils/neighborhood-rules';

@Component({
  selector: 'app-neighborhood-create',
  standalone: true,
  imports: [NeighborhoodFormComponent],
  template: `
    <app-neighborhood-form
      mode="create"
      [communes]="communes()"
      [loading]="loading()"
      [saving]="saving()"
      (formSubmit)="save($event)"
      (formCancel)="cancel()"
    />
  `,
  providers: [CommuneApi, NeighborhoodApi],
})
export class NeighborhoodCreateComponent implements OnInit {
  private readonly communeApi = inject(CommuneApi);
  private readonly neighborhoodApi = inject(NeighborhoodApi);
  private readonly router = inject(Router);

  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadFormData();
  }

  save(formValue: NeighborhoodFormValue): void {
    this.saving.set(true);
    this.neighborhoodApi
      .searchByCommune(Number(formValue.id_commune))
      .pipe(
        take(1),
        map((neighborhoods) => NeighborhoodRules.hasDuplicatedName(neighborhoods, formValue)),
        switchMap((duplicated) => {
          if (duplicated) {
            throw new Error('NEIGHBORHOOD_NAME_EXISTS');
          }

          return this.neighborhoodApi.create(NeighborhoodRules.toRequest(formValue));
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'El barrio fue guardado correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/neighborhoods']);
  }

  private loadFormData(): void {
    this.loading.set(true);

    forkJoin({
      communes: this.communeApi.getAll(),
      neighborhoods: this.neighborhoodApi.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);

          if (communes.length === 0) {
            void Swal.fire('Sin comunas', 'Debes registrar al menos una comuna antes de crear barrios.', 'warning');
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
