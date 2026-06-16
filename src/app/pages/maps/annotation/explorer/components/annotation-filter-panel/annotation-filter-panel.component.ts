import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { CategoryTreeNode } from '../../models/annotation-explorer.model';

@Component({
  selector: 'app-annotation-filter-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annotation-filter-panel.component.html',
  styleUrl: './annotation-filter-panel.component.scss',
})
export class AnnotationFilterPanelComponent {
  readonly tree = input<CategoryTreeNode[]>([]);
  readonly selectedCategoryIds = input<number[]>([]);
  readonly visibleCount = input(0);

  readonly toggleCategory = output<number>();
  readonly clearFilters = output<void>();
  readonly closePanel = output<void>();

  /** IDs de nodos del árbol que están expandidos */
  private readonly expandedIds = signal<Set<number>>(new Set<number>());

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(Number(categoryId));
  }

  isExpanded(categoryId: number): boolean {
    return this.expandedIds().has(Number(categoryId));
  }

  toggleExpand(categoryId: number): void {
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
}