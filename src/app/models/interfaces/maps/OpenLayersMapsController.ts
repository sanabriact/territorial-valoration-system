import VectorLayer from "ol/layer/Vector";
import { MapCoordinates } from "./MapLocation";
import { OpenMapsController } from "./OpenMapsController";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import View from "ol/View";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { unByKey } from "ol/Observable";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorSource from "ol/source/Vector";
import OlMap from 'ol/Map.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';

export class OpenLayersMapsController implements OpenMapsController {
  private readonly markerSource = new VectorSource();
  private readonly map: OlMap;

  constructor(target: HTMLElement, center: MapCoordinates, zoom: number) {
    const markerLayer = new VectorLayer({
      source: this.markerSource,
      style: this.createMarkerStyle(),
    });

    this.map = new OlMap({
      target,
      controls: defaultControls({
        attribution: true,
        rotate: false,
        zoom: true,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([center.longitude, center.latitude]),
        zoom,
      }),
    });

    window.setTimeout(() => this.map.updateSize(), 0);
  }

  setCenter(point: MapCoordinates, zoom?: number): void {
    const view = this.map.getView();
    view.animate({
      center: fromLonLat([point.longitude, point.latitude]),
      duration: 250,
      zoom: zoom ?? view.getZoom() ?? 15,
    });
  }

  setMarker(point: MapCoordinates | null): void {
    this.markerSource.clear();

    if (!point) {
      return;
    }

    this.markerSource.addFeature(
      new Feature({
        geometry: new Point(fromLonLat([point.longitude, point.latitude])),
      }),
    );
  }

  onMapClick(handler: (point: MapCoordinates) => void): () => void {
    const listener = (event: MapBrowserEvent): void => {
      const [longitude, latitude] = toLonLat(event.coordinate);
      handler({ latitude, longitude });
    };

    const eventKey = this.map.on('click', listener);
    return () => unByKey(eventKey);
  }

  destroy(): void {
    this.markerSource.clear();
    this.map.setTarget(undefined);
  }

  private createMarkerStyle(): Style {
    const markerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
        <path fill="#ef4444" d="M20 0C9 0 0 8.9 0 19.8 0 34.7 20 48 20 48s20-13.3 20-28.2C40 8.9 31 0 20 0Z"/>
        <circle cx="20" cy="20" r="7" fill="#ffffff"/>
      </svg>
    `;

    return new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
      }),
    });
  }
}