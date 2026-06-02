export interface Annotation {
  id_annotation: number;
  id_neighborhood: number | null;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface AnnotationRequest {
  id_neighborhood: number | null;
  id_citizen: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface AnnotationCategoryRequest {
  id_category: number;
  id_annotation: number;
}

export interface InterestedPartyRequest {
  id_entity: number;
  id_annotation: number;
}

export interface AnnotationCategory extends AnnotationCategoryRequest {
  id_annotation_category?: number;
}

export interface InterestedParty extends InterestedPartyRequest {
  id_interested_party?: number;
}
