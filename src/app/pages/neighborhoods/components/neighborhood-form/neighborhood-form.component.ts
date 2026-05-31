import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Neighborhood,
  NeighborhoodFormValue,
  NeighborhoodStatus,
} from '../../../../models/Neighborhood';
import { Commune } from '../../../../models/Commune';

export type NeighborhoodFormMode = 'create' | 'edit';

@Component({
  selector: 'app-neighborhood-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './neighborhood-form.component.html',
  styleUrl: './neighborhood-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NeighborhoodFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<NeighborhoodFormMode>();
  readonly communes = input<Commune[]>([]);
  readonly neighborhood = input<Neighborhood | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);

  readonly formSubmit = output<NeighborhoodFormValue>();
  readonly formCancel = output<void>();

  readonly title = computed(() => (this.mode() === 'edit' ? 'Editar barrio' : 'Nuevo barrio'));
  readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Actualiza la comuna y el nombre del barrio.'
      : 'Asocia el barrio a una comuna registrada.',
  );

  readonly neighborhoodForm = this.formBuilder.group({
    id_commune: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    status: ['active' as NeighborhoodStatus, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const neighborhood = this.neighborhood();

      if (!neighborhood) {
        return;
      }

      this.neighborhoodForm.patchValue({
        id_commune: Number(neighborhood.id_commune),
        name: neighborhood.name,
        status: neighborhood.status === 'inactive' ? 'inactive' : 'active',
      });
    });
  }

  save(): void {
    this.neighborhoodForm.markAllAsTouched();

    if (this.neighborhoodForm.invalid) {
      return;
    }

    this.formSubmit.emit(this.neighborhoodForm.getRawValue() as NeighborhoodFormValue);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  hasFieldError(field: keyof NeighborhoodFormValue): boolean {
    const control = this.neighborhoodForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
