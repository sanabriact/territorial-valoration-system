import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { AnnotationService } from '../../../../services/annotations/annotation.service';
import { CategoryService } from '../../../../services/categories/category.service';
import { CommuneService } from '../../../../services/communes/commune.service';
import { EvidenceService } from '../../../../services/evidences/evidence.service';
import { NeighborhoodService } from '../../../../services/neighborhoods/neighborhood.service';
import { PointService } from '../../../../services/points/point.service';
import { VoteService } from '../../../../services/votes/vote.service';
import { Category } from '../../../../models/Category';
import { Commune } from '../../../../models/Commune';
import { Neighborhood } from '../../../../models/Neighborhood';
import { Point } from '../../../../models/Point';
import { AnnotationDetailPanelComponent } from './components/annotation-detail-panel/annotation-detail-panel.component';
import { AnnotationFilterPanelComponent } from './components/annotation-filter-panel/annotation-filter-panel.component';
import { AnnotationsMapComponent } from './components/annotations-map/annotations-map.component';
import { AnnotationExplorerItem, AnnotationMapMarker } from './models/annotation-explorer.model';
import {
  buildAnnotationItems,
  buildCategoryTree,
  getCategoryColor,
  getDescendantCategoryIds,
  getNeighborhoodPolygon,
} from './utils/annotation-explorer.utils';

@Component({
  selector: 'app-annotations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AnnotationsMapComponent,
    AnnotationFilterPanelComponent,
    AnnotationDetailPanelComponent,
  ],
  templateUrl: './annotations.component.html',
  styleUrl: './annotations.component.scss',
})
export class AnnotationsComponent implements OnInit {
  private readonly annotationService = inject(AnnotationService);
  private readonly categoryService = inject(CategoryService);
  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly pointService = inject(PointService);
  private readonly evidenceService = inject(EvidenceService);
  private readonly voteService = inject(VoteService);

  readonly loading = signal(false);
  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly points = signal<Point[]>([]);
  readonly selectedCommuneId = signal<number | null>(null);
  readonly selectedNeighborhoodId = signal<number | null>(null);
  readonly selectedCategoryIds = signal<number[]>([]);
  readonly searchQuery = signal('');
  readonly showFilters = signal(false);
  readonly selectedAnnotationId = signal<number | null>(null);
  readonly items = signal<AnnotationExplorerItem[]>([]);

  readonly filteredNeighborhoods = computed(() => {
    const communeId = this.selectedCommuneId();
    return this.neighborhoods().filter((item) =>
      communeId === null ? true : Number(item.id_commune) === Number(communeId),
    );
  });

  readonly filteredItems = computed(() => {
    const selectedCommuneId = this.selectedCommuneId();
    const selectedNeighborhoodId = this.selectedNeighborhoodId();
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategoryIds = this.selectedCategoryIds();

    return this.items().filter((item) => {
      const matchesCommune = selectedCommuneId === null || Number(item.communeId) === Number(selectedCommuneId);
      const matchesNeighborhood =
        selectedNeighborhoodId === null || Number(item.annotation.id_neighborhood) === Number(selectedNeighborhoodId);
      const matchesQuery = !query || item.annotation.description.toLowerCase().includes(query);
      const matchesCategory = selectedCategoryIds.length === 0 || this.matchesSelectedCategories(item, selectedCategoryIds);
      return matchesCommune && matchesNeighborhood && matchesQuery && matchesCategory;
    });
  });

  readonly categoryTree = computed(() => buildCategoryTree(this.categories(), this.items()));

  readonly markers = computed<AnnotationMapMarker[]>(() =>
    this.filteredItems().map((item) => {
      const mainCategory = item.categories[0] ?? null;
      return {
        id: item.annotation.id_annotation,
        latitude: Number(item.annotation.latitude),
        longitude: Number(item.annotation.longitude),
        color: getCategoryColor(mainCategory ? Number(mainCategory.id_category) : null),
        label: String(item.categories.length || ''),
      };
    }),
  );

  readonly selectedPolygon = computed(() => getNeighborhoodPolygon(this.selectedNeighborhoodId(), this.points()));

  readonly selectedItem = computed(() =>
    this.items().find((item) => Number(item.annotation.id_annotation) === Number(this.selectedAnnotationId())) ?? null,
  );

  ngOnInit(): void {
    this.loadData();
  }

  onCommuneChange(value: number | null): void {
    this.selectedCommuneId.set(value ? Number(value) : null);
    this.selectedNeighborhoodId.set(null);
  }

  toggleCategory(categoryId: number): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(Number(categoryId)) ? ids.filter((id) => id !== Number(categoryId)) : [...ids, Number(categoryId)],
    );
  }

  clearFilters(): void {
    this.selectedCategoryIds.set([]);
    this.selectedCommuneId.set(null);
    this.selectedNeighborhoodId.set(null);
    this.searchQuery.set('');
  }

  selectAnnotation(annotationId: number): void {
    this.selectedAnnotationId.set(annotationId);
  }

  private loadData(): void {
    this.loading.set(true);
    forkJoin({
      annotations: this.annotationService.getAll(),
      annotationCategories: this.annotationService.getAnnotationCategories(),
      categories: this.categoryService.getAll(),
      communes: this.communeService.getAll(),
      neighborhoods: this.neighborhoodService.getAll(),
      points: this.pointService.getAll(),
      evidences: this.evidenceService.getAll(),
      votes: this.voteService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ annotations, annotationCategories, categories, communes, neighborhoods, points, evidences, votes }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
          this.categories.set(categories);
          this.points.set(points);
          this.items.set(
            buildAnnotationItems(annotations, annotationCategories, categories, evidences, votes, neighborhoods, communes),
          );
        },
        error: () => void Swal.fire('Error', 'No se pudo cargar el mapa de anotaciones.', 'error'),
      });
  }

  private matchesSelectedCategories(item: AnnotationExplorerItem, selectedCategoryIds: number[]): boolean {
    return selectedCategoryIds.some((selectedCategoryId) => {
      const selectedCategory = this.categories().find((category) => Number(category.id_category) === Number(selectedCategoryId));
      if (!selectedCategory) return false;
      const acceptedIds = getDescendantCategoryIds(selectedCategory, this.categories());
      return item.categories.some((category) => acceptedIds.includes(Number(category.id_category)));
    });
  }
}
