import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { SecurityService } from '../services/security/security.service';
import { environment } from '../../environments/environments';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agrega el token a requests que van al backend propio
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const security = inject(SecurityService);

  return from(security.getIdToken()).pipe(
    switchMap(token => {
      if (!token) return next(req);
      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      }));
    })
  );
};