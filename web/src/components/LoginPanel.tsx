"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { BrandMark } from "@/components/BrandMark";
import { ApiError, createSession } from "@/lib/client-api";
import { getFirebaseAuth } from "@/lib/firebase-client";

function describeError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    default:
      return error instanceof Error ? error.message : "Sign-in failed. Try again.";
  }
}

const inputClass =
  "w-full rounded-[22px] border border-surfacestroke bg-background px-5 py-4 text-base font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const primaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70";
const secondaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-surfacestroke bg-surface px-4 py-3 text-base font-bold text-foreground transition-colors hover:border-border-strong hover:bg-background disabled:opacity-70";

export default function LoginPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<User | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  };

  // The server cookie is the session, so the Firebase client session is dropped after the exchange.
  const finish = async (user: User) => {
    try {
      await createSession(await user.getIdToken(true));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "email_not_verified") {
        setUnverified(user);
        return;
      }
      throw caught;
    }
    await signOut(getFirebaseAuth());
    onSignedIn();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const auth = getFirebaseAuth();
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
        setUnverified(user);
        return;
      }
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await finish(user);
    });
  };

  const google = () =>
    run(async () => {
      const { user } = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      await finish(user);
    });

  const confirmVerified = () =>
    run(async () => {
      if (!unverified) return;
      await unverified.reload();
      if (!unverified.emailVerified) {
        throw new Error("Your email isn't verified yet. Open the link we sent you, then try again.");
      }
      await finish(unverified);
    });

  const resend = () =>
    run(async () => {
      if (!unverified) return;
      await sendEmailVerification(unverified);
      setNotice("Verification email sent.");
    });

  const useAnotherAccount = () =>
    run(async () => {
      await signOut(getFirebaseAuth());
      setUnverified(null);
      setPassword("");
    });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.08),transparent_38%),var(--color-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="rounded-[32px] border border-border-strong bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_76%,var(--color-surface))] p-5 shadow-[var(--shadow-panel)] sm:p-6">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <BrandMark />
            <h1 className="font-display text-[clamp(1.75rem,5vw,2.25rem)] font-bold tracking-[-0.05em] text-foreground">
              {unverified ? "Verify your email" : mode === "signin" ? "Sign in to QRShift" : "Create your QRShift account"}
            </h1>
          </div>

          {error ? (
            <div className="mb-5 rounded-[22px] border border-[color:color-mix(in_srgb,var(--error)_28%,var(--color-border-soft))] bg-error/10 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-error">{error}</p>
            </div>
          ) : null}
          {notice ? <p className="mb-5 text-sm font-semibold text-text-muted">{notice}</p> : null}

          {unverified ? (
            <div className="space-y-3">
              <p className="text-sm font-medium leading-6 text-text-muted">
                Verify {unverified.email} using the link we emailed you, then continue.
              </p>
              <button type="button" disabled={busy} onClick={confirmVerified} className={primaryButtonClass}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>I&apos;ve verified my email</span>
              </button>
              <button type="button" disabled={busy} onClick={resend} className={secondaryButtonClass}>
                Resend verification email
              </button>
              <button type="button" disabled={busy} onClick={useAnotherAccount} className={secondaryButtonClass}>
                Use a different account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={submit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="Email"
                  aria-label="Email"
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
                <button type="submit" disabled={busy} className={primaryButtonClass}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{mode === "signin" ? "Sign in" : "Create account"}</span>
                </button>
              </form>
              <button type="button" disabled={busy} onClick={google} className={secondaryButtonClass}>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="w-full text-center text-sm font-semibold text-primary"
              >
                {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
