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
  readonly communePolygons = input<NeighborhoodPolygon[]>([]);
  readonly savedMarkers = input<AnnotationMarker[]>([]);
  readonly locationSelected = output<AnnotationMapSelection>();

  private controller: AnnotationMapController | null = null;

  constructor() {
    effect(() => this.controller?.setCommunePolygons(this.communePolygons()));
    effect(() => this.controller?.setPolygon(this.polygon()));
    effect(() => this.controller?.setSavedMarkers(this.savedMarkers()));
  }

  ngAfterViewInit(): void {
    this.controller = new AnnotationMapController(
      this.mapTarget().nativeElement,
      this.openMaps.manizalesCenter,
      13,
    );
    this.controller.onLocationSelected((selection) => this.locationSelected.emit(selection));
    this.controller.setCommunePolygons(this.communePolygons());
    this.controller.setPolygon(this.polygon());
    this.controller.setSavedMarkers(this.savedMarkers());
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
    this.controller = null;
  }
}
