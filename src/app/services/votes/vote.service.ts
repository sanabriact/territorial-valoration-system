import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Vote, VoteRequest } from '../../models/Vote';

type CollectionResponse<T> = T[] | { data?: T[]; items?: T[]; results?: T[]; rows?: T[] };

@Injectable({ providedIn: 'root' })
export class VoteService {
  private readonly apiUrl = `${environment.apiUrl}/votes`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Vote[]> {
    return this.http
      .get<CollectionResponse<Vote>>(this.apiUrl)
      .pipe(map((response) => this.toCollection(response)));
  }

  search(query: string): Observable<Vote[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<CollectionResponse<Vote>>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  create(request: VoteRequest): Observable<Vote> {
    return this.http.post<Vote>(this.apiUrl, request);
  }

  update(id: number, request: VoteRequest): Observable<Vote> {
    return this.http.put<Vote>(`${this.apiUrl}/${id}`, request);
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? response.results ?? response.rows ?? [];
  }
}
