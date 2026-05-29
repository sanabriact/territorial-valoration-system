import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Category, CategoryFormValue } from '../../../models/Category';
import { CategoryService } from '../../../services/categories/category.service';
import { CategoryFormComponent } from '../components/category-form/category-form.component';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CategoryFormComponent],
  templateUrl: './edit.html',
  styleUrl: './edit.scss',
})
export class CategoryEditComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categoryId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly category = signal<Category | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly parentCandidates = computed(() => {
    const excludedIds = this.getExcludedParentIds();
    return this.categories().filter((category) => !excludedIds.has(category.id_category));
  });

  ngOnInit(): void {
    this.loadFormData();
  }

  save(formValue: CategoryFormValue): void {
    const currentCategory = this.category();

    if (!currentCategory) {
      void Swal.fire('Error', 'No se encontro la categoria a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.categoryService
      .getAll()
      .pipe(
        take(1),
        map((categories) => this.hasDuplicatedName(categories, formValue, currentCategory.id_category)),
        switchMap((nameExists) => {
          if (nameExists) {
            throw new Error('CATEGORY_NAME_EXISTS');
          }

          return this.categoryService.update(
            currentCategory.id_category,
            this.toCategory(formValue, currentCategory.id_category),
          );
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'La categoria fue actualizada correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/categories']);
  }

  private loadFormData(): void {
    const categoryId = this.categoryId();

    if (!categoryId) {
      void Swal.fire('Error', 'No se encontro la categoria a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);
    forkJoin({
      category: this.categoryService.getById(categoryId),
      categories: this.categoryService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ category, categories }) => {
          this.category.set(category);
          this.categories.set(categories);
        },
        error: () => {
          void Swal.fire('Error', 'No se pudo cargar la informacion del formulario.', 'error');
          this.cancel();
        },
      });
  }

  private hasDuplicatedName(
    categories: Category[],
    value: CategoryFormValue,
    excludedCategoryId: number,
  ): boolean {
    const normalizedName = this.normalizeText(value.name);
    const parentId = value.id_parent_category ? Number(value.id_parent_category) : null;

    return categories.some(
      (category) =>
        category.id_category !== excludedCategoryId &&
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

  private getExcludedParentIds(): Set<number> {
    const currentCategory = this.category();
    const excludedIds = new Set<number>();

    if (!currentCategory) {
      return excludedIds;
    }

    excludedIds.add(currentCategory.id_category);
    this.collectDescendantIds(currentCategory.id_category, excludedIds);
    return excludedIds;
  }

  private collectDescendantIds(categoryId: number, excludedIds: Set<number>): void {
    this.categories()
      .filter((category) => category.id_parent_category === categoryId)
      .forEach((category) => {
        excludedIds.add(category.id_category);
        this.collectDescendantIds(category.id_category, excludedIds);
      });
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}

export { CategoryEditComponent as Edit };
