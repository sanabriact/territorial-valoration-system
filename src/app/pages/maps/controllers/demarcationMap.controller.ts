import OlMap from 'ol/Map.js';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { OSM } from 'ol/source';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import { Point, LineString, Polygon } from 'ol/geom';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import Text from 'ol/style/Text';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { MapCoordinates } from '../../../models/interfaces/maps/MapLocation';
import Modify from 'ol/interaction/Modify';
import { unByKey } from 'ol/Observable';
import { EventsKey } from 'ol/events';
import { DemarcationMode, PolygonPoint } from '../../../models/interfaces/demarcation/demarcation';
import Collection from 'ol/Collection';

export class DemarcationMapController {
  private readonly map: OlMap;
  private readonly pointSource = new VectorSource();
  private readonly polygonSource = new VectorSource();

  /** Colección usada por Modify para poder swapearla sin recrear la interacción */
  private readonly modifyFeatures = new Collection<Feature>();
  private readonly modifyInteraction: Modify;

  private clickKey: EventsKey | null = null;
  private onPointsChangedCallback: ((points: PolygonPoint[]) => void) | null = null;
  private points: PolygonPoint[] = [];
  private currentMode: DemarcationMode = 'pan';

  constructor(target: HTMLElement, center: MapCoordinates, zoom: number) {
    const polygonLayer = new VectorLayer({
      source: this.polygonSource,
      style: this.getPolygonStyle(),
      zIndex: 1,
    });

    const pointLayer = new VectorLayer({
      source: this.pointSource,
      style: (feature: any) => this.getPointStyle(feature),
      zIndex: 2,
    });

    // Creamos el Modify UNA sola vez usando la colección mutable.
    // Cuando redibujamos sincronizamos la colección manualmente.
    this.modifyInteraction = new Modify({ features: this.modifyFeatures });
    this.modifyInteraction.on('modifyend', () => {
      // Re-leer posiciones actualizadas de la colección
      const updated: PolygonPoint[] = [];
      this.modifyFeatures.getArray()
        .sort((a, b) => (a.get('index') as number) - (b.get('index') as number))
        .forEach((f) => {
          const geom = f.getGeometry() as Point;
          const [lon, lat] = toLonLat(geom.getCoordinates());
          updated.push({ latitude: lat, longitude: lon });
        });
      this.points = updated;
      // Redibujamos polígono/línea sin limpiar pointSource (para no perder geometrías del Modify)
      this.redrawPolygon();
      this.onPointsChangedCallback?.(this.points);
    });

    this.map = new OlMap({
      target,
      controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
      layers: [
        new TileLayer({ source: new OSM() }),
        polygonLayer,
        pointLayer,
      ],
      view: new View({
        center: fromLonLat([center.longitude, center.latitude]),
        zoom,
      }),
    });

    // Modify siempre presente; lo habilitamos/deshabilitamos por active
    this.map.addInteraction(this.modifyInteraction);
    this.modifyInteraction.setActive(false);

    setTimeout(() => this.map.updateSize(), 0);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setCenter(point: MapCoordinates, zoom?: number): void {
    const view = this.map.getView();
    view.animate({
      center: fromLonLat([point.longitude, point.latitude]),
      duration: 350,
      zoom: zoom ?? view.getZoom() ?? 14,
    });
  }

  setMode(mode: DemarcationMode): void {
    this.currentMode = mode;

    // Limpiar listener de clic
    if (this.clickKey) {
      unByKey(this.clickKey);
      this.clickKey = null;
    }

    // Modify activo solo en modo 'edit'
    this.modifyInteraction.setActive(mode === 'edit');

    if (mode === 'add') {
      this.clickKey = this.map.on('click', (event) => {
        const [longitude, latitude] = toLonLat(event.coordinate);
        this.addPoint({ latitude, longitude });
      }) as EventsKey;
    }
  }

  /** Carga puntos iniciales (barrio ya demarcado) */
  loadPoints(points: PolygonPoint[]): void {
    this.points = [...points];
    this.redrawAll();
  }

  getPoints(): PolygonPoint[] {
    return [...this.points];
  }

  clearPoints(): void {
    this.points = [];
    this.pointSource.clear();
    this.polygonSource.clear();
    this.modifyFeatures.clear();
    this.onPointsChangedCallback?.([]);
  }

  onPointsChanged(callback: (points: PolygonPoint[]) => void): void {
    this.onPointsChangedCallback = callback;
  }

  destroy(): void {
    if (this.clickKey) unByKey(this.clickKey);
    this.map.removeInteraction(this.modifyInteraction);
    this.pointSource.clear();
    this.polygonSource.clear();
    this.modifyFeatures.clear();
    this.map.setTarget(undefined as any);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private addPoint(point: PolygonPoint): void {
    this.points.push(point);
    this.redrawAll();
    this.onPointsChangedCallback?.(this.points);
  }

  /**
   * Redibuja TODOS: puntos y polígono.
   * Sincroniza también la colección del Modify.
   */
  private redrawAll(): void {
    this.pointSource.clear();
    this.polygonSource.clear();
    this.modifyFeatures.clear();

    const olFeatures: Feature[] = this.points.map((pt, idx) => {
      const f = new Feature({
        geometry: new Point(fromLonLat([pt.longitude, pt.latitude])),
        index: idx,
        isFirst: idx === 0,
      });
      f.setId(`point-${idx}`);
      return f;
    });

    olFeatures.forEach((f) => this.pointSource.addFeature(f));
    // Sync con la colección de Modify para que el arrastre funcione
    this.modifyFeatures.extend(olFeatures);

    this.redrawPolygon();
  }

  /** Solo redibuja la línea/polígono sin tocar los puntos */
  private redrawPolygon(): void {
    this.polygonSource.clear();

    if (this.points.length < 2) return;

    const coords = this.points.map((pt) => fromLonLat([pt.longitude, pt.latitude]));

    if (this.points.length >= 3) {
      const closedCoords = [...coords, coords[0]];
      this.polygonSource.addFeature(
        new Feature({ geometry: new Polygon([closedCoords]) }),
      );
    } else {
      this.polygonSource.addFeature(
        new Feature({ geometry: new LineString(coords) }),
      );
    }
  }

  private getPolygonStyle(): Style {
    return new Style({
      fill: new Fill({ color: 'rgba(18, 99, 255, 0.10)' }),
      stroke: new Stroke({ color: '#1263ff', width: 2.5 }),
    });
  }

  private getPointStyle(feature: any): Style {
    const idx: number = feature.get('index') ?? 0;
    const isFirst: boolean = feature.get('isFirst') ?? false;

    return new Style({
      image: new CircleStyle({
        radius: isFirst ? 14 : 11,
        fill: new Fill({ color: isFirst ? '#1263ff' : '#ffffff' }),
        stroke: new Stroke({ color: '#1263ff', width: 2.5 }),
      }),
      text: new Text({
        text: String(idx + 1),
        fill: new Fill({ color: isFirst ? '#ffffff' : '#1263ff' }),
        font: 'bold 11px Inter, sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
      }),
    });
  }
}