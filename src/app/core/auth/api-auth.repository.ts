import { Injectable, inject } from '@angular/core';
import { AuthRepository, ProfilePayload, RegisterPayload } from './auth.repository';
import { AuthSession, AuthUser, LoginPayload, AuthError, LoginField } from './auth.models';
import { ApiError, ApiService } from '../api.service';

const AUTH_FIELDS: LoginField[] = ['email', 'password', 'name', 'passwordConfirmation', 'currentPassword'];

const toFieldErrors = (error: ApiError): Partial<Record<LoginField, string[]>> => {
  if (error.status !== 422) return {};
  const errors = (error as unknown as { errors?: Record<string, unknown> }).errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: Partial<Record<LoginField, string[]>> = {};
  for (const key of Object.keys(errors)) {
    if (!AUTH_FIELDS.includes(key as LoginField)) continue;
    const value = (errors as Record<string, unknown>)[key];
    out[key as LoginField] = Array.isArray(value) ? (value as string[]) : [String(value)];
  }
  return out;
};

const toAuthError = (error: unknown, fallback: string): AuthError => {
  if (error instanceof ApiError) {
    const fieldErrors = toFieldErrors(error);
    const firstMessage = Object.values(fieldErrors).flat().at(0);
    return new AuthError(firstMessage ?? error.message, error.status, fieldErrors);
  }
  return new AuthError(fallback, 0);
};

@Injectable({ providedIn: 'root' })
export class ApiAuthRepository extends AuthRepository {
  private readonly api = inject(ApiService);

  async login(payload: LoginPayload): Promise<AuthSession> {
    try {
      const response = await this.api.login(payload.email, payload.password);
      return {
        token: response.token,
        user: response.user,
        expiresAt: response.expires_at,
      };
    } catch (error: unknown) {
      throw toAuthError(error, 'Email ou palavra-passe incorretos.');
    }
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    try {
      const response = await this.api.register(payload);
      return {
        token: response.token,
        user: response.user,
        expiresAt: response.expires_at,
      };
    } catch (error: unknown) {
      throw toAuthError(error, 'Não foi possível criar a conta.');
    }
  }

  async logout(session: AuthSession): Promise<void> {
    try {
      await this.api.logout();
    } catch {
      //token may already be invalid; local session is cleared anyway
    }
  }

  async logoutAll(_session: AuthSession): Promise<void> {
    await this.api.logoutAll();
  }

  async me(session: AuthSession): Promise<AuthUser> {
    try {
      return await this.api.me();
    } catch (error: unknown) {
      // Qualquer resposta não-2xx invalida a sessão (fail closed).
      if (error instanceof ApiError && error.status >= 400) {
        throw new AuthError(error.message, error.status);
      }
      throw error instanceof ApiError ? new AuthError(error.message, error.status) : new AuthError('Não foi possível validar a sessão.', 0);
    }
  }

  async changePassword(_session: AuthSession, currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
    try {
      await this.api.changePassword(currentPassword, password, passwordConfirmation);
    } catch (error: unknown) {
      throw toAuthError(error, 'Não foi possível alterar a palavra-passe.');
    }
  }

  async updateProfile(_session: AuthSession, payload: ProfilePayload): Promise<void> {
    try {
      await this.api.updateProfile(payload);
    } catch (error: unknown) {
      throw toAuthError(error, 'Não foi possível atualizar o perfil.');
    }
  }
}
