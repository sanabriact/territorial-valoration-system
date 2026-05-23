import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, GithubAuthProvider,
         signInWithPopup, signOut, user } from '@angular/fire/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppUser } from '../../models/security/AppUser';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private auth = inject(Auth);

  // Observable público del usuario actual
  readonly user$ = user(this.auth);

  private currentUserSubject = new BehaviorSubject<AppUser | null>(
    this.loadFromStorage()
  );
  readonly currentUser$ = this.currentUserSubject.asObservable();

  // ── Login con Google ─────────────────────────────────────────────
  loginWithGoogle(): Observable<AppUser> {
    return from(
      signInWithPopup(this.auth, new GoogleAuthProvider())
        .then(result => this.buildAppUser(result.user))
    ).pipe(tap(u => this.setUser(u)));
  }

  // ── Login con GitHub ─────────────────────────────────────────────
  loginWithGithub(): Observable<AppUser> {
    return from(
      signInWithPopup(this.auth, new GithubAuthProvider())
        .then(result => this.buildAppUser(result.user))
    ).pipe(tap(u => this.setUser(u)));
  }

  // ── Logout ───────────────────────────────────────────────────────
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => this.clearUser())
    );
  }

  // ── Obtener token fresco (para el interceptor) ───────────────────
  async getIdToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? null;
  }

  getUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // ── Helpers privados ─────────────────────────────────────────────
  private async buildAppUser(firebaseUser: any): Promise<AppUser> {
    return {
      uid:     firebaseUser.uid,
      name:    firebaseUser.displayName,
      email:   firebaseUser.email,
      photo:   firebaseUser.photoURL,
      idToken: await firebaseUser.getIdToken(),
    };
  }

  private setUser(user: AppUser) {
    this.currentUserSubject.next(user);
    localStorage.setItem('appUser', JSON.stringify(user));
  }

  private clearUser() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('appUser');
  }

  private loadFromStorage(): AppUser | null {
    try {
      const raw = localStorage.getItem('appUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}