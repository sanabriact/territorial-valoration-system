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
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { DemarcationMapComponent } from './demarcation-map.component';
import { DemarcationService } from '../../../services/demarcation/demarcation.service';
import { DemarcationMode, PolygonPoint } from '../../../models/interfaces/demarcation/demarcation';
import { Neighborhood } from '../../../models/Neighborhood';
import { Commune } from '../../../models/Commune';
import { CommuneService } from '../../../services/communes/commune.service';
import { NeighborhoodService } from '../../../services/neighborhoods/neighborhood.service';

interface NeighborhoodListEntry extends Neighborhood {
  communeName: string;
}

@Component({
  selector: 'app-demarcation',
  standalone: true,
  imports: [CommonModule, FormsModule, DemarcationMapComponent],
  templateUrl: './demarcation.component.html',
  styleUrl: './demarcation.component.scss',
  providers: [DemarcationService, CommuneService, NeighborhoodService],
})
export class DemarcationComponent implements OnInit {
  private readonly demarcationService = inject(DemarcationService);
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

    // 1. Obtener todos los puntos existentes para este barrio
    this.demarcationService.getAll().pipe(
      finalize(() => {}),
    ).subscribe({
      next: (existingAll) => {
        const toDelete = existingAll
          .filter((p) => Number(p.id_neighborhood) === Number(neighborhood.id_neighborhood))
          .map((p) => p.id_point!)
          .filter((id) => id != null && id > 0);

        if (toDelete.length > 0) {
          // 2a. Eliminar los puntos existentes, luego crear los nuevos
          this.demarcationService.deleteMany(toDelete).pipe(
            finalize(() => {}),
          ).subscribe({
            next: () => this.createPoints(pts, neighborhood),
            error: () => {
              this.saving.set(false);
              void Swal.fire('Error', 'No se pudieron eliminar los puntos anteriores.', 'error');
            },
          });
        } else {
          // 2b. No hay puntos previos, crear directamente
          this.createPoints(pts, neighborhood);
        }
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

  private createPoints(pts: PolygonPoint[], neighborhood: NeighborhoodListEntry): void {
    const creates = pts.map((pt, idx) =>
      this.demarcationService.create({
        id_neighborhood: neighborhood.id_neighborhood,
        id_annotation: null,
        latitude: pt.latitude,
        longitude: pt.longitude,
        order: idx + 1,
        point_type: 'demarcation',
      }),
    );

    forkJoin(creates).pipe(
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
    this.demarcationService.getAll().subscribe({
      next: (all) => {
        const pts = all
          .filter((p) => Number(p.id_neighborhood) === Number(neighborhoodId))
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        this.existingPoints.set(pts);
        this.currentPoints.set(pts);
      },
      error: () => {},
    });
  }
}