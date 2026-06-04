import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppUserRole } from '../models/security/AppUser';
import { SecurityService } from '../services/security/security.service';

export const roleGuard: CanActivateFn = (route) => {
  const security = inject(SecurityService);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as AppUserRole[] | undefined;

  if (!allowedRoles?.length) return true;

  const userRole = security.getUser()?.role;
  if (userRole && allowedRoles.includes(userRole)) return true;

  router.navigate(['/home']);
  return false;
};
