import { MapCoordinates } from "./MapLocation";

export interface OpenMapsController {
  setCenter(point: MapCoordinates, zoom?: number): void;
  setMarker(point: MapCoordinates | null): void;
  onMapClick(handler: (point: MapCoordinates) => void): () => void;
  destroy(): void;
}