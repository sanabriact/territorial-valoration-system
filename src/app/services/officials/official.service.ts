import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Official } from '../../models/Official';

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
  create(official: Official): Observable<Official> {
    return this.http.post<Official>(this.apiUrl, this.toRequestBody(official));
  }

  /**
   * Actualizar funcionario
   * PUT /officials/:id
   */
  update(id: number, official: Official): Observable<Official> {
    return this.http.put<Official>(`${this.apiUrl}/${id}`, this.toRequestBody(official));
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

  private toRequestBody(official: Official): Record<string, unknown> {
    return {
      id_entity: Number(official.id_entity),
      name: official.name.trim(),
      email: official.email.trim().toLowerCase(),
      phone: official.phone.trim(),
      role: official.role,
      status: official.status,
      last_latitude: official.last_latitude ?? null,
      last_longitude: official.last_longitude ?? null,
      last_gps_update: official.last_gps_update ?? null,
      gps_active: official.gps_active ?? false,
    };
  }
}
