import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AppUser, AppUserRole } from '../../models/security/AppUser';
import { StorageService } from '../storage/storage.service';
import { UserRoleResolverService } from './user-role-resolver.service';

type SupportedOAuthProvider = GoogleAuthProvider | GithubAuthProvider | OAuthProvider;

/** Códigos de Firebase que representan cierres de popup sin error real. */
const RECOVERABLE_POPUP_ERRORS = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly auth = inject(Auth);
  private readonly storage = inject(StorageService);
  private readonly roleResolver = inject(UserRoleResolverService);
  private readonly userStorageKey = 'appUser';

  readonly user$ = user(this.auth);

  private readonly currentUserSubject = new BehaviorSubject<AppUser | null>(
    this.loadFromStorage()
  );
  readonly currentUser$ = this.currentUserSubject.asObservable();

  loginWithGoogle(): Observable<AppUser> {
    return this.loginWithProvider(new GoogleAuthProvider());
  }

  loginWithGithub(): Observable<AppUser> {
    return this.loginWithProvider(new GithubAuthProvider());
  }

  loginWithMicrosoft(): Observable<AppUser> {
    return this.loginWithProvider(new OAuthProvider('microsoft.com'));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth).catch(() => undefined)).pipe(
      tap(() => this.clearUser())
    );
  }

  async getIdToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? this.getUser()?.idToken ?? null;
  }

  getUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  changeRole(role: AppUserRole): void {
    const currentUser = this.getUser();
    if (!currentUser) return;
    this.setUser({ ...currentUser, role });
  }

  private loginWithProvider(provider: SupportedOAuthProvider): Observable<AppUser> {
    return from(
      signInWithPopup(this.auth, provider).then(result => this.buildAppUser(result.user))
    ).pipe(
      catchError((error: { code?: string }) => {
        /**
         * Microsoft (y ocasionalmente otros proveedores) puede lanzar
         * auth/popup-closed-by-user incluso cuando la autenticación completó,
         * porque el popup se cierra como parte del flujo OAuth.
         *
         * Si el error es de este tipo Y Firebase ya tiene un usuario
         * autenticado (this.auth.currentUser != null), la sesión sí inició:
         * construimos el AppUser desde el estado real de Firebase.
         *
         * Si no hay currentUser, es una cancelación real del usuario;
         * se vuelve a lanzar el error para que el componente lo maneje.
         */
        if (error?.code && RECOVERABLE_POPUP_ERRORS.has(error.code) && this.auth.currentUser) {
          return from(this.buildAppUser(this.auth.currentUser));
        }
        throw error;
      }),
      tap(appUser => this.setUser(appUser)),
    );
  }

  private async buildAppUser(firebaseUser: FirebaseUser): Promise<AppUser> {
    return {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName ?? firebaseUser.email,
      email: firebaseUser.email,
      photo: firebaseUser.photoURL,
      idToken: await firebaseUser.getIdToken(),
      role: this.roleResolver.resolve(firebaseUser.email),
    };
  }

  private setUser(appUser: AppUser): void {
    this.currentUserSubject.next(appUser);
    this.storage.setObject(this.userStorageKey, appUser);
  }

  private clearUser(): void {
    this.currentUserSubject.next(null);
    this.storage.removeItem(this.userStorageKey);
  }

  private loadFromStorage(): AppUser | null {
    const storedUser = this.storage.getObject<AppUser>(this.userStorageKey);
    if (!storedUser) return null;

    return {
      ...storedUser,
      role: storedUser.role ?? this.roleResolver.resolve(storedUser.email),
    };
  }
}