import { AfterViewInit, Component, ElementRef, OnDestroy, effect, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenMapsService } from '../../../../../../services/maps/open-maps.service';
import { AnnotationMapMarker, AnnotationPolygon } from '../../models/annotation-explorer.model';
import { AnnotationsMapController } from '../../controllers/annotations-map.controller';

@Component({
  selector: 'app-annotations-map',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="annotations-map" #mapTarget></div>',
  styles: [`
    :host { display: block; width: 100%; height: 100%; min-height: 650px; }
    .annotations-map { width: 100%; height: 100%; min-height: 650px; background: #dbeafe; }
  `],
})
export class AnnotationsMapComponent implements AfterViewInit, OnDestroy {
  private readonly openMaps = inject(OpenMapsService);
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly polygon = input<AnnotationPolygon | null>(null);
  readonly markers = input<AnnotationMapMarker[]>([]);
  readonly annotationSelected = output<number>();

  private controller: AnnotationsMapController | null = null;

  constructor() {
    effect(() => this.controller?.setPolygon(this.polygon()));
    effect(() => this.controller?.setMarkers(this.markers()));
  }

  ngAfterViewInit(): void {
    this.controller = new AnnotationsMapController(this.mapTarget().nativeElement, this.openMaps.manizalesCenter, 13);
    this.controller.onAnnotationSelected((annotationId) => this.annotationSelected.emit(annotationId));
    this.controller.setPolygon(this.polygon());
    this.controller.setMarkers(this.markers());
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
    this.controller = null;
  }
}
