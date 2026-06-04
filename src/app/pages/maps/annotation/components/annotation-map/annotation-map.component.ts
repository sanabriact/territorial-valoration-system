import { AfterViewInit, Component, ElementRef, OnDestroy, effect, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenMapsService } from '../../../../../services/maps/open-maps.service';
import { AnnotationMapSelection, AnnotationMarker, NeighborhoodPolygon } from '../../models/annotation-map.model';
import { AnnotationMapController } from '../../controllers/annotation-map.controller';

@Component({
  selector: 'app-annotation-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annotation-map.component.html',
  styleUrl: './annotation-map.component.scss',
})
export class AnnotationMapComponent implements AfterViewInit, OnDestroy {
  private readonly openMaps = inject(OpenMapsService);
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly polygon = input<NeighborhoodPolygon | null>(null);
  readonly savedMarkers = input<AnnotationMarker[]>([]);
  readonly freeSelectionEnabled = input(true);
  readonly locationSelected = output<AnnotationMapSelection>();
  readonly annotationSelected = output<number>();

  private controller: AnnotationMapController | null = null;
  private renderedPolygonVersion = '';

  constructor() {
    effect(() => {
      const polygon = this.polygon();
      const version = polygon?.version ?? '';

      if (!this.controller || version === this.renderedPolygonVersion) return;

      this.renderedPolygonVersion = version;
      this.controller.setPolygon(polygon);
    });
    effect(() => this.controller?.setSavedMarkers(this.savedMarkers()));
    effect(() => this.controller?.setFreeSelectionEnabled(this.freeSelectionEnabled()));
  }

  ngAfterViewInit(): void {
    this.controller = new AnnotationMapController(
      this.mapTarget().nativeElement,
      this.openMaps.manizalesCenter,
      13,
    );
    this.controller.onLocationSelected((selection) => this.locationSelected.emit(selection));
    this.controller.onAnnotationSelected((annotationId) => this.annotationSelected.emit(annotationId));
    this.controller.setFreeSelectionEnabled(this.freeSelectionEnabled());
    this.renderedPolygonVersion = this.polygon()?.version ?? '';
    this.controller.setPolygon(this.polygon());
    this.controller.setSavedMarkers(this.savedMarkers());
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
    this.controller = null;
  }
}
