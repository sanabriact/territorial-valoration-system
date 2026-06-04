import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AnnotationExplorerItem } from '../../models/annotation-explorer.model';
import { resolveBackendFileUrl } from '../../../../../../utils/file-url';

@Component({
  selector: 'app-annotation-detail-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annotation-detail-panel.component.html',
  styleUrl: './annotation-detail-panel.component.scss',
})
export class AnnotationDetailPanelComponent {
  readonly item = input<AnnotationExplorerItem | null>(null);
  readonly closePanel = output<void>();

  getEvidenceUrl(fileUrl: string): string {
    return resolveBackendFileUrl(fileUrl);
  }

  stars(value: number): number[] {
    return Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (star <= Math.round(value) ? 1 : 0));
  }

  subcategoryNames(item: AnnotationExplorerItem): string {
    const subcategories = item.categories.slice(1).map((category) => category.name).filter(Boolean);
    return subcategories.length ? subcategories.join(', ') : 'Sin subcategoria';
  }
}
