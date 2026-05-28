import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';

import { Citizen } from '../../../models/Citizen';
import { CitizenFormValue } from '../../../models/interfaces/form/CitizenFormValue';
import { CitizenService } from '../../../services/citizens/citizen.service';
import { CitizenFormComponent } from '../components/citizen-form/citizen-form.component';

@Component({
  selector: 'app-citizen-edit',
  standalone: true,
  imports: [CitizenFormComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
})
export class CitizenEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly citizenService = inject(CitizenService);
  private readonly router = inject(Router);

  readonly citizenId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  readonly citizen = signal<Citizen | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadCitizen();
  }

  save(formValue: CitizenFormValue): void {
    const currentCitizen = this.citizen();

    if (!currentCitizen) {
      void Swal.fire('Error', 'No se encontro el ciudadano a editar.', 'error');
      this.cancel();
      return;
    }

    this.saving.set(true);
    this.citizenService
      .existsByEmail(formValue.email, currentCitizen.id_citizen)
      .pipe(
        take(1),
        switchMap((emailExists) => {
          if (emailExists) {
            throw new Error('CITIZEN_EMAIL_EXISTS');
          }

          return this.citizenService.update(
            currentCitizen.id_citizen,
            this.toCitizen(formValue, currentCitizen),
          );
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

  private loadCitizen(): void {
    const citizenId = this.citizenId();

    if (!citizenId) {
      void Swal.fire('Error', 'No se encontro el ciudadano a editar.', 'error');
      this.cancel();
      return;
    }

    this.loading.set(true);
    this.citizenService
      .getById(citizenId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (citizen) => this.citizen.set(citizen),
        error: () => {
          void Swal.fire('Error', 'No se pudo cargar la informacion del ciudadano.', 'error');
          this.cancel();
        },
      });
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof Error && error.message === 'CITIZEN_EMAIL_EXISTS') {
      void Swal.fire('Correo duplicado', 'Ya existe un ciudadano con ese correo.', 'warning');
      return;
    }

    void Swal.fire('Error', 'No se pudo guardar el ciudadano.', 'error');
  }

  private toCitizen(value: CitizenFormValue, currentCitizen: Citizen): Citizen {
    return {
      id_citizen: currentCitizen.id_citizen,
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      status: value.status,
      address: currentCitizen.address,
      latitude: Number(currentCitizen.latitude),
      longitude: Number(currentCitizen.longitude),
    };
  }
}
