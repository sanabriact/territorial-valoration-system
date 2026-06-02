import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { CitizenService } from './citizen.service';
import { SecurityService } from '../security/security.service';

@Injectable({ providedIn: 'root' })
export class CurrentCitizenService {
  private readonly citizenService = inject(CitizenService);
  private readonly securityService = inject(SecurityService);

  getCurrentCitizenId(): Observable<number> {
    const email = this.securityService.getUser()?.email?.trim().toLowerCase();

    if (!email) return of(1);

    return this.citizenService.getAll().pipe(
      map((citizens) => {
        const matchedCitizen = citizens.find(
          (citizen) => citizen.email.trim().toLowerCase() === email,
        );

        return matchedCitizen?.id_citizen ?? 1;
      }),
      catchError(() => of(1)),
    );
  }
}
