import { Point } from './Point';

export type NeighborhoodStatus = 'active' | 'inactive';

export interface Neighborhood {
  id_neighborhood: number;
  id_commune: number;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface NeighborhoodFormValue {
  id_commune: number;
  name: string;
  status: NeighborhoodStatus;
}

export type NeighborhoodRequest = Omit<Neighborhood, 'id_neighborhood' | 'commune'>;

export type NeighborhoodPoint = Point & { id_point: number };

export interface NeighborhoodAnnotation {
  id_annotation: number;
  id_neighborhood: number;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface NeighborhoodListItem extends Neighborhood {
  communeName: string;
}

export interface NeighborhoodDependencies {
  points: NeighborhoodPoint[];
  annotations: NeighborhoodAnnotation[];
}
