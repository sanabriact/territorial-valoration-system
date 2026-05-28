import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entity } from '../../models/Entity';
import { environment } from '../../../environments/environments';

export interface GetEntitiesParams {
  page:    number;
  limit:   number;
  search?: string;
  filters?: Record<string, string | number | boolean>;
}

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class EntityService {

  constructor(private http: HttpClient) {}

  // Ajusta la URL base a la de tu API
  private readonly apiUrl = `/api/entities`;

  getAll(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.apiUrl)
  }

  createEntity(entity: Omit<Entity, 'id'>): Observable<Entity> {
    return this.http.post<Entity>(this.apiUrl, entity);
  }

  updateEntity(id: number, entity: Partial<Entity>): Observable<Entity> {
    return this.http.put<Entity>(`${this.apiUrl}/${id}`, entity);
  }

  deleteEntity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}