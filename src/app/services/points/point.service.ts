import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Point, PointRequest } from '../../models/Point';

type CollectionResponse<T> = T[] | {
  data?: T[] | { data?: T[]; items?: T[] };
  items?: T[];
  points?: T[];
  results?: T[];
  rows?: T[];
};

export interface PointSearchParams {
  id_neighborhood?: number | null;
  id_annotation?: number | null;
  point_type?: string | null;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PointService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/points`;
  private readonly defaultPageSize = 1000;

  getAll(page = 1, pageSize = this.defaultPageSize): Observable<Point[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http
      .get<CollectionResponse<Point>>(this.apiUrl, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  getById(id: number): Observable<Point> {
    return this.http.get<Point>(`${this.apiUrl}/${id}`);
  }

  search(params: PointSearchParams): Observable<Point[]> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? this.defaultPageSize));

    if (params.id_neighborhood != null) {
      httpParams = httpParams.set('id_neighborhood', String(params.id_neighborhood));
    }

    if (params.id_annotation != null) {
      httpParams = httpParams.set('id_annotation', String(params.id_annotation));
    }

    if (params.point_type) {
      httpParams = httpParams.set('point_type', params.point_type);
    }

    return this.http
      .get<CollectionResponse<Point>>(`${this.apiUrl}/search`, { params: httpParams })
      .pipe(map((response) => this.toCollection(response)));
  }

  getByNeighborhood(neighborhoodId: number): Observable<Point[]> {
    return this.search({ id_neighborhood: neighborhoodId });
  }

  create(point: PointRequest): Observable<Point> {
    return this.http.post<Point>(this.apiUrl, point);
  }

  update(id: number, point: PointRequest): Observable<Point> {
    return this.http.put<Point>(`${this.apiUrl}/${id}`, point);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteMany(ids: number[]): Observable<void[]> {
    return ids.length > 0 ? forkJoin(ids.map((id) => this.delete(id))) : of([]);
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.points)) return response.points;
    if (Array.isArray(response.results)) return response.results;
    if (Array.isArray(response.rows)) return response.rows;
    if (response.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data && Array.isArray(response.data.items)) return response.data.items;
    if (response.data && Array.isArray((response.data as any).points)) return (response.data as any).points;
    if (response.data && Array.isArray((response.data as any).results)) return (response.data as any).results;
    if (response.data && Array.isArray((response.data as any).rows)) return (response.data as any).rows;
    return [];
  }
}
