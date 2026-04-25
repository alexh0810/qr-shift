"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { getManagerSession, getPublicStore, loginManager } from "@/lib/client-api";
import { PublicStore } from "@/types";

export default function PinGuard({ qr_token, children }: { qr_token: string; children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<PublicStore | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getPublicStore(qr_token), getManagerSession(qr_token)])
      .then(([foundStore, session]) => {
        setStore(foundStore);
        setUnlocked(session.authenticated);
      })
      .catch(() => {
        setError("Failed to load store.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [qr_token]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await loginManager(qr_token, pinInput);
      setUnlocked(true);
      setPinInput("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Incorrect PIN. Please try again.");
      setPinInput("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] border border-border-strong bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]">
          <BrandMark />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.08),transparent_38%),var(--color-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="rounded-[32px] border border-border-strong bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_76%,var(--color-surface))] p-5 shadow-[var(--shadow-panel)] sm:p-6">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <BrandMark />
            {store?.name ? <p className="text-sm font-semibold text-text-muted">{store.name}</p> : null}
          </div>

          {error ? (
            <div className="mb-5 rounded-[22px] border border-[color:color-mix(in_srgb,var(--error)_28%,var(--color-border-soft))] bg-error/10 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-error">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="block">
              <span className="sr-only">Manager PIN</span>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                className="font-mono-brand w-full rounded-[22px] border border-surfacestroke bg-background px-5 py-4 text-center text-3xl font-bold tracking-[0.36em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="••••"
                aria-label="Manager PIN"
                required
                autoFocus
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Open dashboard</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
