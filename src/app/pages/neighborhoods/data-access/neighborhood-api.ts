import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { environment } from '../../../../environments/environments';
import {
  Neighborhood,
  NeighborhoodAnnotation,
  NeighborhoodDependencies,
  NeighborhoodPoint,
  NeighborhoodRequest,
} from '../../../models/Neighborhood';
import { Commune } from '../../../models/Commune';

type CollectionResponse<T> = T[] | { data?: T[]; items?: T[] };

@Injectable()
export class CommuneApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/communes`;

  getAll(): Observable<Commune[]> {
    return this.http
      .get<CollectionResponse<Commune>>(this.apiUrl)
      .pipe(map((response) => this.toCollection(response)));
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? [];
  }
}

@Injectable()
export class NeighborhoodApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/neighborhoods`;

  getAll(): Observable<Neighborhood[]> {
    return this.http
      .get<CollectionResponse<Neighborhood>>(this.apiUrl)
      .pipe(map((response) => this.toCollection(response)));
  }

  getById(id: number): Observable<Neighborhood> {
    return this.http.get<Neighborhood>(`${this.apiUrl}/${id}`);
  }

  searchByCommune(communeId: number): Observable<Neighborhood[]> {
    const params = new HttpParams()
      .set('id_commune', String(communeId))
      .set('page', '1')
      .set('pageSize', '1000');

    return this.http
      .get<CollectionResponse<Neighborhood>>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  create(neighborhood: NeighborhoodRequest): Observable<Neighborhood> {
    return this.http.post<Neighborhood>(this.apiUrl, neighborhood);
  }

  update(id: number, neighborhood: NeighborhoodRequest): Observable<Neighborhood> {
    return this.http.put<Neighborhood>(`${this.apiUrl}/${id}`, neighborhood);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? [];
  }
}

@Injectable()
export class NeighborhoodDependencyApi {
  private readonly http = inject(HttpClient);
  private readonly pointsUrl = `${environment.apiUrl}/points`;
  private readonly annotationsUrl = `${environment.apiUrl}/annotations`;

  findByNeighborhood(neighborhoodId: number): Observable<NeighborhoodDependencies> {
    return forkJoin({
      points: this.http
        .get<CollectionResponse<NeighborhoodPoint>>(this.pointsUrl)
        .pipe(map((response) => this.toCollection(response))),
      annotations: this.http
        .get<CollectionResponse<NeighborhoodAnnotation>>(this.annotationsUrl)
        .pipe(map((response) => this.toCollection(response))),
    }).pipe(
      map(({ points, annotations }) => ({
        points: points.filter((point) => Number(point.id_neighborhood) === Number(neighborhoodId)),
        annotations: annotations.filter(
          (annotation) => Number(annotation.id_neighborhood) === Number(neighborhoodId),
        ),
      })),
    );
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? [];
  }
}
