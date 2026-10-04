import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRepository } from './auth.repository';
import { AuthSession, AuthUser, LoginPayload, AuthError, LoginField } from './auth.models';

const toErrors = (payload: unknown): Partial<Record<LoginField, string[]>> => {
  if (!payload || typeof payload !== 'object' || !('errors' in payload)) return {};
  const errors = (payload as { errors?: Record<string, string[]> }).errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: Partial<Record<LoginField, string[]>> = {};
  for (const key of Object.keys(errors)) {
    const field = key as LoginField;
    if (field === 'email' || field === 'password') {
      out[field] = Array.isArray(errors[field]) ? errors[field] : [String(errors[field])];
    }
  }
  return out;
};

@Injectable({ providedIn: 'root' })
export class ApiAuthRepository extends AuthRepository {
  constructor(private readonly http: HttpClient) {
    super();
  }

  private readonly base = environment.apiBaseUrl;

  async login(payload: LoginPayload): Promise<AuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string; user: AuthUser; expires_at: string | null }>(
          `${this.base}/auth/login`,
          payload,
          { headers: new HttpHeaders({ Accept: 'application/json' }) },
        ),
      );
      return {
        token: response.token,
        user: response.user,
        expiresAt: response.expires_at,
      };
    } catch (error: unknown) {
      const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 0;
      if (status === 422) {
        const fieldErrors = toErrors((error as { error?: unknown }).error);
        const message = Object.values(fieldErrors).flat().at(0) ?? 'Verifica os campos.';
        throw new AuthError(message, 422, fieldErrors);
      }
      if (status === 401) {
        throw new AuthError('Email ou palavra-passe incorretos.', 401);
      }
      if (status === 429) {
        throw new AuthError('Demasiadas tentativas. Tenta novamente dentro de instantes.', 429);
      }
      if (status === 0) {
        throw new AuthError('Não foi possível contactar o servidor.', 0);
      }
      throw new AuthError('Ocorreu um erro. Tenta novamente.', status);
    }
  }

  async logout(_session: AuthSession): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/auth/logout`, {}, { headers: new HttpHeaders({ Accept: 'application/json' }), responseType: 'text' }),
    ).catch(() => {});
  }

  async me(session: AuthSession): Promise<AuthUser> {
    const response = await firstValueFrom(
      this.http.get<AuthUser>(`${this.base}/auth/me`, {
        headers: new HttpHeaders({ Accept: 'application/json', Authorization: `Bearer ${session.token}` }),
      }),
    );
    return response;
  }
}
