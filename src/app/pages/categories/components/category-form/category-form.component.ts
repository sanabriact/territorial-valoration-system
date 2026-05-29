import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../../environments/environments';
import { Category, CategoryFormValue, CategoryStatus } from '../../../../models/Category';

export type CategoryFormMode = 'create' | 'edit';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<CategoryFormMode>();
  readonly category = input<Category | null>(null);
  readonly initialParentCategoryId = input<number | null>(null);
  readonly parentCategories = input<Category[]>([]);
  readonly loading = input(false);
  readonly saving = input(false);

  readonly formSubmit = output<CategoryFormValue>();
  readonly formCancel = output<void>();

  readonly imagePreview = signal('imagen_por_defecto.png');

  readonly title = computed(() => (this.mode() === 'edit' ? 'Editar categoria' : 'Nueva categoria'));
  readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Actualiza la informacion de la categoria.'
      : 'Completa la informacion de la categoria.',
  );

  readonly categoryForm = this.formBuilder.group({
    id_parent_category: [null as number | null],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    image_url: [''],
    status: ['active' as CategoryStatus, [Validators.required]],
    file: [null as File | null],
  });

  constructor() {
    effect(() => {
      const category = this.category();

      if (!category) {
        this.categoryForm.patchValue({
          id_parent_category: this.initialParentCategoryId(),
        });
        return;
      }

      const formValue = this.toFormValue(category);
      this.categoryForm.patchValue(formValue);
      this.imagePreview.set(this.resolveImageSrc(formValue.image_url));
    });
  }

  save(): void {
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid) {
      return;
    }

    this.formSubmit.emit(this.categoryForm.getRawValue() as CategoryFormValue);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.categoryForm.patchValue({ file });

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(String(reader.result ?? 'imagen_por_defecto.png'));
    reader.readAsDataURL(file);
  }

  replaceBrokenImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'imagen_por_defecto.png';
  }

  hasFieldError(field: keyof CategoryFormValue): boolean {
    const control = this.categoryForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  private toFormValue(category: Category): CategoryFormValue {
    return {
      id_parent_category: category.id_parent_category ?? null,
      name: category.name,
      description: category.description,
      image_url: category.image_url ?? '',
      status: category.status === 'inactive' ? 'inactive' : 'active',
      file: null,
    };
  }

  private resolveImageSrc(imageUrl: string | null | undefined): string {
    if (!imageUrl) return 'imagen_por_defecto.png';

    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/api/')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return `${environment.apiUrl}/images${imageUrl}`;
    }

    return imageUrl;
  }
}
