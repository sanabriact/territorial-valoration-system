import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Obtener todas las entidades
   * GET /entities
   */
  getAll(): Observable<Citizen[]> {
    return this.http.get<Citizen[]>(this.apiUrl);
  }

  /**
   * Obtener entidades paginadas
   * GET /entities?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<CitizenPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<CitizenPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener entidad por ID
   * GET /entities/:id
   */
  getById(id: number): Observable<Citizen> {
    return this.http.get<Citizen>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear entidad
   * POST /entities
   */
  create(citizen: Citizen): Observable<Citizen> {
    return this.http.post<Citizen>(this.apiUrl, this.toFormData(citizen));
  }

  /**
   * Actualizar entidad completa
   * PUT /entities/:id
   */
  update(id: number, citizen: Citizen): Observable<Citizen> {
    return this.http.put<Citizen>(`${this.apiUrl}/${id}`, this.toFormData(citizen));
  }

  /**
   * Eliminar entidad
   * DELETE /entities/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(citizen: Citizen): FormData {
    const formData = new FormData();

    formData.append('name', citizen.name.trim());
    formData.append('email', citizen.email.trim().toLowerCase());
    formData.append('phone', citizen.phone.trim());
    /* formData.append('address', (citizen.address ?? citizen.adress ?? '').trim()); */
    formData.append('status', String(citizen.status));

    return formData;
  }
}
