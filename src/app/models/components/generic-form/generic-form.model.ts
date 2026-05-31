import { ValidatorFn } from '@angular/forms';

export type GenericFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'image' | 'custom';

export interface GenericSelectOption {
  value: string | number | boolean | null;
  label: string;
}

export interface GenericFieldConfig {
  key: string;
  label: string;
  type: GenericFieldType;
  placeholder?: string;
  hint?: string;
  options?: GenericSelectOption[]; // Para campos tipo 'select'
  validators?: ValidatorFn[];
  gridFullWidth?: boolean; // Para que ocupe las dos columnas en el grid
  errorMessage?: string; // Mensaje de error personalizado
}