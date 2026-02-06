export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface AuthContext {
  user: AuthUser;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
