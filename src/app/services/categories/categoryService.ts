import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import { Category } from '../../models/Category';
import { CategoryPagedResponse } from '../../models/interfaces/categories/CategoryPagedResponse';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las categorias.
   * GET /citizens
   */
  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  /**
   * Obtener categorias paginados
   * GET /citizens?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<CategoryPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<CategoryPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener categoria por ID
   * GET /Categories/:id
   */
  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear categoria
   * POST /Categories
   */
  create(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, this.toRequestBody(category));
  }

  /**
   * Actualizar categoria completo
   * PUT /categories/:id
   */
  update(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, this.toRequestBody(category));
  }

  /**
   * Eliminar categoria
   * DELETE /categories/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Validar nombre registrado
   */
  existsByName(name: string, excludedCategoryName?: string): Observable<boolean> {
    const normalizedName = name.trim().toLowerCase();

    return this.getAll().pipe(
      map((categories) =>
        categories.some(
          (category) =>
            category.name.trim().toLowerCase() === normalizedName &&
            category.name !== excludedCategoryName,
        ),
      ),
    );
  }

  private toRequestBody(category: Category): Record<string, unknown> {
    return {
      description: category.description,
      id_category: category.id_category,
      id_parent_category: category.id_parent_category,  
      name: category.name.trim(),
      status: category.status,
    };
  }
}
