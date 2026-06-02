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

  getById(id: number): Observable<Vote> {
    return this.http.get<Vote>(`${this.apiUrl}/${id}`);
  }

  search(query: string): Observable<Vote[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<CollectionResponse<Vote>>(`${this.apiUrl}/search`, { params })
      .pipe(map((response) => this.toCollection(response)));
  }

  getByAnnotation(annotationId: number): Observable<Vote[]> {
    return this.getAll().pipe(
      map((votes) => votes.filter((vote) => Number(vote.id_annotation) === Number(annotationId))),
    );
  }

  getCitizenVote(annotationId: number, citizenId: number): Observable<Vote | null> {
    return this.getByAnnotation(annotationId).pipe(
      map((votes) =>
        votes.find((vote) => Number(vote.id_citizen) === Number(citizenId)) ?? null,
      ),
    );
  }

  create(request: VoteRequest): Observable<Vote> {
    return this.http.post<Vote>(this.apiUrl, request);
  }

  update(id: number, request: VoteRequest): Observable<Vote> {
    return this.http.put<Vote>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  saveCitizenVote(existingVote: Vote | null, request: VoteRequest): Observable<Vote> {
    return existingVote
      ? this.update(existingVote.id_vote, request)
      : this.create(request);
  }

  private toCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) return response;
    return response.data ?? response.items ?? response.results ?? response.rows ?? [];
  }
}
