import { Injectable } from '@angular/core';
import { AppUserRole } from '../../models/security/AppUser';

@Injectable({ providedIn: 'root' })
export class UserRoleResolverService {
  resolve(email: string | null): AppUserRole {
    const normalizedEmail = email?.toLowerCase() ?? '';

    if (normalizedEmail.includes('admin')) return 'ADMIN';
    if (normalizedEmail.includes('ciudadano') || normalizedEmail.includes('citizen')) {
      return 'CIUDADANO';
    }

    return 'FUNCIONARIO';
  }
}
