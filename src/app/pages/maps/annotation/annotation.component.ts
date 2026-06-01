import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Category } from '../../../models/Category';
import { Commune } from '../../../models/Commune';
import { Entity } from '../../../models/Entity';
import { Neighborhood } from '../../../models/Neighborhood';
import { DemarcationPoint } from '../../../models/interfaces/demarcation/demarcation';
import { AnnotationService } from '../../../services/annotations/annotation.service';
import { CategoryService } from '../../../services/categories/category.service';
import { CommuneService } from '../../../services/communes/commune.service';
import { DemarcationService } from '../../../services/demarcation/demarcation.service';
import { EntityService } from '../../../services/entities/entities.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';
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
  providers: [DemarcationService],
})
export class AnnotationComponent implements OnInit {
  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly categoryService = inject(CategoryService);
  private readonly entityService = inject(EntityService);
  private readonly demarcationService = inject(DemarcationService);
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
  readonly demarcationPoints = signal<DemarcationPoint[]>([]);
  readonly selectedLocation = signal<AnnotationMapSelection | null>(null);
  readonly savedMarkers = signal<AnnotationMarker[]>([]);

  readonly filteredNeighborhoods = computed(() => {
    const communeId = this.selectedCommuneId();
    return this.neighborhoods().filter((neighborhood) =>
      communeId === null ? true : neighborhood.id_commune === communeId,
    );
  });

  readonly selectedNeighborhood = computed(() => {
    const neighborhoodId = this.selectedNeighborhoodId();
    return this.neighborhoods().find((item) => item.id_neighborhood === neighborhoodId) ?? null;
  });

  readonly selectedPolygon = computed<NeighborhoodPolygon | null>(() => {
    const neighborhood = this.selectedNeighborhood();
    const points = this.getOrderedPolygonPoints(neighborhood?.id_neighborhood ?? null);

    if (!neighborhood || points.length < 3) return null;
    return { name: neighborhood.name, points };
  });

  readonly communePolygons = computed<NeighborhoodPolygon[]>(() => {
    const communeId = this.selectedCommuneId();
    const neighborhoods = this.neighborhoods().filter((neighborhood) =>
      communeId === null ? true : neighborhood.id_commune === communeId,
    );

    return neighborhoods
      .map((neighborhood) => ({
        name: neighborhood.name,
        points: this.getOrderedPolygonPoints(neighborhood.id_neighborhood),
      }))
      .filter((polygon) => polygon.points.length >= 3);
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  onCommuneChange(value: string): void {
    const communeId = value ? Number(value) : null;
    this.selectedCommuneId.set(communeId);
    const firstNeighborhood = this.neighborhoods().find((item) => item.id_commune === communeId);
    this.selectNeighborhood(firstNeighborhood?.id_neighborhood ?? null);
  }

  selectNeighborhood(value: string | number | null): void {
    const neighborhoodId = value ? Number(value) : null;
    this.selectedNeighborhoodId.set(neighborhoodId);
    this.selectedLocation.set(null);

    if (!neighborhoodId) {
      return;
    }
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
        const annotationId = annotation.id_annotation;
        const requests = [
          ...value.categoryIds.map((id_category) =>
            this.annotationService.assignCategory({ id_annotation: annotationId, id_category }),
          ),
          ...value.entityIds.map((id_entity) =>
            this.annotationService.assignInterestedParty({ id_annotation: annotationId, id_entity }),
          ),
          ...value.files.map((file) => this.annotationService.uploadEvidence(annotationId, file)),
        ];

        return requests.length > 0 ? forkJoin(requests).pipe(switchMap(() => of(annotation))) : of(annotation);
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
      error: () => void Swal.fire('Error', 'No se pudo guardar la anotacion.', 'error'),
    });
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      communes: this.communeService.getAll(),
      neighborhoods: this.neighborhoodService.getAll(),
      categories: this.categoryService.getAll(),
      entities: this.entityService.getAll(),
      demarcationPoints: this.demarcationService.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods, categories, entities, demarcationPoints }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
          this.categories.set(categories);
          this.entities.set(entities);
          this.demarcationPoints.set(demarcationPoints);

          const firstCommune = communes[0] ?? null;
          this.selectedCommuneId.set(firstCommune?.id_commune ?? null);
          const firstNeighborhood = neighborhoods.find((item) => item.id_commune === firstCommune?.id_commune) ?? neighborhoods[0];
          this.selectNeighborhood(firstNeighborhood?.id_neighborhood ?? null);
        },
        error: () => void Swal.fire('Error', 'No se pudo cargar la informacion inicial.', 'error'),
      });
  }

  private getOrderedPolygonPoints(neighborhoodId: number | null): { latitude: number; longitude: number }[] {
    if (!neighborhoodId) return [];

    return this.demarcationPoints()
      .filter((point) => Number(point.id_neighborhood) === Number(neighborhoodId))
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) }));
  }
}
