export interface Identity {
  email: string;
  emailVerified: boolean;
}

export interface AuthVerifier {
  verifyIdToken(idToken: string): Promise<Identity>;
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  verifySessionCookie(cookie: string): Promise<{ email: string }>;
}
