import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Evidence, EvidenceRequest } from '../../models/Evidence';

type CollectionResponse<T> = T[] | { data?: T[]; items?: T[]; results?: T[]; rows?: T[] };

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly apiUrl = `${environment.apiUrl}/evidences`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Evidence[]> {
    return this.http
      .get<CollectionResponse<Evidence>>(this.apiUrl)
      .pipe(map((response) => this.toCollection(response)));
  }

  getById(id: number): Observable<Evidence> {
    return this.http.get<Evidence>(`${this.apiUrl}/${id}`);
  }

  search(query: string): Observable<Evidence[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<CollectionResponse<Evidence>>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  getByAnnotation(annotationId: number): Observable<Evidence[]> {
    return this.getAll().pipe(
      map((evidences) =>
        evidences.filter((evidence) => Number(evidence.id_annotation) === Number(annotationId)),
      ),
    );
  }

  create(request: EvidenceRequest): Observable<Evidence> {
    return this.http.post<Evidence>(this.apiUrl, this.toFormData(request));
  }

  update(id: number, request: EvidenceRequest): Observable<Evidence> {
    return this.http.put<Evidence>(`${this.apiUrl}/${id}`, this.toFormData(request));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(request: EvidenceRequest): FormData {
    const formData = new FormData();
    formData.append('id_annotation', String(request.id_annotation));
    formData.append('file_url', request.file_url);
    formData.append('file_type', request.file_type);
    formData.append('file_size', String(request.file_size));

    if (request.file) {
      formData.append('file', request.file);
    }

    return formData;
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? response.results ?? response.rows ?? [];
  }
}
