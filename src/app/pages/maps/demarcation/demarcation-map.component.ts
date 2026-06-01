import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenMapsService } from '../../../services/maps/open-maps.service';
import { DemarcationMode, PolygonPoint } from '../../../models/interfaces/demarcation/demarcation';
import { DemarcationMapController } from '../controllers/demarcationMap.controller';

@Component({
  selector: 'app-demarcation-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demarcation-map.component.html',
  styleUrl: './demarcation-map.component.scss',
})
export class DemarcationMapComponent implements AfterViewInit, OnDestroy {
  private readonly openMapsService = inject(OpenMapsService);
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly initialPoints = input<PolygonPoint[]>([]);
  readonly mode = input<DemarcationMode>('pan');

  readonly pointsChanged = output<PolygonPoint[]>();

  readonly toastMessage = signal<string>('');

  private controller: DemarcationMapController | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Track last loaded points key to avoid duplicate loads
  private lastLoadedKey = '';

  constructor() {
    // Reacciona a cambios de modo DESPUÉS de que el controlador exista
    effect(() => {
      const m = this.mode();
      this.controller?.setMode(m);
    });

    // Reacciona a cambios en initialPoints (cuando se selecciona un barrio)
    effect(() => {
      const pts = this.initialPoints();
      const key = JSON.stringify(pts);
      if (!this.controller || key === this.lastLoadedKey) return;
      this.lastLoadedKey = key;
      this.controller.loadPoints(pts);
    });
  }

  ngAfterViewInit(): void {
    this.controller = new DemarcationMapController(
      this.mapTarget().nativeElement,
      this.openMapsService.manizalesCenter,
      13,
    );

    // Cargar puntos iniciales si ya existen al montar
    const initial = this.initialPoints();
    if (initial.length > 0) {
      this.lastLoadedKey = JSON.stringify(initial);
      this.controller.loadPoints(initial);
    }

    this.controller.onPointsChanged((pts) => {
      this.pointsChanged.emit(pts);
      this.tryShowClosedToast(pts);
    });

    this.controller.setMode(this.mode());
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.controller?.destroy();
    this.controller = null;
  }

  /** Llamado desde el padre para limpiar el mapa */
  clearAll(): void {
    this.controller?.clearPoints();
    this.lastLoadedKey = '';
  }

  private tryShowClosedToast(pts: PolygonPoint[]): void {
    if (pts.length < 4) return;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const dist = Math.hypot(first.latitude - last.latitude, first.longitude - last.longitude);
    if (dist < 0.0001) {
      this.showToast('Polígono cerrado automáticamente. Se unió el último punto con el primero.');
    }
  }

  private showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 5000);
  }
}