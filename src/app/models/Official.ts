export type OfficialStatus = 'active' | 'inactive';

export interface Official {
  id_official: number;
  id_entity: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  position?: string;
  status: OfficialStatus | string;
  last_latitude?: number | null;
  last_longitude?: number | null;
  last_gps_update?: string | null;
  gps_active?: boolean;
  entity?: {
    id_entity: number;
    name: string;
  };
}

export interface OfficialFormValue {
  id_entity: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: OfficialStatus;
}

export type CreateOfficialRequest = Omit<OfficialFormValue, 'status'> & {
  status: OfficialStatus;
  last_latitude: number | null;
  last_longitude: number | null;
  last_gps_update: string | null;
  gps_active: boolean;
};

export type UpdateOfficialRequest = Partial<CreateOfficialRequest>;
