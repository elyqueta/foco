import { LoginPayload, AuthSession, AuthUser } from './auth.models';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface ProfilePayload {
  name?: string;
  email?: string;
  currentPassword?: string;
}

export abstract class AuthRepository {
  abstract login(payload: LoginPayload): Promise<AuthSession>;
  abstract register(payload: RegisterPayload): Promise<AuthSession>;
  abstract logout(session: AuthSession): Promise<void>;
  abstract logoutAll(session: AuthSession): Promise<void>;
  abstract me(session: AuthSession): Promise<AuthUser>;
  abstract changePassword(session: AuthSession, currentPassword: string, password: string, passwordConfirmation: string): Promise<void>;
  abstract updateProfile(session: AuthSession, payload: ProfilePayload): Promise<void>;
}
