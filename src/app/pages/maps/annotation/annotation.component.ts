import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Annotation } from '../../../models/Annotation';
import { Category } from '../../../models/Category';
import { Commune } from '../../../models/Commune';
import { Entity } from '../../../models/Entity';
import { Evidence } from '../../../models/Evidence';
import { Neighborhood } from '../../../models/Neighborhood';
import { Point } from '../../../models/Point';
import { Vote } from '../../../models/Vote';
import { AnnotationService } from '../../../services/annotations/annotation.service';
import { CategoryService } from '../../../services/categories/category.service';
import { CurrentCitizenService } from '../../../services/citizens/current-citizen.service';
import { CommuneService } from '../../../services/communes/commune.service';
import { EntityService } from '../../../services/entities/entities.service';
import { EvidenceService } from '../../../services/evidences/evidence.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';
import { PointService } from '../../../services/points/point.service';
import { VoteService } from '../../../services/votes/vote.service';
import { resolveBackendFileUrl } from '../../../utils/file-url';
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
  private readonly evidenceService = inject(EvidenceService);
  private readonly voteService = inject(VoteService);
  private readonly currentCitizenService = inject(CurrentCitizenService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly detailLoading = signal(false);
  readonly voteSaving = signal(false);
  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly entities = signal<Entity[]>([]);
  readonly annotations = signal<Annotation[]>([]);
  readonly annotationCategories = signal<{ id_annotation: number; id_category: number }[]>([]);
  readonly selectedCommuneId = signal<number | null>(null);
  readonly selectedNeighborhoodId = signal<number | null>(null);
  readonly selectedCategoryFilter = signal<number | null>(null);
  readonly points = signal<Point[]>([]);
  readonly selectedLocation = signal<AnnotationMapSelection | null>(null);
  readonly selectedAnnotationId = signal<number | null>(null);
  readonly selectedAnnotationEvidences = signal<Evidence[]>([]);
  readonly selectedAnnotationVotes = signal<Vote[]>([]);
  readonly currentCitizenId = signal<number | null>(null);
  readonly existingCitizenVote = signal<Vote | null>(null);
  readonly voteStars = signal(0);
  readonly voteComment = signal('');

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

  readonly filteredAnnotations = computed(() => {
    const neighborhoodId = this.selectedNeighborhoodId();
    const categoryId = this.selectedCategoryFilter();

    return this.annotations().filter((annotation) => {
      const matchesNeighborhood = neighborhoodId === null
        ? true
        : Number(annotation.id_neighborhood) === Number(neighborhoodId);
      const matchesCategory = categoryId === null
        ? true
        : this.annotationCategories().some((item) =>
          Number(item.id_annotation) === Number(annotation.id_annotation) &&
          Number(item.id_category) === Number(categoryId),
        );

      return matchesNeighborhood && matchesCategory;
    });
  });

  readonly savedMarkers = computed<AnnotationMarker[]>(() => {
    const selectedId = this.selectedAnnotationId();

    return this.filteredAnnotations().map((annotation) => ({
      id: annotation.id_annotation,
      latitude: Number(annotation.latitude),
      longitude: Number(annotation.longitude),
      status: annotation.status,
      selected: Number(annotation.id_annotation) === Number(selectedId),
    }));
  });

  readonly selectedAnnotation = computed(() => {
    const annotationId = this.selectedAnnotationId();
    return this.annotations().find((annotation) =>
      Number(annotation.id_annotation) === Number(annotationId),
    ) ?? null;
  });

  readonly averageRating = computed(() => {
    const votes = this.selectedAnnotationVotes();
    if (!votes.length) return 0;

    const total = votes.reduce((sum, vote) => sum + Number(vote.stars), 0);
    return Math.round((total / votes.length) * 10) / 10;
  });

  readonly ratingRows = computed(() => [5, 4, 3, 2, 1].map((star) => {
    const count = this.selectedAnnotationVotes().filter((vote) => Number(vote.stars) === star).length;
    const total = this.selectedAnnotationVotes().length || 1;

    return {
      star,
      count,
      percentage: Math.round((count / total) * 100),
    };
  }));

  ngOnInit(): void {
    this.loadInitialData();
    this.currentCitizenService.getCurrentCitizenId().subscribe((id) => this.currentCitizenId.set(id));
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
    this.closeAnnotationDetail();
  }

  async onMapSelection(selection: AnnotationMapSelection): Promise<void> {
    this.closeAnnotationDetail();

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

  selectExistingAnnotation(annotationId: number): void {
    this.selectedLocation.set(null);
    this.selectedAnnotationId.set(annotationId);
    this.loadAnnotationDetail(annotationId);
  }

  closeAnnotationDetail(): void {
    this.selectedAnnotationId.set(null);
    this.selectedAnnotationEvidences.set([]);
    this.selectedAnnotationVotes.set([]);
    this.existingCitizenVote.set(null);
    this.voteStars.set(0);
    this.voteComment.set('');
  }

  setRating(stars: number): void {
    this.voteStars.set(stars);
  }

  saveVote(): void {
    const annotation = this.selectedAnnotation();
    const citizenId = this.currentCitizenId();

    if (!annotation || !citizenId) return;
    if (this.voteStars() < 1 || this.voteStars() > 5) {
      void Swal.fire('Calificacion requerida', 'Selecciona entre 1 y 5 estrellas.', 'warning');
      return;
    }

    this.voteSaving.set(true);
    this.voteService.saveCitizenVote(this.existingCitizenVote(), {
      id_annotation: annotation.id_annotation,
      id_citizen: citizenId,
      stars: this.voteStars(),
      comment: this.voteComment().trim(),
    }).pipe(
      switchMap(() => forkJoin({
        votes: this.voteService.getByAnnotation(annotation.id_annotation),
        citizenVote: this.voteService.getCitizenVote(annotation.id_annotation, citizenId),
      })),
      finalize(() => this.voteSaving.set(false)),
    ).subscribe({
      next: ({ votes, citizenVote }) => {
        this.selectedAnnotationVotes.set(votes);
        this.existingCitizenVote.set(citizenVote);
        void Swal.fire('Guardado', 'Tu calificacion fue registrada correctamente.', 'success');
      },
      error: (error) => void Swal.fire('Error', this.getSaveErrorMessage(error), 'error'),
    });
  }

  saveAnnotation(value: AnnotationFormValue): void {
    const location = this.selectedLocation();
    if (!location) return;

    const neighborhoodId = location.insidePolygon ? this.selectedNeighborhoodId() : null;
    const citizenId = this.currentCitizenId() ?? 1;
    this.saving.set(true);

    this.annotationService.create({
      id_neighborhood: neighborhoodId,
      id_citizen: citizenId,
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
        this.annotations.update((annotations) => [...annotations, annotation]);
        this.annotationCategories.update((items) => [
          ...items,
          ...value.categoryIds.map((id_category) => ({
            id_annotation: annotation.id_annotation,
            id_category,
          })),
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
      annotations: this.annotationService.getAll(),
      annotationCategories: this.annotationService.getAnnotationCategories(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods, categories, entities, points, annotations, annotationCategories }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
          this.categories.set(categories);
          this.entities.set(entities);
          this.points.set(points);
          this.annotations.set(annotations);
          this.annotationCategories.set(annotationCategories);

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

  private loadAnnotationDetail(annotationId: number): void {
    const citizenId = this.currentCitizenId() ?? 1;

    this.detailLoading.set(true);
    forkJoin({
      evidences: this.evidenceService.getByAnnotation(annotationId).pipe(catchError(() => of([]))),
      votes: this.voteService.getByAnnotation(annotationId).pipe(catchError(() => of([]))),
      citizenVote: this.voteService.getCitizenVote(annotationId, citizenId).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe(({ evidences, votes, citizenVote }) => {
        this.selectedAnnotationEvidences.set(evidences);
        this.selectedAnnotationVotes.set(votes);
        this.existingCitizenVote.set(citizenVote);
        this.voteStars.set(citizenVote?.stars ?? 0);
        this.voteComment.set(citizenVote?.comment ?? '');
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

  getAnnotationCategoryLabel(annotationId: number): string {
    const categoryId = this.annotationCategories().find((item) =>
      Number(item.id_annotation) === Number(annotationId),
    )?.id_category;
    return this.categories().find((category) =>
      Number(category.id_category) === Number(categoryId),
    )?.name ?? 'Sin categoria';
  }

  getNeighborhoodLabel(neighborhoodId: number | null): string {
    if (!neighborhoodId) return 'Sin barrio asociado';
    return this.neighborhoods().find((neighborhood) =>
      Number(neighborhood.id_neighborhood) === Number(neighborhoodId),
    )?.name ?? 'Barrio no encontrado';
  }

  getEvidenceUrl(evidence: Evidence): string {
    return resolveBackendFileUrl(evidence.file_url);
  }
}
