import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { City } from '../../models/City';
import { Department } from '../../models/Department';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private readonly apiUrl = `${environment.apiUrl}/cities`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las ciudades
   * GET /cities
   */
  getAll(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl);
  }

  /**
   * Obtener ciudad por ID
   * GET /cities/:id
   */
  getById(id: number): Observable<City> {
    return this.http.get<City>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener ciudades filtradas por departamento
   */
  getByDepartment(departmentId: number): Observable<City[]> {
    return this.getAll().pipe(
      map((cities) => cities.filter((c) => c.id_department === departmentId)),
    );
  }

  /**
   * Deriva los departamentos únicos desde el listado de ciudades
   */
  getDepartments(): Observable<Department[]> {
    return this.getAll().pipe(
      map((cities) => {
        const map = new Map<number, string>();
        cities.forEach((c) => {
          if (!map.has(c.id_department)) {
            map.set(c.id_department, '');
          }
        });
        // Retorna solo IDs; los nombres vendrán del endpoint de departamentos
        return Array.from(map.keys()).map((id) => ({ id_department: id, name: '' }));
      }),
    );
  }
}