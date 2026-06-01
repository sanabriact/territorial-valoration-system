import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entity } from '../../../../models/Entity';
import { Official, OfficialStatus } from '../../../../models/Official';
import { OfficialFormValue } from '../../../../models/interfaces/form/OfficialFormValue';
import { toDateTimeLocalValue } from './official-gps-date.util';
import {
  OfficialLocationMapComponent,
  OfficialLocationSelection,
} from '../official-location-map/official-location-map.component';

export type OfficialFormMode = 'create' | 'edit';

@Component({
  selector: 'app-official-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OfficialLocationMapComponent],
  templateUrl: './official-form.component.html',
  styleUrls: ['./official-form.component.scss'],
})
export class OfficialFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<OfficialFormMode>();
  readonly entities = input<Entity[]>([]);
  readonly official = input<Official | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);

  readonly formSubmit = output<OfficialFormValue>();
  readonly formCancel = output<void>();

  readonly roles = ['FUNCIONARIO'];

  readonly title = computed(() =>
    this.mode() === 'edit' ? 'Editar funcionario' : 'Agregar funcionario',
  );

  readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Actualiza los datos del funcionario y su entidad.'
      : 'Registra un funcionario y asignale una entidad.',
  );

  readonly officialForm = this.formBuilder.nonNullable.group({
    id_entity: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['FUNCIONARIO', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{7,20}$/)]],
    status: ['active' as OfficialStatus, [Validators.required]],
    gps_active: [true],
    last_latitude: [5.070275, [Validators.required, Validators.min(-90), Validators.max(90)]],
    last_longitude: [-75.513817, [Validators.required, Validators.min(-180), Validators.max(180)]],
    last_gps_update: [toDateTimeLocalValue(new Date()), [Validators.required]],
  });

  constructor() {
    effect(() => {
      const official = this.official();

      if (official) {
        this.officialForm.patchValue(this.toFormValue(official));
      }
    });
  }

  save(): void {
    this.officialForm.markAllAsTouched();

    if (this.officialForm.invalid) {
      return;
    }

    const formValue = this.normalizeFormValue(this.officialForm.getRawValue() as OfficialFormValue);
    this.formSubmit.emit(formValue);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  hasFieldError(field: keyof OfficialFormValue): boolean {
    const control = this.officialForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  selectLocation(location: OfficialLocationSelection): void {
    this.officialForm.patchValue({
      last_latitude: Number(location.latitude.toFixed(6)),
      last_longitude: Number(location.longitude.toFixed(6)),
      last_gps_update: toDateTimeLocalValue(new Date()),
    });

    this.officialForm.controls.last_latitude.markAsDirty();
    this.officialForm.controls.last_longitude.markAsDirty();
  }

  selectedLatitude(): number {
    return this.officialForm.controls.last_latitude.value;
  }

  selectedLongitude(): number {
    return this.officialForm.controls.last_longitude.value;
  }

  private toFormValue(official: Official): Omit<OfficialFormValue, 'last_gps_update'> & { last_gps_update: string } {
    return {
      id_entity: Number(official.id_entity),
      name: official.name,
      email: official.email,
      phone: official.phone,
      role: official.role,
      status: official.status === 'inactive' ? 'inactive' : 'active',
      gps_active: official.gps_active ?? false,
      last_latitude: official.last_latitude ?? 5.070275,
      last_longitude: official.last_longitude ?? -75.513817,
      last_gps_update: official.last_gps_update
        ? toDateTimeLocalValue(official.last_gps_update)
        : toDateTimeLocalValue(new Date()),
    };
  }

  private normalizeFormValue(value: OfficialFormValue): OfficialFormValue {
    return {
      ...value,
      last_latitude: Number(value.last_latitude),
      last_longitude: Number(value.last_longitude),
      last_gps_update: value.last_gps_update,
    };
  }
}
