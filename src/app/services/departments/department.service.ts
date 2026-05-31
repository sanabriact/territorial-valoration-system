import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Department } from '../../models/Department';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly apiUrl = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los departamentos
   * GET /departments
   */
  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  /**
   * Obtener departamento por ID
   * GET /departments/:id
   */
  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }
}