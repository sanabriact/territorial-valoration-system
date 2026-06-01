import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MaterialModule } from '../../material.module';
import { AppUserRole } from '../../models/security/AppUser';
import { SecurityService } from '../../services/security/security.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly security = inject(SecurityService);

  readonly roles: AppUserRole[] = ['ADMIN', 'FUNCIONARIO', 'CIUDADANO'];
  readonly user = toSignal(this.security.currentUser$, {
    initialValue: this.security.getUser(),
  });

  changeRole(role: AppUserRole): void {
    this.security.changeRole(role);
  }
}
