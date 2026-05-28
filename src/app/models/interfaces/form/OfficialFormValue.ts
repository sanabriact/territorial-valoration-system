import { OfficialStatus } from "../../Official";

export interface OfficialFormValue {
    id_entity: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: OfficialStatus;
}