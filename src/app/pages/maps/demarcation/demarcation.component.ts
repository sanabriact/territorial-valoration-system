import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { DemarcationMapComponent } from './demarcation-map.component';
import { DemarcationMode, PolygonPoint } from '../../../models/interfaces/demarcation/demarcation';
import { Neighborhood } from '../../../models/Neighborhood';
import { Commune } from '../../../models/Commune';
import { Point } from '../../../models/Point';
import { CommuneService } from '../../../services/communes/commune.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';
import { PointService } from '../../../services/points/point.service';

interface NeighborhoodListEntry extends Neighborhood {
  communeName: string;
}

@Component({
  selector: 'app-demarcation',
  standalone: true,
  imports: [CommonModule, FormsModule, DemarcationMapComponent],
  templateUrl: './demarcation.component.html',
  styleUrl: './demarcation.component.scss',
  providers: [CommuneService, NeighborhoodService],
})
export class DemarcationComponent implements OnInit {
  private readonly pointService = inject(PointService);
  private readonly communeApi = inject(CommuneService);
  private readonly neighborhoodApi = inject(NeighborhoodService);

  /** Referencia al mapa hijo para llamar clearAll() directamente */
  private readonly demMap = viewChild<DemarcationMapComponent>('demMap');

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly communes = signal<Commune[]>([]);
  readonly neighborhoods = signal<Neighborhood[]>([]);
  readonly selectedCommuneId = signal<number | null>(null);
  readonly selectedNeighborhood = signal<NeighborhoodListEntry | null>(null);
  readonly searchQuery = signal('');
  readonly currentPoints = signal<PolygonPoint[]>([]);
  readonly existingPoints = signal<PolygonPoint[]>([]);
  readonly mode = signal<DemarcationMode>('pan');

  readonly filteredNeighborhoods = computed<NeighborhoodListEntry[]>(() => {
    const communeMap = new Map(this.communes().map((c) => [c.id_commune, c.name]));
    const query = this.searchQuery().trim().toLowerCase();
    const communeFilter = this.selectedCommuneId();

    return this.neighborhoods()
      .filter((n) => {
        const communeName = communeMap.get(n.id_commune) ?? '';
        const matchesCommune = communeFilter === null || n.id_commune === communeFilter;
        const matchesQuery =
          !query ||
          [n.name, communeName].some((v) => v.toLowerCase().includes(query));
        return matchesCommune && matchesQuery;
      })
      .map((n) => ({
        ...n,
        communeName: communeMap.get(n.id_commune) ?? '',
      }));
  });

  readonly pointCount = computed(() => this.currentPoints().length);

  ngOnInit(): void {
    this.loadInitialData();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onCommuneFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCommuneId.set(val ? Number(val) : null);
  }

  selectNeighborhood(neighborhood: NeighborhoodListEntry): void {
    this.selectedNeighborhood.set(neighborhood);
    this.currentPoints.set([]);
    this.existingPoints.set([]);
    this.mode.set('pan');
    this.loadNeighborhoodPoints(neighborhood.id_neighborhood);
  }

  setMode(mode: DemarcationMode): void {
    this.mode.set(mode);
  }

  onPointsChanged(points: PolygonPoint[]): void {
    this.currentPoints.set(points);
  }

  clearAll(): void {
    this.demMap()?.clearAll();
    this.currentPoints.set([]);
  }

  savePolygon(): void {
    const neighborhood = this.selectedNeighborhood();
    if (!neighborhood) return;

    const pts = this.currentPoints();

    if (pts.length < 3) {
      void Swal.fire('Polígono incompleto', 'Agrega al menos 3 puntos para demarcar el barrio.', 'warning');
      return;
    }

    this.saving.set(true);

    this.pointService.getByNeighborhood(neighborhood.id_neighborhood).subscribe({
      next: (existingPoints) => {
        this.persistPoints(existingPoints, pts, neighborhood);
      },
      error: () => {
        this.saving.set(false);
        void Swal.fire('Error', 'No se pudieron verificar los puntos existentes.', 'error');
      },
    });
  }

  cancel(): void {
    this.selectedNeighborhood.set(null);
    this.currentPoints.set([]);
    this.existingPoints.set([]);
    this.mode.set('pan');
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private persistPoints(existingPoints: Point[], points: PolygonPoint[], neighborhood: NeighborhoodListEntry): void {
    const requests = this.buildPointRequests(existingPoints, points, neighborhood);

    forkJoin(requests).pipe(
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        void Swal.fire(
          'Guardado',
          `El polígono fue asociado al barrio ${neighborhood.name} correctamente.`,
          'success',
        );
        this.loadNeighborhoodPoints(neighborhood.id_neighborhood);
      },
      error: () => {
        void Swal.fire('Error', 'No se pudo guardar el polígono.', 'error');
      },
    });
  }

  private buildPointRequests(
    existingPoints: Point[],
    points: PolygonPoint[],
    neighborhood: NeighborhoodListEntry,
  ): Observable<unknown>[] {
    const sortedExistingPoints = existingPoints.slice().sort((a, b) => a.order - b.order);
    const upserts = points.map((point, index) => {
      const existingPoint = sortedExistingPoints[index];
      const request = {
        id_neighborhood: neighborhood.id_neighborhood,
        id_annotation: existingPoint?.id_annotation ?? null,
        latitude: point.latitude,
        longitude: point.longitude,
        order: index + 1,
        point_type: existingPoint?.point_type ?? 'demarcation',
      };

      return existingPoint?.id_point
        ? this.pointService.update(existingPoint.id_point, request)
        : this.pointService.create(request);
    });

    const deletes = sortedExistingPoints
      .slice(points.length)
      .map((point) => point.id_point)
      .filter((id): id is number => id != null && id > 0)
      .map((id) => this.pointService.delete(id));

    return [...upserts, ...deletes];
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      communes: this.communeApi.getAll(),
      neighborhoods: this.neighborhoodApi.getAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ communes, neighborhoods }) => {
          this.communes.set(communes);
          this.neighborhoods.set(neighborhoods);
        },
        error: () => void Swal.fire('Error', 'No se pudo cargar la información.', 'error'),
      });
  }

  private loadNeighborhoodPoints(neighborhoodId: number): void {
    this.pointService.getByNeighborhood(neighborhoodId).subscribe({
      next: (points) => {
        const pts = points
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        this.existingPoints.set(pts);
        this.currentPoints.set(pts);
      },
      error: () => {},
    });
  }
}
