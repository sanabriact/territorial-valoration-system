import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Citizen } from '../../models/Citizen';

export interface CitizenPagedResponse {
  data: Citizen[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class CitizenService {
  private readonly apiUrl = `${environment.apiUrl}/citizens`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los ciudadanos
   * GET /citizens
   */
  getAll(): Observable<Citizen[]> {
    return this.http.get<Citizen[]>(this.apiUrl);
  }

  /**
   * Obtener ciudadanos paginados
   * GET /citizens?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<CitizenPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<CitizenPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener ciudadano por ID
   * GET /citizens/:id
   */
  getById(id: number): Observable<Citizen> {
    return this.http.get<Citizen>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear ciudadano
   * POST /citizens
   */
  create(citizen: Citizen): Observable<Citizen> {
    return this.http.post<Citizen>(this.apiUrl, this.toRequestBody(citizen));
  }

  /**
   * Actualizar ciudadano completo
   * PUT /citizens/:id
   */
  update(id: number, citizen: Citizen): Observable<Citizen> {
    return this.http.put<Citizen>(`${this.apiUrl}/${id}`, this.toRequestBody(citizen));
  }

  /**
   * Eliminar ciudadano
   * DELETE /citizens/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Validar correo registrado
   */
  existsByEmail(email: string, excludedCitizenId?: number): Observable<boolean> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.getAll().pipe(
      map((citizens) =>
        citizens.some(
          (citizen) =>
            citizen.email.trim().toLowerCase() === normalizedEmail &&
            citizen.id_citizen !== excludedCitizenId,
        ),
      ),
    );
  }

  private toRequestBody(citizen: Citizen): Record<string, unknown> {
    return {
      name: citizen.name.trim(),
      email: citizen.email.trim().toLowerCase(),
      phone: citizen.phone.trim(),
      address: citizen.address.trim(),
      latitude: Number(citizen.latitude),
      longitude: Number(citizen.longitude),
      status: citizen.status,
    };
  }
}
