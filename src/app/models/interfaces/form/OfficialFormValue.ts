import { OfficialStatus } from "../../Official";

export interface OfficialFormValue {
    id_entity: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: OfficialStatus;
    gps_active: boolean;
    last_latitude: number;
    last_longitude: number;
    last_gps_update: string | null;
}
