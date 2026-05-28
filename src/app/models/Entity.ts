export type EntityStatus = 'active' | 'inactive';

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
  file?: File | null;
}


