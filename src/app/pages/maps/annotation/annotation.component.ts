import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Category } from '../../../models/Category';
import { Commune } from '../../../models/Commune';
import { Entity } from '../../../models/Entity';
import { Neighborhood } from '../../../models/Neighborhood';
import { Point } from '../../../models/Point';
import { AnnotationService } from '../../../services/annotations/annotation.service';
import { CategoryService } from '../../../services/categories/category.service';
import { CommuneService } from '../../../services/communes/commune.service';
import { EntityService } from '../../../services/entities/entities.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';
import { PointService } from '../../../services/points/point.service';
import { AnnotationFormComponent } from './components/annotation-form/annotation-form.component';
import { AnnotationMapComponent } from './components/annotation-map/annotation-map.component';
import {
  AnnotationFormValue,
  AnnotationMapSelection,
  AnnotationMarker,
  NeighborhoodPolygon,
} from './models/annotation-map.model';

@Component({
  selector: 'app-annotation',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnotationMapComponent, AnnotationFormComponent],
  templateUrl: './annotation.component.html',
  styleUrl: './annotation.component.scss',
})
export class AnnotationComponent implements OnInit {
  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly categoryService = inject(CategoryService);
  private readonly entityService = inject(EntityService);
  private readonly pointService = inject(PointService);
  private readonly annotationService = inject(AnnotationService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly entities = signal<Entity[]>([]);
  readonly selectedCommuneId = signal<number | null>(null);
  readonly selectedNeighborhoodId = signal<number | null>(null);
  readonly selectedCategoryFilter = signal<number | null>(null);
  readonly points = signal<Point[]>([]);
  readonly selectedLocation = signal<AnnotationMapSelection | null>(null);
  readonly savedMarkers = signal<AnnotationMarker[]>([]);

  readonly filteredNeighborhoods = computed(() => {
    const communeId = this.selectedCommuneId();
    return this.neighborhoods().filter((neighborhood) =>
      communeId === null ? true : Number(neighborhood.id_commune) === Number(communeId),
    );
  });

  readonly selectedNeighborhood = computed(() => {
    const neighborhoodId = this.selectedNeighborhoodId();
    return this.neighborhoods().find((item) =>
      Number(item.id_neighborhood) === Number(neighborhoodId),
    ) ?? null;
  });

  readonly selectedPolygon = computed<NeighborhoodPolygon | null>(() => {
    const neighborhood = this.selectedNeighborhood();
    const neighborhoodId = this.selectedNeighborhoodId();
    const points = this.toOrderedCoordinates(
      this.points().filter((point) =>
        Number(point.id_neighborhood) === Number(neighborhoodId) &&
        String(point.point_type).trim().toLowerCase() === 'demarcation',
      ),
    );

    if (!neighborhood || points.length < 3) return null;
    return {
      id: Number(neighborhood.id_neighborhood),
      version: `${neighborhood.id_neighborhood}:${points.map((point) => `${point.latitude},${point.longitude}`).join('|')}`,
      name: neighborhood.name,
      points,
    };
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  onCommuneChange(value: string): void {
    const communeId = value ? Number(value) : null;
    this.selectedCommuneId.set(communeId);
    const firstNeighborhood = this.neighborhoods().find((item) =>
      Number(item.id_commune) === Number(communeId),
    );
    this.selectNeighborhood(firstNeighborhood?.id_neighborhood ?? null);
  }

  selectNeighborhood(value: string | number | null): void {
    const neighborhoodId = value ? Number(value) : null;
    this.selectedNeighborhoodId.set(neighborhoodId);
    this.selectedLocation.set(null);
  }

  async onMapSelection(selection: AnnotationMapSelection): Promise<void> {
    if (selection.insidePolygon) {
      this.selectedLocation.set(selection);
      return;
    }

    const result = await Swal.fire({
      title: 'Punto fuera del barrio',
      text: 'El punto cae fuera del barrio demarcado. Deseas continuar y guardar sin barrio?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Elegir otro punto',
    });

    if (result.isConfirmed) {
      this.selectedLocation.set({ ...selection, insidePolygon: false });
    }
  }

  closeForm(): void {
    this.selectedLocation.set(null);
  }

  saveAnnotation(value: AnnotationFormValue): void {
    const location = this.selectedLocation();
    if (!location) return;

    const neighborhoodId = location.insidePolygon ? this.selectedNeighborhoodId() : null;
    this.saving.set(true);

    this.annotationService.create({
      id_neighborhood: neighborhoodId,
      id_citizen: 1,
      description: value.description,
      latitude: value.latitude,
      longitude: value.longitude,
      status: 'active',
    }).pipe(
      switchMap((annotation) => {
        return this.saveAnnotationRelations(annotation.id_annotation, value).pipe(
          switchMap(() => of(annotation)),
        );
      }),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (annotation) => {
        this.savedMarkers.update((markers) => [
          ...markers,
          { latitude: annotation.latitude, longitude: annotation.longitude },
        ]);
        this.selectedLocation.set(null);
        void Swal.fire('Guardado', 'La anotacion fue registrada correctamente.', 'success');
      },
      error: (error) => void Swal.fire('Error', this.getSaveErrorMessage(error), 'error'),
    });
  }

  private saveAnnotationRelations(annotationId: number, value: AnnotationFormValue) {
    return forkJoin({
      annotationCategories: this.annotationService
        .getAnnotationCategories()
        .pipe(catchError(() => of([]))),
      interestedParties: this.annotationService
        .getInterestedParties()
        .pipe(catchError(() => of([]))),
    }).pipe(
      switchMap(({ annotationCategories, interestedParties }) => {
        const categoryRequests = value.categoryIds
          .filter((id_category) =>
            !annotationCategories.some(
              (item) =>
                Number(item.id_annotation) === Number(annotationId) &&
                Number(item.id_category) === Number(id_category),
            ),
          )
          .map((id_category) =>
            this.annotationService.assignCategory({ id_annotation: annotationId, id_category }),
          );

        const interestedPartyRequests = value.entityIds
          .filter((id_entity) =>
            !interestedParties.some(
              (item) =>
                Number(item.id_annotation) === Number(annotationId) &&
                Number(item.id_entity) === Number(id_entity),
            ),
          )
          .map((id_entity) =>
            this.annotationService.assignInterestedParty({ id_annotation: annotationId, id_entity }),
          );

        const evidenceRequests = value.files.map((file) =>
          this.annotationService.uploadEvidence(annotationId, file),
        );

        const requests = [...categoryRequests, ...interestedPartyRequests, ...evidenceRequests];
        return requests.length > 0 ? forkJoin(requests) : of([]);
      }),
    );
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      communes: this.communeService.getAll(),
      neighborhoods: this.neighborhoodService.getAll(),
      categories: this.categoryService.getAll(),
      entities: this.entityService.getAll(),
      points: this.pointService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods, categories, entities, points }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
          this.categories.set(categories);
          this.entities.set(entities);
          this.points.set(points);

          const firstCommune = communes[0] ?? null;
          this.selectedCommuneId.set(firstCommune?.id_commune ?? null);
          const firstNeighborhood = neighborhoods.find((item) =>
            Number(item.id_commune) === Number(firstCommune?.id_commune),
          ) ?? neighborhoods[0];
          this.selectNeighborhood(firstNeighborhood?.id_neighborhood ?? null);
        },
        error: () => void Swal.fire('Error', 'No se pudo cargar la informacion inicial.', 'error'),
      });
  }

  private toOrderedCoordinates(points: Point[]): { latitude: number; longitude: number }[] {
    return points
      .slice()
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  }

  private getSaveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error === 'string'
          ? error.error
          : error.error?.message ?? error.error?.error ?? error.message;

      return backendMessage || `No se pudo guardar la anotacion. Codigo HTTP: ${error.status}`;
    }

    return 'No se pudo guardar la anotacion.';
  }
}
