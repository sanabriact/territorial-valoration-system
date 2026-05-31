import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { CityService } from '../../../services/cities/city.service';
import { DepartmentService } from '../../../services/departments/department.service';
import { Commune } from '../../../models/Commune';
import { CommuneFormValue } from '../../../models/interfaces/form/CommuneFormValue';
import { Department } from '../../../models/Department';
import { City } from '../../../models/City';

@Component({
  selector: 'app-commune-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './commune-form.component.html',
  styleUrl: './commune-form.component.scss'
})
export class CommuneFormComponent implements OnInit, OnChanges {

  private readonly fb = inject(FormBuilder);
  private readonly cityService = inject(CityService);
  private readonly departmentService = inject(DepartmentService);

  initialValue = input<Commune | null>(null);
  saving = input<boolean>(false);

  formSubmit = output<CommuneFormValue>();
  cancelForm = output<void>();

  form!: FormGroup;

  departments = signal<Department[]>([]);
  allCities = signal<City[]>([]);
  loadingCatalogs = signal(false);

  // ← Signal propia que rastreamos manualmente desde valueChanges
  private selectedDepartmentId = signal<number | null>(null);

  filteredCities = computed(() => {
    const depId = this.selectedDepartmentId();
    if (!depId) return [];
    return this.allCities().filter((c) => c.id_department === depId);
  });

  ngOnInit(): void {
    this.buildForm();
    this.loadCatalogs();
    this.watchDepartmentChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.form) {
      const val = changes['initialValue'].currentValue as Commune | null;
      if (val) this.patchForm(val);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmit.emit(this.form.getRawValue() as CommuneFormValue);
  }

  onCancel(): void {
    this.cancelForm.emit();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      id_department: [null, Validators.required],
      id_city: [null, Validators.required],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      status: ['active', Validators.required],
    });
  }

  private watchDepartmentChange(): void {
    this.form.get('id_department')!.valueChanges.subscribe((depId) => {
      // Actualiza la signal para que filteredCities reaccione
      this.selectedDepartmentId.set(depId ? Number(depId) : null);
    });
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    forkJoin({
      departments: this.departmentService.getAll(),
      cities: this.cityService.getAll(),
    })
      .pipe(finalize(() => this.loadingCatalogs.set(false)))
      .subscribe({
        next: ({ departments, cities }) => {
          this.departments.set(
            [...departments].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.allCities.set(cities);

          const initial = this.initialValue();
          if (initial) this.patchForm(initial);
        },
        error: () => {},
      });
  }

  private patchForm(commune: Commune): void {
    const city = this.allCities().find((c) => c.id_city === commune.id_city);

    if (city) {
      // Primero seteamos la signal del departamento para que filteredCities
      // ya tenga las ciudades disponibles antes de que el form las necesite
      this.selectedDepartmentId.set(city.id_department);

      this.form.patchValue({
        id_department: city.id_department,
        id_city: commune.id_city,
        name: commune.name,
        status: commune.status,
      }, { emitEvent: false }); // emitEvent: false evita que el watcher resetee id_city
    } else {
      this.form.patchValue({
        name: commune.name,
        id_city: commune.id_city,
        status: commune.status,
      }, { emitEvent: false });
    }
  }
}