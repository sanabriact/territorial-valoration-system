import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { environment } from '../../../../environments/environments';
import { Category, CategoryStatus, CategoryTreeNode } from '../../../models/Category';
import { CategoryService } from '../../../services/categories/category.service';

type CategoryStatusFilter = 'all' | CategoryStatus;

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<CategoryStatusFilter>('all');
  readonly expandedIds = signal<Set<number>>(new Set<number>());

  readonly categoryTree = computed(() => this.buildTree(this.filteredCategories()));
  readonly totalVisibleRows = computed(() =>
    this.categoryTree().reduce((total, node) => total + 1 + node.children.length, 0),
  );

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.expandRootCategories(categories);
        },
        error: () => void Swal.fire('Error', 'No se pudieron cargar las categorias.', 'error'),
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CategoryStatusFilter;
    this.statusFilter.set(value);
  }

  createCategory(parentCategory?: Category): void {
    void this.router.navigate(['/administration/categories/create'], {
      queryParams: parentCategory ? { parentId: parentCategory.id_category } : undefined,
    });
  }

  editCategory(category: Category): void {
    void this.router.navigate(['/administration/categories/edit', category.id_category]);
  }

  deleteCategory(category: Category): void {
    if (this.hasChildren(category.id_category)) {
      void Swal.fire(
        'No se puede eliminar',
        'La categoria tiene subcategorias asociadas. Reasignalas antes de eliminarla.',
        'warning',
      );
      return;
    }

    void Swal.fire({
      title: 'Eliminar categoria',
      text: `Quieres eliminar ${category.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.categoryService.delete(category.id_category).subscribe({
        next: () => {
          this.loadCategories();
          void Swal.fire('Eliminada', 'La categoria fue eliminada correctamente.', 'success');
        },
        error: (error: HttpErrorResponse) => {
          const message =
            error.status === 409
              ? 'La categoria tiene anotaciones asociadas. Reasignalas antes de eliminarla.'
              : 'No se pudo eliminar la categoria.';

          void Swal.fire('Operacion cancelada', message, 'error');
        },
      });
    });
  }

  toggleExpanded(categoryId: number): void {
    this.expandedIds.update((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  isExpanded(categoryId: number): boolean {
    return this.expandedIds().has(categoryId);
  }

  replaceBrokenImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'imagen_por_defecto.png';
  }

  getParentName(category: Category): string {
    if (!category.id_parent_category) return '--';
    return this.categories().find((item) => item.id_category === category.id_parent_category)?.name ?? '--';
  }

  getStatusLabel(status: string): string {
    return this.toStatus(status) === 'active' ? 'Activa' : 'Inactiva';
  }

  resolveImageSrc(imageUrl: string | null | undefined): string {
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

  private filteredCategories(): Category[] {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.categories().filter((category) => {
      const matchesStatus = status === 'all' || this.toStatus(category.status) === status;
      const matchesQuery =
        !query ||
        [category.name, category.description, this.getParentName(category)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }

  private buildTree(categories: Category[]): CategoryTreeNode[] {
    const byParent = new Map<number | null, Category[]>();

    categories.forEach((category) => {
      const parentId = category.id_parent_category ?? null;
      const siblings = byParent.get(parentId) ?? [];
      siblings.push(category);
      byParent.set(parentId, siblings);
    });

    const roots = byParent.get(null) ?? [];

    return roots.map((category) => ({
      ...category,
      children: byParent.get(category.id_category) ?? [],
    }));
  }

  private hasChildren(categoryId: number): boolean {
    return this.categories().some((category) => category.id_parent_category === categoryId);
  }

  private expandRootCategories(categories: Category[]): void {
    const rootIds = categories
      .filter((category) => !category.id_parent_category)
      .map((category) => category.id_category);

    this.expandedIds.set(new Set(rootIds));
  }

  private toStatus(status: string): CategoryStatus {
    return status === 'inactive' ? 'inactive' : 'active';
  }
}
