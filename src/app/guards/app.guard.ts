import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SecurityService } from '../services/security/security.service';

export const authGuard: CanActivateFn = () => {
  const security = inject(SecurityService);
  const router   = inject(Router);

  if (security.isLoggedIn()) return true;

  router.navigate(['/authentication/login']);
  return false;
};