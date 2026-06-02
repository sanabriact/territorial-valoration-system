export interface Point {
  id_point?: number;
  id_neighborhood: number;
  id_annotation?: number | null;
  latitude: number;
  longitude: number;
  order: number;
  point_type: string;
}

export type PointRequest = Omit<Point, 'id_point'>;

export interface PointCoordinate {
  latitude: number;
  longitude: number;
}
