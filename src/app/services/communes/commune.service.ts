import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Commune } from '../../models/Commune';
import { Neighborhood } from '../../models/Neighborhood';
import { CommunePagedResponse } from '../../models/interfaces/communes/CommunePagedResponse';

export interface CommuneWithCount extends Commune {
  neighborhoodCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommuneService {
  private readonly apiUrl = `${environment.apiUrl}/communes`;
  private readonly neighborhoodsUrl = `${environment.apiUrl}/neighborhoods`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las comunas
   * GET /communes
   */
  getAll(): Observable<Commune[]> {
    return this.http.get<Commune[]>(this.apiUrl);
  }

  /**
   * Obtener todas las comunas con el conteo de barrios asociados.
   * Hace forkJoin de comunas y barrios y cruza por id_commune.
   */
  getAllWithNeighborhoodCount(): Observable<CommuneWithCount[]> {
    return forkJoin({
      communes: this.http.get<Commune[]>(this.apiUrl),
      neighborhoods: this.http.get<Neighborhood[]>(this.neighborhoodsUrl),
    }).pipe(
      map(({ communes, neighborhoods }) =>
        communes.map((commune) => ({
          ...commune,
          neighborhoodCount: neighborhoods.filter(
            (n) => n.id_commune === commune.id_commune,
          ).length,
        })),
      ),
    );
  }

  /**
   * Obtener comunas paginadas
   * GET /communes?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<CommunePagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<CommunePagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener comuna por ID
   * GET /communes/:id
   */
  getById(id: number): Observable<Commune> {
    return this.http.get<Commune>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear comuna
   * POST /communes
   */
  create(commune: Commune): Observable<Commune> {
    return this.http.post<Commune>(this.apiUrl, this.toRequestBody(commune));
  }

  /**
   * Actualizar comuna
   * PUT /communes/:id
   */
  update(id: number, commune: Commune): Observable<Commune> {
    return this.http.put<Commune>(`${this.apiUrl}/${id}`, this.toRequestBody(commune));
  }

  /**
   * Eliminar comuna
   * DELETE /communes/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toRequestBody(commune: Commune): Record<string, unknown> {
    return {
      name: commune.name.trim(),
      id_city: commune.id_city,
      status: commune.status,
    };
  }
}