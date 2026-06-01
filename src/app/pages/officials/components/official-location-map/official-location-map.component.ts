import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Feature from 'ol/Feature';
import OlMap from 'ol/Map.js';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';

export interface OfficialLocationSelection {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-official-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './official-location-map.component.html',
  styleUrl: './official-location-map.component.scss',
})
export class OfficialLocationMapComponent implements AfterViewInit, OnDestroy {
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly locationSelected = output<OfficialLocationSelection>();

  private readonly markerSource = new VectorSource();
  private map: OlMap | null = null;
  private clickKey: EventsKey | null = null;

  constructor() {
    effect(() => {
      this.renderMarker(this.latitude(), this.longitude(), true);
    });
  }

  ngAfterViewInit(): void {
    const markerLayer = new VectorLayer({
      source: this.markerSource,
      style: this.getMarkerStyle(),
      zIndex: 2,
    });

    this.map = new OlMap({
      target: this.mapTarget().nativeElement,
      controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([this.longitude(), this.latitude()]),
        zoom: 14,
      }),
    });

    this.clickKey = this.map.on('click', (event) => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      this.locationSelected.emit({ latitude, longitude });
      this.renderMarker(latitude, longitude, false);
    }) as EventsKey;

    this.renderMarker(this.latitude(), this.longitude(), true);
    setTimeout(() => this.map?.updateSize(), 0);
    setTimeout(() => this.map?.updateSize(), 250);
  }

  ngOnDestroy(): void {
    if (this.clickKey) unByKey(this.clickKey);
    this.markerSource.clear();
    this.map?.setTarget(undefined as any);
    this.map = null;
  }

  private renderMarker(latitude: number, longitude: number, animate: boolean): void {
    if (!this.hasValidCoordinates(latitude, longitude)) return;

    const coordinate = fromLonLat([longitude, latitude]);
    this.markerSource.clear();
    this.markerSource.addFeature(new Feature({ geometry: new Point(coordinate) }));

    const view = this.map?.getView();
    if (!view) return;

    if (animate) {
      view.animate({ center: coordinate, duration: 250 });
    } else {
      view.setCenter(coordinate);
    }
  }

  private hasValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  private getMarkerStyle(): Style {
    return new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: '#2563eb' }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
    });
  }
}
