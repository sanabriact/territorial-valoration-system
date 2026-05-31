import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Neighborhood } from '../../models/Neighborhood';

@Injectable({
  providedIn: 'root',
})
export class NeighborhoodService {
  private readonly apiUrl = `${environment.apiUrl}/neighborhoods`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los barrios
   * GET /neighborhoods
   */
  getAll(): Observable<Neighborhood[]> {
    return this.http.get<Neighborhood[]>(this.apiUrl);
  }

  /**
   * Obtener barrio por ID
   * GET /neighborhoods/:id
   */
  getById(id: number): Observable<Neighborhood> {
    return this.http.get<Neighborhood>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear barrio
   * POST /neighborhoods
   */
  create(neighborhood: Neighborhood): Observable<Neighborhood> {
    return this.http.post<Neighborhood>(this.apiUrl, this.toRequestBody(neighborhood));
  }

  /**
   * Actualizar barrio
   * PUT /neighborhoods/:id
   */
  update(id: number, neighborhood: Neighborhood): Observable<Neighborhood> {
    return this.http.put<Neighborhood>(`${this.apiUrl}/${id}`, this.toRequestBody(neighborhood));
  }

  /**
   * Eliminar barrio
   * DELETE /neighborhoods/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toRequestBody(neighborhood: Neighborhood): Record<string, unknown> {
    return {
      name: neighborhood.name.trim(),
      id_commune: neighborhood.id_commune,
      status: neighborhood.status,
    };
  }
}