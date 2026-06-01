import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { AppUser } from '../../../../models/security/AppUser';
import { SecurityService } from '../../../../services/security/security.service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './profile-menu.component.html',
})
export class ProfileMenuComponent {
  @Input({ required: true }) user: AppUser | null = null;

  private readonly security = inject(SecurityService);
  private readonly router = inject(Router);

  get displayName(): string {
    return this.user?.name ?? this.user?.email ?? 'Usuario';
  }

  get avatarFallback(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  logout(): void {
    this.security.logout().subscribe({
      next: () => this.router.navigate(['/authentication/login']),
      error: () => this.router.navigate(['/authentication/login']),
    });
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'imagen_por_defecto.png';
  }
}
