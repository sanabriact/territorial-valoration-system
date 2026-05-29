import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Citizen, CitizenStatus } from '../../../../models/Citizen';
import { CitizenFormValue } from '../../../../models/interfaces/form/CitizenFormValue';
import { MapLocation } from '../../../../models/interfaces/maps/MapLocation';
import { CitizenLocationPickerComponent } from '../citizen-location-picker/citizen-location-picker.component';

export type CitizenFormMode = 'create' | 'edit';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CitizenLocationPickerComponent],
  templateUrl: './citizen-form.component.html',
  styleUrl: './citizen-form.component.scss',
})
export class CitizenFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<CitizenFormMode>();
  readonly citizen = input<Citizen | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);

  readonly formSubmit = output<CitizenFormValue>();
  readonly formCancel = output<void>();

  readonly selectedLocation = signal<MapLocation | null>(null);

  readonly title = computed(() => (this.mode() === 'edit' ? 'Editar ciudadano' : 'Nuevo ciudadano'));

  readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Actualiza la informacion del ciudadano.'
      : 'Completa la informacion del ciudadano.',
  );

  readonly citizenForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{7,20}$/)]],
    address: ['', [Validators.required]],
    latitude: [null as number | null, [Validators.required]],
    longitude: [null as number | null, [Validators.required]],
    status: ['active' as CitizenStatus, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const citizen = this.citizen();

      if (!citizen) {
        return;
      }

      const formValue = this.toFormValue(citizen);
      this.citizenForm.patchValue(formValue);
      this.selectedLocation.set({
        address: formValue.address,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
      });
    });
  }

  save(): void {
    this.citizenForm.markAllAsTouched();

    if (this.citizenForm.invalid) {
      return;
    }

    const formValue = this.citizenForm.getRawValue();

    if (formValue.latitude === null || formValue.longitude === null) {
      return;
    }

    this.formSubmit.emit({
      name: formValue.name ?? '',
      email: formValue.email ?? '',
      phone: formValue.phone ?? '',
      address: formValue.address ?? '',
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      status: formValue.status ?? 'active',
    });
  }

  cancel(): void {
    this.formCancel.emit();
  }

  onLocationSelected(location: MapLocation): void {
    this.selectedLocation.set(location);
    this.citizenForm.patchValue({
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    this.citizenForm.controls.address.markAsDirty();
    this.citizenForm.controls.latitude.markAsDirty();
    this.citizenForm.controls.longitude.markAsDirty();
  }

  onLocationCleared(): void {
    this.selectedLocation.set(null);
    this.citizenForm.patchValue({
      address: '',
      latitude: null,
      longitude: null,
    });
    this.citizenForm.controls.address.markAsTouched();
    this.citizenForm.controls.latitude.markAsTouched();
    this.citizenForm.controls.longitude.markAsTouched();
  }

  hasFieldError(field: keyof CitizenFormValue): boolean {
    const control = this.citizenForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  hasLocationError(): boolean {
    const address = this.citizenForm.controls.address;
    const latitude = this.citizenForm.controls.latitude;
    const longitude = this.citizenForm.controls.longitude;

    return (
      (address.invalid || latitude.invalid || longitude.invalid) &&
      (address.dirty ||
        address.touched ||
        latitude.dirty ||
        latitude.touched ||
        longitude.dirty ||
        longitude.touched)
    );
  }

  private toFormValue(citizen: Citizen): CitizenFormValue {
    return {
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      address: citizen.address ?? '',
      latitude: Number(citizen.latitude),
      longitude: Number(citizen.longitude),
      status: citizen.status === 'inactive' ? 'inactive' : 'active',
    };
  }
}
