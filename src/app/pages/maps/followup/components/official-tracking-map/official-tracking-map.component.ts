import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenMapsService } from '../../../../../services/maps/open-maps.service';
import { OfficialTrackingMarker } from '../../../../../models/interfaces/maps/OficcialTrackingMarker';
import { OfficialTrackingMapController } from '../../controllers/official-tracking-map.controller';

@Component({
  selector: 'app-official-tracking-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './official-tracking-map.component.html',
  styleUrl: './official-tracking-map.component.scss',
})
export class OfficialTrackingMapComponent implements AfterViewInit, OnDestroy {
  private readonly openMapsService = inject(OpenMapsService);
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly markers = input<OfficialTrackingMarker[]>([]);

  private controller: OfficialTrackingMapController | null = null;

  constructor() {
    effect(() => {
      const markers = this.markers();
      this.controller?.setMarkers(markers);
    });
  }

  ngAfterViewInit(): void {
    this.controller = new OfficialTrackingMapController(
      this.mapTarget().nativeElement,
      this.openMapsService.manizalesCenter,
      13,
    );
    this.controller.setMarkers(this.markers());
  }

  ngOnDestroy(): void {
    this.controller?.destroy();
    this.controller = null;
  }
}
