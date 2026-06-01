import { PolygonPoint } from '../../../../models/interfaces/demarcation/demarcation';

export interface AnnotationMapSelection {
  latitude: number;
  longitude: number;
  insidePolygon: boolean;
}

export interface AnnotationMarker {
  latitude: number;
  longitude: number;
}

export interface NeighborhoodPolygon {
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
