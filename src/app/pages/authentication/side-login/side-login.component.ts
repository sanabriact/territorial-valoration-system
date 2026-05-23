import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { SecurityService } from '../../../services/security/security.service'
import Swal from 'sweetalert2';

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

  loginGoogle() {
    this.loading = true;
    this.security.loginWithGoogle().subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.loading = false;
        Swal.fire('Error', e.message, 'error');
      },
    });
  }

  loginGithub() {
    this.loading = true;
    this.security.loginWithGithub().subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.loading = false;
        Swal.fire('Error', e.message, 'error');
      },
    });
  }
}