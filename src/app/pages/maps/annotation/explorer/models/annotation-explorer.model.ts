import { Annotation } from '../../../../../models/Annotation';
import { Category } from '../../../../../models/Category';
import { Evidence } from '../../../../../models/Evidence';
import { Vote } from '../../../../../models/Vote';
import { PolygonPoint } from '../../../../../models/interfaces/demarcation/demarcation';

export interface AnnotationExplorerItem {
  annotation: Annotation;
  categories: Category[];
  evidences: Evidence[];
  votes: Vote[];
  neighborhoodName: string;
  communeId: number | null;
  communeName: string;
  averageRating: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  annotationCount: number;
}

export interface AnnotationMapMarker {
  id: number;
  latitude: number;
  longitude: number;
  color: string;
  label: string;
}

export interface AnnotationPolygon {
  id: number;
  points: PolygonPoint[];
}
