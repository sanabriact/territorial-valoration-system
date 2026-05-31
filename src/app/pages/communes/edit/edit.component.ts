import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { CommuneFormComponent } from '../form/commune-form.component';
import { CommuneFormValue } from '../../../models/interfaces/form/CommuneFormValue';
import { Commune } from '../../../models/Commune';
import { CommuneService } from '../../../services/communes/commune.service';

@Component({
  selector: 'app-commune-edit',
  standalone: true,
  imports: [CommuneFormComponent],
  templateUrl: './edit.component.html',
})
export class CommuneEditComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly communeService = inject(CommuneService);
  private readonly router = inject(Router);

  readonly communeId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly commune = signal<Commune | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadCommune();
  }

  save(formValue: CommuneFormValue): void {
    const current = this.commune();
    if (!current) {
      void Swal.fire('Error', 'No se encontró la comuna a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.communeService
      .getAll()
      .pipe(
        take(1),
        map((communes) =>
          this.hasDuplicatedName(communes, formValue.name, formValue.id_city, current.id_commune),
        ),
        switchMap((nameExists) => {
          if (nameExists) throw new Error('COMMUNE_NAME_EXISTS');
          return this.communeService.update(
            current.id_commune,
            this.toCommune(formValue, current.id_commune),
          );
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La comuna fue actualizada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/communes']);
  }

  private loadCommune(): void {
    const id = this.communeId();
    if (!id) {
      void Swal.fire('Error', 'No se encontró la comuna a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);
    forkJoin({ commune: this.communeService.getById(id) })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ commune }) => this.commune.set(commune),
        error: () => {
          void Swal.fire('Error', 'No se pudo cargar la información de la comuna.', 'error');
          this.cancel();
        },
      });
  }

  private hasDuplicatedName(
    communes: Commune[],
    name: string,
    idCity: number,
    excludeId: number,
  ): boolean {
    const normalized = this.normalizeText(name);
    return communes.some(
      (c) =>
        this.normalizeText(c.name) === normalized &&
        c.id_city === idCity &&
        c.id_commune !== excludeId,
    );
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'COMMUNE_NAME_EXISTS') {
      void Swal.fire(
        'Nombre duplicado',
        'Ya existe una comuna con ese nombre en la ciudad seleccionada. El sistema canceló la operación.',
        'warning',
      );
      return;
    }
    void Swal.fire('Error', 'No se pudo actualizar la comuna.', 'error');
  }

  private toCommune(value: CommuneFormValue, id: number): Commune {
    return {
      id_commune: id,
      id_city: value.id_city,
      name: value.name,
      status: value.status,
      created_at: '',
      updated_at: '',
    };
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}