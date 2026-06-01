import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environments';
import { DemarcationPoint, DemarcationPointRequest } from '../../models/interfaces/demarcation/demarcation';

type CollectionResponse<T> = T[] | { data?: T[]; items?: T[] };

@Injectable()
export class DemarcationService {
  private readonly http: HttpClient;
  private readonly apiUrl = `${environment.apiUrl}/points`;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getByNeighborhood(neighborhoodId: number): Observable<DemarcationPoint[]> {
    const params = new HttpParams()
      .set('id_neighborhood', String(neighborhoodId))
      .set('page', '1')
      .set('pageSize', '1000');

    return this.http
      .get<CollectionResponse<DemarcationPoint>>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  getAll(): Observable<DemarcationPoint[]> {
    return this.http
      .get<CollectionResponse<DemarcationPoint>>(this.apiUrl)
      .pipe(map((response) => this.toCollection(response)));
  }

  create(point: DemarcationPointRequest): Observable<DemarcationPoint> {
    return this.http.post<DemarcationPoint>(this.apiUrl, point);
  }

  update(id: number, point: DemarcationPointRequest): Observable<DemarcationPoint> {
    return this.http.put<DemarcationPoint>(`${this.apiUrl}/${id}`, point);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteMany(ids: number[]): Observable<void[]> {
    return forkJoin(ids.map((id) => this.delete(id)));
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return (response as any).data ?? (response as any).items ?? [];
  }
}