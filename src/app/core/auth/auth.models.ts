export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type LoginField = 'email' | 'password' | 'name' | 'passwordConfirmation' | 'currentPassword';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Partial<Record<LoginField, string[]>> = {},
  ) {
    super(message);
  }
}

export const EMAIL_PATTERN = /^[^@]{2,}@[^@]{2,}\.[^@]{2,}$/;

export function emailValidator(control: { value: string }): { [key: string]: boolean } | null {
  if (!control.value) return null;
  return EMAIL_PATTERN.test(control.value) ? null : { invalidEmail: true };
}
