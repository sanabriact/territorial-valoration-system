import Feature from 'ol/Feature';
import OlMap from 'ol/Map.js';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { boundingExtent } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import { MapCoordinates } from '../../../../models/interfaces/maps/MapLocation';
import { AnnotationMapSelection, AnnotationMarker, NeighborhoodPolygon } from '../models/annotation-map.model';

export class AnnotationMapController {
  private readonly polygonSource = new VectorSource();
  private readonly markerSource = new VectorSource();
  private readonly map: OlMap;
  private clickKey: EventsKey | null = null;
  private polygonFeature: Feature<Polygon> | null = null;
  private onSelection: ((selection: AnnotationMapSelection) => void) | null = null;
  private onAnnotationSelection: ((annotationId: number) => void) | null = null;

  constructor(target: HTMLElement, center: MapCoordinates, zoom: number) {
    this.map = new OlMap({
      target,
      controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({
          source: this.polygonSource,
          style: this.getPolygonStyle(),
          zIndex: 1,
        }),
        new VectorLayer({
          source: this.markerSource,
          style: (feature) => this.getMarkerStyle(
            feature.get('label') ?? '',
            Boolean(feature.get('selected')),
          ),
          zIndex: 2,
        }),
      ],
      view: new View({
        center: fromLonLat([center.longitude, center.latitude]),
        zoom,
      }),
    });

    this.clickKey = this.map.on('click', (event) => {
      const selectedAnnotation = this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const annotationId = feature.get('annotationId');
        return typeof annotationId === 'number' ? annotationId : null;
      });

      if (selectedAnnotation) {
        this.onAnnotationSelection?.(selectedAnnotation);
        return;
      }

      const [longitude, latitude] = toLonLat(event.coordinate);
      const insidePolygon = this.polygonFeature
        ? this.polygonFeature.getGeometry()?.intersectsCoordinate(event.coordinate) ?? false
        : false;

      this.setSelectedMarker({ latitude, longitude });
      this.onSelection?.({ latitude, longitude, insidePolygon });
    }) as EventsKey;

    setTimeout(() => this.map.updateSize(), 0);
    setTimeout(() => this.map.updateSize(), 250);
  }

  onLocationSelected(callback: (selection: AnnotationMapSelection) => void): void {
    this.onSelection = callback;
  }

  onAnnotationSelected(callback: (annotationId: number) => void): void {
    this.onAnnotationSelection = callback;
  }

  setPolygon(polygon: NeighborhoodPolygon | null): void {
    this.polygonSource.clear();
    this.polygonFeature = null;

    if (!polygon || polygon.points.length < 3) return;

    const coordinates = polygon.points.map((point) => fromLonLat([point.longitude, point.latitude]));
    this.polygonFeature = new Feature({
      geometry: new Polygon([[...coordinates, coordinates[0]]]),
      name: polygon.name,
    });
    this.polygonSource.addFeature(this.polygonFeature);

    this.map.updateSize();
    this.map.getView().fit(boundingExtent(coordinates), {
      padding: [70, 70, 70, 70],
      duration: 350,
      maxZoom: 15,
    });

    setTimeout(() => {
      this.map.updateSize();
      this.map.getView().fit(boundingExtent(coordinates), {
        padding: [70, 70, 70, 70],
        duration: 0,
        maxZoom: 15,
      });
    }, 100);
  }

  setSavedMarkers(markers: AnnotationMarker[]): void {
    const selected = this.markerSource.getFeatures().find((feature) => feature.get('label') === 'selected');
    this.markerSource.clear();
    if (selected) this.markerSource.addFeature(selected);

    markers.forEach((marker, index) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
        label: marker.id ? '' : String(index + 1),
        annotationId: marker.id,
        status: marker.status,
        selected: marker.selected,
      });
      this.markerSource.addFeature(feature);
    });
  }

  destroy(): void {
    if (this.clickKey) unByKey(this.clickKey);
    this.polygonSource.clear();
    this.markerSource.clear();
    this.map.setTarget(undefined as any);
  }

  private setSelectedMarker(marker: AnnotationMarker): void {
    this.markerSource.getFeatures()
      .filter((feature) => feature.get('label') === 'selected')
      .forEach((feature) => this.markerSource.removeFeature(feature));

    this.markerSource.addFeature(new Feature({
      geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
      label: 'selected',
    }));
  }

  private getPolygonStyle(): Style {
    return new Style({
      fill: new Fill({ color: 'rgba(37, 99, 235, 0.14)' }),
      stroke: new Stroke({ color: '#2563eb', width: 2.5 }),
    });
  }

  private getMarkerStyle(label: string, markerSelected = false): Style {
    const selected = label === 'selected';
    const annotationSelected = label === '';
    const annotationColor = markerSelected ? '#2563eb' : '#f59e0b';

    return new Style({
      image: new CircleStyle({
        radius: selected ? 13 : annotationSelected ? markerSelected ? 13 : 11 : 9,
        fill: new Fill({ color: selected ? '#2563eb' : annotationSelected ? annotationColor : '#10b981' }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
      text: selected ? undefined : new Text({
        text: label,
        fill: new Fill({ color: '#ffffff' }),
        font: '700 11px Inter, Arial, sans-serif',
      }),
    });
  }
}
