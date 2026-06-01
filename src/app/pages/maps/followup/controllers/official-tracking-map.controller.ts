import Feature from 'ol/Feature';
import { FeatureLike } from 'ol/Feature';
import OlMap from 'ol/Map.js';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import { boundingExtent } from 'ol/extent';
import { MapCoordinates } from '../../../../models/interfaces/maps/MapLocation';
import { OfficialTrackingMarker } from '../../../../models/interfaces/maps/OficcialTrackingMarker';

export class OfficialTrackingMapController {
  private readonly source = new VectorSource();
  private readonly map: OlMap;
  private readonly defaultCenter: MapCoordinates;
  private readonly defaultZoom: number;

  constructor(target: HTMLElement, center: MapCoordinates, zoom: number) {
    this.defaultCenter = center;
    this.defaultZoom = zoom;

    const markerLayer = new VectorLayer({
      source: this.source,
      style: (feature) => this.getMarkerStyles(feature),
      zIndex: 2,
    });

    this.map = new OlMap({
      target,
      controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([center.longitude, center.latitude]),
        zoom,
      }),
    });

    setTimeout(() => this.map.updateSize(), 0);
    setTimeout(() => this.map.updateSize(), 250);
  }

  setMarkers(markers: OfficialTrackingMarker[]): void {
    this.source.clear();

    markers.forEach((marker) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
        marker,
      });
      feature.setId(`official-${marker.id}`);
      this.source.addFeature(feature);
    });

    this.fitToMarkers(markers);
  }

  updateSize(): void {
    this.map.updateSize();
  }

  destroy(): void {
    this.source.clear();
    this.map.setTarget(undefined as any);
  }

  private fitToMarkers(markers: OfficialTrackingMarker[]): void {
    if (markers.length === 0) {
      this.map.getView().animate({
        center: fromLonLat([this.defaultCenter.longitude, this.defaultCenter.latitude]),
        zoom: this.defaultZoom,
        duration: 350,
      });
      return;
    }

    const points = markers.map((marker) => fromLonLat([marker.longitude, marker.latitude]));
    const view = this.map.getView();

    if (points.length === 1) {
      view.animate({ center: points[0], zoom: 15, duration: 350 });
      return;
    }

    view.fit(boundingExtent(points), {
      padding: [80, 80, 80, 80],
      duration: 350,
      maxZoom: 15,
    });
  }

  private getMarkerStyles(feature: FeatureLike): Style[] {
    const marker = feature.get('marker') as OfficialTrackingMarker;
    const online = marker.status === 'online';
    const primaryColor = online ? '#1263ff' : '#64748b';
    const statusColor = online ? '#13c26b' : '#9ca3af';
    const initials = marker.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return [
      new Style({
        image: new CircleStyle({
          radius: 21,
          fill: new Fill({ color: online ? '#ffffff' : '#e5e7eb' }),
          stroke: new Stroke({ color: primaryColor, width: 4 }),
        }),
        text: new Text({
          text: initials || '?',
          fill: new Fill({ color: online ? '#0f172a' : '#64748b' }),
          font: '700 12px Inter, Arial, sans-serif',
          textAlign: 'center',
          textBaseline: 'middle',
        }),
      }),
      new Style({
        image: new CircleStyle({
          radius: 6,
          displacement: [15, -15],
          fill: new Fill({ color: statusColor }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
      new Style({
        text: new Text({
          text: marker.name,
          offsetY: 38,
          padding: [5, 8, 5, 8],
          fill: new Fill({ color: '#16213e' }),
          backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.96)' }),
          backgroundStroke: new Stroke({ color: '#d9e2f2', width: 1 }),
          font: '700 11px Inter, Arial, sans-serif',
        }),
      }),
    ];
  }
}
