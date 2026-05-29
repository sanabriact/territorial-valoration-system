import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Citizen } from '../../../models/Citizen';
import { CitizenFormValue } from '../../../models/interfaces/form/CitizenFormValue';
import { CitizenService } from '../../../services/citizens/citizen.service';
import { CitizenFormComponent } from '../components/citizen-form/citizen-form.component';

@Component({
  selector: 'app-citizen-create',
  standalone: true,
  imports: [CitizenFormComponent],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
})
export class CitizenCreateComponent {
  private readonly citizenService = inject(CitizenService);
  private readonly router = inject(Router);

  readonly saving = signal(false);

  save(formValue: CitizenFormValue): void {
    this.saving.set(true);
    this.citizenService
      .existsByEmail(formValue.email)
      .pipe(
        take(1),
        switchMap((emailExists) => {
          if (emailExists) {
            throw new Error('CITIZEN_EMAIL_EXISTS');
          }

          return this.citizenService.create(this.toCitizen(formValue));
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          void Swal.fire('Listo', 'El ciudadano fue guardado correctamente.', 'success');
          this.cancel();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  cancel(): void {
    void this.router.navigate(['/administration/citizens']);
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'CITIZEN_EMAIL_EXISTS') {
      void Swal.fire('Correo duplicado', 'Ya existe un ciudadano con ese correo.', 'warning');
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar el ciudadano.', 'error');
  }

  private toCitizen(value: CitizenFormValue): Citizen {
    return {
      id_citizen: 0,
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      address: value.address.trim(),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      status: value.status,
    };
  }
}
