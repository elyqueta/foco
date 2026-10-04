import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from './auth.repository';
import { AuthSession, AuthUser, AuthError } from './auth.models';

const STORAGE_KEY = 'foco:auth:v1';

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepository);
  private readonly router = inject(Router);

  private readonly _session = signal<AuthSession | null>(readSession());

  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => {
    const s = this._session();
    if (!s) return false;
    if (!s.expiresAt) return true;
    return new Date(s.expiresAt) > new Date();
  });
  readonly token = computed(() => this._session()?.token ?? null);

  async login(payload: { email: string; password: string }): Promise<void> {
    const session = await this.repo.login(payload);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
    this._session.set(session);
  }

  async logout(): Promise<void> {
    const session = this._session();
    if (session) {
      try {
        await this.repo.logout(session);
      } catch {
        // ignore logout errors
      }
    }
    this.clearLocal();
    this.router.navigateByUrl('/login');
  }

  clearLocal(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this._session.set(null);
  }
}
