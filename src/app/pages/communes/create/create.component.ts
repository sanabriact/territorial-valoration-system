import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { CommuneFormComponent } from '../form/commune-form.component';
import { CommuneFormValue } from '../../../models/interfaces/form/CommuneFormValue';
import { Commune } from '../../../models/Commune';
import { CommuneService } from '../../../services/communes/commune.service';

@Component({
  selector: 'app-commune-create',
  standalone: true,
  imports: [CommuneFormComponent],
  templateUrl: './create.component.html',
})
export class CommuneCreateComponent {

  private readonly communeService = inject(CommuneService);
  private readonly router = inject(Router);

  readonly saving = signal(false);

  save(formValue: CommuneFormValue): void {
    this.saving.set(true);
    this.communeService
      .getAll()
      .pipe(
        take(1),
        map((communes) => this.hasDuplicatedName(communes, formValue.name, formValue.id_city)),
        switchMap((nameExists) => {
          if (nameExists) throw new Error('COMMUNE_NAME_EXISTS');
          return this.communeService.create(this.toCommune(formValue));
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La comuna fue creada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/communes']);
  }

  private hasDuplicatedName(communes: Commune[], name: string, idCity: number): boolean {
    const normalized = this.normalizeText(name);
    return communes.some(
      (c) => this.normalizeText(c.name) === normalized && c.id_city === idCity,
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
    void Swal.fire('Error', 'No se pudo guardar la comuna.', 'error');
  }

  private toCommune(value: CommuneFormValue): Commune {
    return {
      id_commune: 0,
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