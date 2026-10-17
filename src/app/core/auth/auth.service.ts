import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository, ProfilePayload, RegisterPayload } from './auth.repository';
import { AuthSession, AuthUser, AuthError } from './auth.models';
import { DataStore } from '../data.store';
import { NotificationService } from '../notification.service';
import { environment } from '../../../environments/environment';

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
  private readonly store = inject(DataStore);
  private readonly notifications = inject(NotificationService);

  private readonly _session = signal<AuthSession | null>(readSession());
  private readonly _validated = signal(false);
  private readonly _cameFromRegister = signal(false);
  private _validation: Promise<void> | null = null;

  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => {
    const s = this._session();
    if (!s) return false;
    if (!s.expiresAt) return true;
    return new Date(s.expiresAt) > new Date();
  });
  readonly token = computed(() => this._session()?.token ?? null);
  readonly validated = computed(() => this._validated() || !environment.useApi);
  readonly cameFromRegister = this._cameFromRegister.asReadonly();

  async login(payload: { email: string; password: string }): Promise<void> {
    this._cameFromRegister.set(false);
    const session = await this.repo.login(payload);
    this.applySession(session);
  }

  async register(payload: RegisterPayload): Promise<void> {
    const session = await this.repo.register(payload);
    this._cameFromRegister.set(true);
    this.applySession(session);
  }

  private applySession(session: AuthSession): void {
    this.persist(session);
    this._session.set(session);
    this._validated.set(true);
    this.store.setSessionScope(session.user.id);
    this.store.reload();
  }

  /** Valida a sessão contra o servidor uma única vez; usado pelos guards. */
  ensureValidated(): Promise<void> {
    const current = this._session();
    if (!current || !environment.useApi) {
      this._validated.set(true);
      return Promise.resolve();
    }
    this._validation = this._validation ?? this.validateSession();
    return this._validation;
  }

  async validateSession(): Promise<void> {
    const session = this._session();
    if (!session) {
      this._validated.set(true);
      return;
    }
    if (!environment.useApi) {
      this._validated.set(true);
      return;
    }
    try {
      const user = await this.repo.me(session);
      const updated: AuthSession = { ...session, user };
      this._session.set(updated);
      this.persist(updated);
      this.store.setSessionScope(updated.user.id);
      this._validated.set(true);
    } catch (error: unknown) {
      const status = error instanceof AuthError ? error.status : 0;
      // Só o 401 (token inválido/expirado) invalida a sessão; falhas de rede ou
      // 5xx mantêm a sessão local para a app continuar a funcionar.
      if (status === 401) {
        this.clearLocal();
      }
      this._validated.set(true);
    }
  }

  async logout(): Promise<void> {
    const session = this._session();
    this.endSession(async () => {
      if (session) {
        try {
          await this.repo.logout(session);
        } catch {
          // ignore logout errors
        }
      }
    });
  }

  async logoutAll(): Promise<void> {
    const session = this._session();
    this.endSession(async () => {
      if (session) {
        try {
          await this.repo.logoutAll(session);
        } catch {
          // ignore logout errors
        }
      }
    });
  }

  private endSession(end: () => Promise<void>): void {
    this._validated.set(false);
    this._validation = null;
    void end().finally(() => {
      this.clearLocal();
      this.router.navigateByUrl('/login');
    });
  }

  async changePassword(currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
    const session = this._session();
    if (!session) throw new AuthError('Não autenticado.', 401);
    await this.repo.changePassword(session, currentPassword, password, passwordConfirmation);
  }

  async updateProfile(payload: ProfilePayload): Promise<void> {
    const session = this._session();
    if (!session) throw new AuthError('Não autenticado.', 401);
    await this.repo.updateProfile(session, payload);
    if (payload.name) {
      const updated: AuthSession = { ...session, user: { ...session.user, name: payload.name } };
      this._session.set(updated);
      this.persist(updated);
    }
  }

  clearLocal(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notifications.reset();
    this._session.set(null);
    this._validated.set(false);
    this._validation = null;
    this._cameFromRegister.set(false);
    this.store.setSessionScope(null);
  }

  private persist(session: AuthSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }
}
