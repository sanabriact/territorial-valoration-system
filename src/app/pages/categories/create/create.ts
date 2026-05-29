import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Category, CategoryFormValue } from '../../../models/Category';
import { CategoryService } from '../../../services/categories/category.service';
import { CategoryFormComponent } from '../components/category-form/category-form.component';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CategoryFormComponent],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class CategoryCreateComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly parentCategoryId = computed(() => {
    const parentId = Number(this.route.snapshot.queryParamMap.get('parentId'));
    return Number.isFinite(parentId) && parentId > 0 ? parentId : null;
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  save(formValue: CategoryFormValue): void {
    this.saving.set(true);
    this.categoryService
      .getAll()
      .pipe(
        take(1),
        map((categories) => this.hasDuplicatedName(categories, formValue)),
        switchMap((nameExists) => {
          if (nameExists) {
            throw new Error('CATEGORY_NAME_EXISTS');
          }

          return this.categoryService.create(this.toCategory(formValue, 0));
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La categoria fue guardada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/categories']);
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => {
          void Swal.fire('Error', 'No se pudieron cargar las categorias.', 'error');
          this.cancel();
        },
      });
  }

  private hasDuplicatedName(categories: Category[], value: CategoryFormValue): boolean {
    const normalizedName = this.normalizeText(value.name);
    const parentId = value.id_parent_category ? Number(value.id_parent_category) : null;

    return categories.some(
      (category) =>
        (category.id_parent_category ?? null) === parentId &&
        this.normalizeText(category.name) === normalizedName,
    );
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'CATEGORY_NAME_EXISTS') {
      void Swal.fire('Categoria duplicada', 'Ya existe una categoria con ese nombre en el mismo nivel.', 'warning');
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar la categoria.', 'error');
  }

  private toCategory(value: CategoryFormValue, categoryId: number): Category {
    return {
      id_category: categoryId,
      id_parent_category: value.id_parent_category ? Number(value.id_parent_category) : null,
      name: value.name,
      description: value.description,
      image_url: value.image_url,
      status: value.status,
      file: value.file,
    };
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}

export { CategoryCreateComponent as Create };
