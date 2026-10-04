import { LoginPayload, AuthSession, AuthUser } from './auth.models';

export abstract class AuthRepository {
  abstract login(payload: LoginPayload): Promise<AuthSession>;
  abstract logout(session: AuthSession): Promise<void>;
  abstract me(session: AuthSession): Promise<AuthUser>;
}
