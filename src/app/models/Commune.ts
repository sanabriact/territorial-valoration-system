export interface Commune {
    created_at?: string;
    id_city: number;
    id_commune: number;
    name: string;
    status: "active" | "inactive";
    updated_at?: string;
}