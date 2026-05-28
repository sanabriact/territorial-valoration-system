import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import {
  CreateOfficialRequest,
  Official,
  UpdateOfficialRequest,
} from '../../models/Official';

export interface OfficialPagedResponse {
  data: Official[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class OfficialService {
  private readonly apiUrl = `${environment.apiUrl}/officials`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los funcionarios
   * GET /officials
   */
  getAll(): Observable<Official[]> {
    return this.http.get<Official[]>(this.apiUrl);
  }

  /**
   * Obtener funcionarios paginados
   * GET /officials?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<OfficialPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<OfficialPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener funcionario por ID
   * GET /officials/:id
   */
  getById(id: number): Observable<Official> {
    return this.http.get<Official>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar funcionarios por filtro
   * GET /officials/search?q=
   */
  search(query: string): Observable<Official[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Official[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Crear funcionario
   * POST /officials
   */
  create(official: CreateOfficialRequest): Observable<Official> {
    return this.http.post<Official>(this.apiUrl, official);
  }

  /**
   * Actualizar funcionario
   * PUT /officials/:id
   */
  update(id: number, official: UpdateOfficialRequest): Observable<Official> {
    return this.http.put<Official>(`${this.apiUrl}/${id}`, official);
  }

  /**
   * Eliminar funcionario
   * DELETE /officials/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Validar correo registrado
   */
  existsByEmail(email: string, excludedOfficialId?: number): Observable<boolean> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.getAll().pipe(
      map((officials) =>
        officials.some(
          (official) =>
            official.email.trim().toLowerCase() === normalizedEmail &&
            official.id_official !== excludedOfficialId,
        ),
      ),
    );
  }
}
