export interface DemarcationPoint {
  id_point?: number;
  id_neighborhood: number;
  id_annotation?: number | null;
  latitude: number;
  longitude: number;
  order: number;
  point_type: string;
}

export interface DemarcationPointRequest {
  id_neighborhood: number;
  id_annotation: number | null;
  latitude: number;
  longitude: number;
  order: number;
  point_type: string;
}

export interface PolygonPoint {
  latitude: number;
  longitude: number;
}

export type DemarcationMode = 'add' | 'edit' | 'pan';
