export interface Citizen {
    address: string;
    email: string;
    id_citizen: number;
    latitude: number;
    longitude: number;
    name: string;
    phone: string;
    status: "active" | "inactive";
}