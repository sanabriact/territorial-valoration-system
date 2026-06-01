import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  Annotation,
  AnnotationCategoryRequest,
  AnnotationRequest,
  InterestedPartyRequest,
} from '../../models/Annotation';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly annotationsUrl = `${environment.apiUrl}/annotations`;
  private readonly annotationCategoriesUrl = `${environment.apiUrl}/annotation-categories`;
  private readonly interestedPartiesUrl = `${environment.apiUrl}/interested-parties`;
  private readonly evidencesUrl = `${environment.apiUrl}/evidences`;

  constructor(private readonly http: HttpClient) {}

  create(annotation: AnnotationRequest): Observable<Annotation> {
    return this.http.post<Annotation>(this.annotationsUrl, annotation);
  }

  assignCategory(request: AnnotationCategoryRequest): Observable<unknown> {
    return this.http.post(this.annotationCategoriesUrl, request);
  }

  assignInterestedParty(request: InterestedPartyRequest): Observable<unknown> {
    return this.http.post(this.interestedPartiesUrl, request);
  }

  uploadEvidence(annotationId: number, file: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('id_annotation', String(annotationId));
    formData.append('file_url', file.name);
    formData.append('file_type', file.type || 'image');
    formData.append('file_size', String(file.size));
    formData.append('file', file);

    return this.http.post(this.evidencesUrl, formData);
  }
}
