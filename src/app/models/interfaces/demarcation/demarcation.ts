import { Point, PointCoordinate, PointRequest } from '../../Point';

export type DemarcationPoint = Point;
export type DemarcationPointRequest = PointRequest;
export type PolygonPoint = PointCoordinate;

export type DemarcationMode = 'add' | 'edit' | 'pan';
