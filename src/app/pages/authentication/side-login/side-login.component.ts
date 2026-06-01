import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { SecurityService } from '../../../services/security/security.service'
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { AppUser } from '../../../models/security/AppUser';

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
      error: (e) => {
        this.loading = false;
        Swal.fire('Error', e.message, 'error');
      },
    });
  }
}
