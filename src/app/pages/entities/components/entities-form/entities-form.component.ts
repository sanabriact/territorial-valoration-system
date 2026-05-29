import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entity, EntityStatus } from '../../../../models/Entity';
import { EntityFormValue } from '../../../../models/interfaces/form/EntityFormValue';

export type EntityFormMode = 'create' | 'edit';

@Component({
  selector: 'app-entities-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entities-form.component.html',
  styleUrl: './entities-form.component.scss',
})
export class EntitiesFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<EntityFormMode>();
  readonly entity = input<Entity | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);

  readonly formSubmit = output<EntityFormValue>();
  readonly formCancel = output<void>();

  readonly logoPreview = signal('imagen_por_defecto.png');

  readonly title = computed(() =>
    this.mode() === 'edit' ? 'Editar entidad' : 'Crear entidad',
  );

  readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Actualiza la informacion institucional de la entidad.'
      : 'Registra una entidad y carga su logo institucional.',
  );

  readonly entityForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    nit: ['', [Validators.required, Validators.pattern(/^[0-9.-]{5,20}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{7,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    logo_url: [''],
    status: ['active' as EntityStatus, [Validators.required]],
    file: [null as File | null],
  });

  constructor() {
    effect(() => {
      const entity = this.entity();

      if (entity) {
        const formValue = this.toFormValue(entity);
        this.entityForm.patchValue(formValue);
        this.logoPreview.set(formValue.logo_url || 'imagen_por_defecto.png');
      }
    });
  }

  save(): void {
    this.entityForm.markAllAsTouched();

    if (this.entityForm.invalid) {
      return;
    }

    this.formSubmit.emit(this.entityForm.getRawValue() as EntityFormValue);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.entityForm.patchValue({ file });

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview.set(String(reader.result ?? 'imagen_por_defecto.png'));
    };
    reader.readAsDataURL(file);
  }

  hasFieldError(field: keyof EntityFormValue): boolean {
    const control = this.entityForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  private toFormValue(entity: Entity): Partial<EntityFormValue> {
    return {
      name: entity.name,
      nit: entity.nit,
      phone: entity.phone,
      email: entity.email,
      address: entity.address ?? entity.adress ?? '',
      logo_url: entity.logo_url ?? '',
      status: entity.status === 'inactive' ? 'inactive' : 'active',
      file: null,
    };
  }
}
