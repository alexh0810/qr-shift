import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { normalizeEmail } from "./db/repo.js";
import type { AuthVerifier } from "./identity.js";

export function firebaseAuth(projectId: string): AuthVerifier {
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth(app);

  return {
    async verifyIdToken(idToken) {
      const decoded = await auth.verifyIdToken(idToken, true);
      return { email: normalizeEmail(decoded.email ?? ""), emailVerified: decoded.email_verified === true };
    },
    createSessionCookie: (idToken, expiresInMs) => auth.createSessionCookie(idToken, { expiresIn: expiresInMs }),
    async verifySessionCookie(cookie) {
      // checkRevoked costs one Identity Toolkit lookup per request; it is what makes sign-out and account disabling effective.
      const decoded = await auth.verifySessionCookie(cookie, true);
      if (!decoded.email || decoded.email_verified !== true) {
        throw new Error("session has no verified email");
      }
      return { email: normalizeEmail(decoded.email) };
    },
    async revokeSession(cookie) {
      const decoded = await auth.verifySessionCookie(cookie);
      await auth.revokeRefreshTokens(decoded.sub);
    },
  };
}
