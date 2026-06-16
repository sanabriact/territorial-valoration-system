import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { SecurityService } from '../../../services/security/security.service'
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { AppUser } from '../../../models/security/AppUser';

/** Códigos de Firebase que representan cancelaciones silenciosas del usuario. */
const SILENT_AUTH_ERRORS = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  private security = inject(SecurityService);
  private router   = inject(Router);
  loading = false;

  loginGoogle(): void {
    this.login(this.security.loginWithGoogle());
  }

  loginGithub(): void {
    this.login(this.security.loginWithGithub());
  }

  loginMicrosoft(): void {
    this.login(this.security.loginWithMicrosoft());
  }

  private login(loginRequest: Observable<AppUser>): void {
    this.loading = true;
    loginRequest.subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: { code?: string; message?: string }) => {
        this.loading = false;

        // El usuario cerró el popup o canceló: no mostrar error.
        if (e?.code && SILENT_AUTH_ERRORS.has(e.code)) return;

        Swal.fire('Error al iniciar sesión', e?.message ?? 'Ocurrió un error inesperado.', 'error');
      },
    });
  }
}