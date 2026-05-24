export type UserRole = "ADMIN" | "FUNCIONARIO" | "CIUDADANO";

export interface User {
    email: string;
    id: number;
    name: string;
    phone: number;
    status: boolean;
    role: UserRole;
}