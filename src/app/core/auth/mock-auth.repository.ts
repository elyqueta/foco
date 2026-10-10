import { Injectable } from '@angular/core';
import { AuthRepository, ProfilePayload, RegisterPayload } from './auth.repository';
import { AuthSession, AuthUser, AuthError, LoginPayload } from './auth.models';

export const MOCK_USER = {
  id: 1,
  name: 'Zua',
  email: 'admin@todo.ao',
  password: '12345678',
};

export const MOCK_LOGIN_HINT = {
  email: 'admin@todo.ao',
  password: '12345678',
};

@Injectable({ providedIn: 'root' })
export class MockAuthRepository extends AuthRepository {
  async login(payload: LoginPayload): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    if (email !== MOCK_USER.email || password !== MOCK_USER.password) {
      throw new AuthError('Email ou palavra-passe incorretos.', 401);
    }
    return this.buildSession(MOCK_USER);
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (payload.password !== payload.passwordConfirmation) {
      throw new AuthError('As palavras-passe não coincidem.', 422);
    }
    return this.buildSession({ id: 2, name: payload.name, email: payload.email.trim().toLowerCase() });
  }

  async logout(_session: AuthSession): Promise<void> {
    return Promise.resolve();
  }

  async logoutAll(_session: AuthSession): Promise<void> {
    return Promise.resolve();
  }

  async me(session: AuthSession): Promise<AuthUser> {
    return session.user;
  }

  async changePassword(_session: AuthSession, currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (password !== passwordConfirmation) {
      throw new AuthError('As palavras-passe não coincidem.', 422);
    }
    if (currentPassword !== MOCK_USER.password) {
      throw new AuthError('Palavra-passe atual incorreta.', 422);
    }
  }

  async updateProfile(_session: AuthSession, payload: ProfilePayload): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (payload.email && !payload.currentPassword) {
      throw new AuthError('Indica a palavra-passe atual para mudar o email.', 422);
    }
  }

  private buildSession(user: { id: number; name: string; email: string }): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return {
      token: 'mock-' + crypto.randomUUID(),
      user: { id: user.id, name: user.name, email: user.email },
      expiresAt,
    };
  }
}
