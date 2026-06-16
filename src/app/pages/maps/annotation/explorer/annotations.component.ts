import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Category } from '../../../../models/Category';
import { Commune } from '../../../../models/Commune';
import { Neighborhood } from '../../../../models/Neighborhood';
import { Point } from '../../../../models/Point';
import { categoryMatchesSelection, getFirstMatchingCategory } from '../../../../utils/category-image-url';
import { AnnotationDetailPanelComponent } from './components/annotation-detail-panel/annotation-detail-panel.component';
import { AnnotationFilterPanelComponent } from './components/annotation-filter-panel/annotation-filter-panel.component';
import { AnnotationsMapComponent } from './components/annotations-map/annotations-map.component';
import { AnnotationExplorerDataService } from './data-access/annotation-explorer-data.service';
import { AnnotationExplorerItem, AnnotationMapMarker } from './models/annotation-explorer.model';
import {
  buildAnnotationItems,
  buildCategoryTree,
  getCategoryColor,
  getCategoryMarkerImage,
  getNeighborhoodPolygons,
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
  private readonly explorerData = inject(AnnotationExplorerDataService);

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

  readonly territoryFilteredItems = computed(() => {
    const selectedCommuneId = this.selectedCommuneId();
    const selectedNeighborhoodId = this.selectedNeighborhoodId();
    const query = this.searchQuery().trim().toLowerCase();

    return this.items().filter((item) => {
      const matchesCommune = selectedCommuneId === null || Number(item.communeId) === Number(selectedCommuneId);
      const matchesNeighborhood =
        selectedNeighborhoodId === null || Number(item.annotation.id_neighborhood) === Number(selectedNeighborhoodId);
      const matchesQuery = !query || item.annotation.description.toLowerCase().includes(query);
      return matchesCommune && matchesNeighborhood && matchesQuery;
    });
  });

  readonly filteredItems = computed(() => {
    const selectedCategoryIds = this.selectedCategoryIds();

    return this.territoryFilteredItems().filter((item) => {
      const matchesCategory = selectedCategoryIds.length === 0 || this.matchesSelectedCategories(item, selectedCategoryIds);
      return matchesCategory;
    });
  });

  readonly categoryTree = computed(() => buildCategoryTree(this.categories(), this.territoryFilteredItems()));

  readonly markers = computed<AnnotationMapMarker[]>(() =>
    this.filteredItems().map((item) => {
      const markerCategory = this.getMarkerCategory(item, this.selectedCategoryIds());
      return {
        id: item.annotation.id_annotation,
        latitude: Number(item.annotation.latitude),
        longitude: Number(item.annotation.longitude),
        color: getCategoryColor(markerCategory ? Number(markerCategory.id_category) : null),
        label: String(item.categories.length || ''),
        imageUrl: getCategoryMarkerImage(markerCategory),
      };
    }),
  );

  readonly polygonNeighborhoods = computed(() => {
    const selectedNeighborhoodId = this.selectedNeighborhoodId();
    if (selectedNeighborhoodId !== null) {
      return this.neighborhoods().filter((neighborhood) =>
        Number(neighborhood.id_neighborhood) === Number(selectedNeighborhoodId),
      );
    }

    return this.filteredNeighborhoods();
  });

  readonly polygons = computed(() =>
    getNeighborhoodPolygons(this.polygonNeighborhoods(), this.points(), this.selectedNeighborhoodId()),
  );

  readonly selectedItem = computed(() =>
    this.filteredItems().find((item) => Number(item.annotation.id_annotation) === Number(this.selectedAnnotationId())) ?? null,
  );

  ngOnInit(): void {
    this.loadData();
  }

  onCommuneChange(value: number | null): void {
    this.selectedCommuneId.set(this.toOptionalNumber(value));
    this.selectedNeighborhoodId.set(null);
    this.selectedAnnotationId.set(null);
  }

  onNeighborhoodChange(value: number | null): void {
    const neighborhoodId = this.toOptionalNumber(value);
    this.selectedNeighborhoodId.set(neighborhoodId);
    this.selectedAnnotationId.set(null);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.selectedAnnotationId.set(null);
  }

  toggleCategory(categoryId: number): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(Number(categoryId)) ? ids.filter((id) => id !== Number(categoryId)) : [...ids, Number(categoryId)],
    );
    this.selectedAnnotationId.set(null);
  }

  clearFilters(): void {
    this.selectedCategoryIds.set([]);
    this.selectedCommuneId.set(null);
    this.selectedNeighborhoodId.set(null);
    this.searchQuery.set('');
    this.selectedAnnotationId.set(null);
  }

  selectAnnotation(annotationId: number): void {
    this.selectedAnnotationId.set(annotationId);
  }

  private loadData(): void {
    this.loading.set(true);
    this.explorerData.loadExplorerData()
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
    return categoryMatchesSelection(this.categories(), item.categories, selectedCategoryIds);
  }

  private getMarkerCategory(item: AnnotationExplorerItem, selectedCategoryIds: number[]): Category | null {
    return getFirstMatchingCategory(this.categories(), item.categories, selectedCategoryIds);
  }

  private toOptionalNumber(value: number | string | null): number | null {
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
