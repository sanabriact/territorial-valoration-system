import { CitizenStatus } from '../../Citizen';

export interface CitizenFormValue {
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  status: CitizenStatus;
}
