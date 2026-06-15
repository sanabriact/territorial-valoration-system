import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ReportQueryRequest, ReportResponse } from '../../models/Report';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `/reports`;

  generate(query: string): Observable<ReportResponse> {
    const request: ReportQueryRequest = { query: query.trim() };
    return this.http.post<ReportResponse>(this.apiUrl, request);
  }
}
