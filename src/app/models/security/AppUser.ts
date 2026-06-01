export type AppUserRole = 'ADMIN' | 'FUNCIONARIO' | 'CIUDADANO';

export interface AppUser {
  uid:         string;
  name:        string | null;
  email:       string | null;
  photo:       string | null;
  idToken:     string;
  role:        AppUserRole;
}
