import { Injectable } from '@angular/core';
import { AuthRepository } from './auth.repository';
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return {
      token: 'mock-' + crypto.randomUUID(),
      user: { id: MOCK_USER.id, name: MOCK_USER.name, email: MOCK_USER.email },
      expiresAt,
    };
  }

  async logout(_session: AuthSession): Promise<void> {
    return Promise.resolve();
  }

  async me(session: AuthSession): Promise<AuthUser> {
    return session.user;
  }
}
