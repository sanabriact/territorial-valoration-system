import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Obtener todas las categorias
   * GET /categories
   */
  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  /**
   * Obtener categorias paginadas
   * GET /categories?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<CategoryPagedResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<CategoryPagedResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener categoria por ID
   * GET /categories/:id
   */
  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar categorias por filtro
   * GET /categories/search?q=
   */
  search(query: string): Observable<Category[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Category[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Crear categoria
   * POST /categories
   */
  create(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, this.toFormData(category));
  }

  /**
   * Actualizar categoria
   * PUT /categories/:id
   */
  update(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, this.toFormData(category));
  }

  /**
   * Eliminar categoria
   * DELETE /categories/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toFormData(category: Category): FormData {
    const formData = new FormData();

    if (category.id_parent_category) {
      formData.append('id_parent_category', String(category.id_parent_category));
    }

    formData.append('name', category.name.trim());
    formData.append('description', category.description.trim());
    formData.append('image_url', category.image_url.trim());
    formData.append('status', String(category.status));

    if (category.file) {
      formData.append('file', category.file);
    }

    return formData;
  }
}
