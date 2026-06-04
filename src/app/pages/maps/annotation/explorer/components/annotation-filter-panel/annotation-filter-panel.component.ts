import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
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

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(Number(categoryId));
  }
}
