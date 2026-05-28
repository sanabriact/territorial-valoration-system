import { EntityStatus } from "../../Entity";

export interface EntityFormValue {
    name: string;
    nit: string;
    phone: string;
    email: string;
    address: string;
    logo_url: string;
    status: EntityStatus;
    file: File | null;
}