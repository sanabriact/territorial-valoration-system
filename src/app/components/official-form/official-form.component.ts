import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entity } from '../../models/Entity';
import { Official, OfficialFormValue, OfficialStatus } from '../../models/Official';

export type OfficialFormMode = 'create' | 'edit';

@Component({
  selector: 'app-official-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly roles = ['ADMIN', 'FUNCIONARIO'];

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
    position: ['', [Validators.required, Validators.minLength(2)]],
    role: ['FUNCIONARIO', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{7,20}$/)]],
    status: ['active' as OfficialStatus, [Validators.required]],
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

    const formValue = this.officialForm.getRawValue() as OfficialFormValue;
    this.formSubmit.emit(formValue);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  hasFieldError(field: keyof OfficialFormValue): boolean {
    const control = this.officialForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  private toFormValue(official: Official): OfficialFormValue {
    return {
      id_entity: Number(official.id_entity),
      name: official.name,
      email: official.email,
      phone: official.phone,
      role: official.role,
      status: official.status === 'inactive' ? 'inactive' : 'active',
    };
  }
}
