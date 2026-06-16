import Feature from 'ol/Feature';
import OlMap from 'ol/Map.js';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { boundingExtent } from 'ol/extent';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { MapCoordinates } from '../../../../../models/interfaces/maps/MapLocation';
import { AnnotationMapMarker, AnnotationPolygon } from '../models/annotation-explorer.model';

export class AnnotationsMapController {
  private readonly polygonSource = new VectorSource();
  private readonly markerSource = new VectorSource();
  private readonly map: OlMap;
  private clickKey: EventsKey | null = null;
  private onMarkerClick: ((annotationId: number) => void) | null = null;
  private fittedInitialPolygons = false;

  constructor(target: HTMLElement, center: MapCoordinates, zoom: number) {
    this.map = new OlMap({
      target,
      controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({
          source: this.polygonSource,
          style: (feature) => this.getPolygonStyle(Boolean(feature.get('selected'))),
          zIndex: 1,
        }),
        new VectorLayer({
          source: this.markerSource,
          style: (feature) => this.getMarkerStyle(feature.get('color'), feature.get('label'), feature.get('imageUrl')),
          zIndex: 2,
        }),
      ],
      view: new View({ center: fromLonLat([center.longitude, center.latitude]), zoom }),
    });

    this.clickKey = this.map.on('click', (event) => {
      const feature = this.map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate);
      const annotationId = feature?.get('annotationId');
      if (annotationId) this.onMarkerClick?.(Number(annotationId));
    }) as EventsKey;

    setTimeout(() => this.map.updateSize(), 0);
    setTimeout(() => this.map.updateSize(), 250);
  }

  onAnnotationSelected(callback: (annotationId: number) => void): void {
    this.onMarkerClick = callback;
  }

  setPolygons(polygons: AnnotationPolygon[]): void {
    this.polygonSource.clear();
    if (polygons.length === 0) return;

    const polygonCoordinateSets = polygons
      .map((polygon) => ({
        polygon,
        coordinates: polygon.points.map((point) => fromLonLat([point.longitude, point.latitude])),
      }))
      .filter((item) => item.coordinates.length >= 3);

    polygonCoordinateSets.forEach(({ polygon, coordinates }) => {
      this.polygonSource.addFeature(new Feature({
        geometry: new Polygon([[...coordinates, coordinates[0]]]),
        polygonId: polygon.id,
        name: polygon.name,
        selected: polygon.selected,
      }));
    });

    this.map.updateSize();

    const selectedCoordinates = polygonCoordinateSets.find((item) => item.polygon.selected)?.coordinates;
    if (selectedCoordinates) {
      this.map.getView().fit(boundingExtent(selectedCoordinates), { padding: [80, 80, 80, 80], maxZoom: 15, duration: 250 });
      return;
    }

    if (!this.fittedInitialPolygons) {
      const allCoordinates = polygonCoordinateSets.flatMap((item) => item.coordinates);
      if (allCoordinates.length > 0) {
        this.map.getView().fit(boundingExtent(allCoordinates), { padding: [80, 80, 80, 80], maxZoom: 13, duration: 250 });
        this.fittedInitialPolygons = true;
      }
    }
  }

  setMarkers(markers: AnnotationMapMarker[]): void {
    this.markerSource.clear();
    markers.forEach((marker) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
        annotationId: marker.id,
        color: marker.color,
        label: marker.label,
        imageUrl: marker.imageUrl,
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

  private getPolygonStyle(selected: boolean): Style {
    return new Style({
      fill: new Fill({ color: selected ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.08)' }),
      stroke: new Stroke({ color: selected ? '#2563eb' : '#60a5fa', width: selected ? 2.8 : 1.4 }),
    });
  }

  private getMarkerStyle(color: string, label: string, imageUrl: string | null): Style {
    if (imageUrl) {
      return new Style({
        image: new Icon({
          src: imageUrl,
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
          scale: 0.15,
        }),
      });
    }

    return new Style({
      image: new CircleStyle({
        radius: 13,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
      text: new Text({
        text: label,
        fill: new Fill({ color: '#ffffff' }),
        font: '800 10px Inter, Arial, sans-serif',
      }),
    });
  }
}
