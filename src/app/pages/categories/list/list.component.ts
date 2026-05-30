import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { environment } from '../../../../environments/environments';
import { Category, CategoryStatus, CategoryTreeNode } from '../../../models/Category';
import { CategoryService } from '../../../services/categories/category.service';
import { GenericTableComponent } from '../../../components/generic-table/generic-table.component';
import { TableColumn, TreeConfig } from '../../../models/components/generic-table/generic-table-types';

type CategoryStatusFilter = 'all' | CategoryStatus;

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  // ── Columnas de la tabla ──────────────────────────────────────────────────
  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Categoría / Subcategoría', type: 'text' },
    { key: 'status', label: 'Estado', type: 'badge',
      badgeConfig: { activeValue: 'active', activeLabel: 'Activa', inactiveLabel: 'Inactiva' } },
  ];

  // ── Configuración del árbol ───────────────────────────────────────────────
  readonly treeConfig: TreeConfig = {
    idKey: 'id_category',
    childrenKey: 'children',
    nameKey: 'name',
    rootBadgeLabel: 'Categoría',
    childBadgeLabel: 'Subcategoría',
    showTypeBadge: true,
    typeBadgeColumnLabel: 'Tipo',
    showParentColumn: true,
    parentColumnLabel: 'Categoría padre',
    initialExpandedIds: [],
    addChildAction: { id: 'add-child', tooltip: 'Crear subcategoría' },
  };

  // ── Datos para la tabla (árbol aplanado con children) ─────────────────────
  readonly tableData = computed<any[]>(() =>
    this.buildTree(this.categories())
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
        next: (categories) => this.categories.set(categories),
        error: () => void Swal.fire('Error', 'No se pudieron cargar las categorias.', 'error'),
      });
  }

  onActionClicked(event: { actionId: string; row: any }): void {
    const { actionId, row } = event;

    switch (actionId) {
      case 'create':
        void this.router.navigate(['/administration/categories/create']);
        break;

      case 'add-child':
        void this.router.navigate(['/administration/categories/create'], {
          queryParams: { parentId: row?.id_category },
        });
        break;

      case 'edit':
        void this.router.navigate(['/administration/categories/edit', row.id_category]);
        break;

      case 'delete':
        this.confirmDelete(row);
        break;
    }
  }

  private confirmDelete(category: Category): void {
    const hasChildren = this.categories().some(
      (c) => c.id_parent_category === category.id_category,
    );

    if (hasChildren) {
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
}