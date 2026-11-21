export interface Identity {
  email: string;
  emailVerified: boolean;
}

export interface AuthVerifier {
  verifyIdToken(idToken: string): Promise<Identity>;
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  verifySessionCookie(cookie: string): Promise<{ email: string }>;
  revokeSession(cookie: string): Promise<void>;
}

export const isAuthRejection = (error: unknown) => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.startsWith("auth/");
};
