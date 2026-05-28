import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Entity } from '../../models/Entity';

export interface EntityPagedResponse {
  data: Entity[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class EntityService {
  private readonly apiUrl = `${environment.apiUrl}/entities`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las entidades
   * GET /entities
   */
  getAll(): Observable<Entity[]> {
    return this.http.get<Entity[]>(this.apiUrl);
  }

  /**
   * Obtener entidades paginadas
   * GET /entities?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<EntityPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<EntityPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener entidad por ID
   * GET /entities/:id
   */
  getById(id: number): Observable<Entity> {
    return this.http.get<Entity>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear entidad
   * POST /entities
   */
  create(entity: Omit<Entity, 'id_entity'>): Observable<Entity> {
    return this.http.post<Entity>(this.apiUrl, entity);
  }

  /**
   * Actualizar entidad completa
   * PUT /entities/:id
   */
  update(id: number, entity: Entity): Observable<Entity> {
    return this.http.put<Entity>(`${this.apiUrl}/${id}`, entity);
  }

  /**
   * Eliminar entidad
   * DELETE /entities/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
