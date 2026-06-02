import { PolygonPoint } from '../../../../models/interfaces/demarcation/demarcation';

export interface AnnotationMapSelection {
  latitude: number;
  longitude: number;
  insidePolygon: boolean;
}

export interface AnnotationMarker {
  id?: number;
  latitude: number;
  longitude: number;
  status?: string;
  selected?: boolean;
}

export interface NeighborhoodPolygon {
  id: number;
  version: string;
  name: string;
  points: PolygonPoint[];
}

export interface AnnotationFormValue {
  latitude: number;
  longitude: number;
  description: string;
  categoryIds: number[];
  entityIds: number[];
  files: File[];
}
