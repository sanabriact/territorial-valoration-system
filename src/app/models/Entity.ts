export type EntityStatus = 'active' | 'inactive';
export type EntityType = 'public' | 'private';

export interface Entity {
  id_entity: number;
  name: string;
  nit: string;
  phone: string;
  email: string;
  status: EntityStatus | string;
  logo_url: string;
  adress?: string;
  address?: string;
  description?: string;
  type?: EntityType | string;
}

export interface EntityFormValue {
  name: string;
  description: string;
  type: EntityType;
  nit: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  status: EntityStatus;
  file: File | null;
}
