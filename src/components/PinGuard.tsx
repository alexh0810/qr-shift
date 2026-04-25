"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";

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
          <p className="text-sm font-medium text-text-muted">Loading demo workspace...</p>
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
          <div className="mb-6 flex items-start justify-between gap-4">
            <BrandMark />
            <span className="rounded-full border border-surfacestroke bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Device unlock
            </span>
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Demo workspace
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,2.5rem)] font-bold tracking-[-0.05em] text-foreground">
              Unlock this device
            </h1>
            <p className="text-base font-semibold text-foreground">{store?.name || "QRShift workspace"}</p>
            <p className="max-w-sm text-sm font-medium leading-6 text-text-muted">
              Use the manager PIN to reopen this demo workspace on this device. This now uses a trusted server check while keeping the same lightweight QRShift flow.
            </p>
          </div>

          <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-primary/15 bg-primary/10 px-4 py-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium leading-6 text-foreground">
              This unlock creates a server-issued session for this store on this device. It still stays simple, but the PIN is no longer validated in the browser.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-[22px] border border-[color:color-mix(in_srgb,var(--error)_28%,var(--color-border-soft))] bg-error/10 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-error">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                Enter manager PIN
              </span>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                className="font-mono-brand w-full rounded-[22px] border border-surfacestroke bg-background px-5 py-4 text-center text-3xl font-bold tracking-[0.36em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="••••"
                required
                autoFocus
              />
            </label>

            <div className="rounded-[20px] border border-surfacestroke bg-background px-4 py-3">
              <p className="text-sm font-medium leading-6 text-text-muted">
                QRShift keeps access simple on shared devices, but manager unlock now depends on a secure server-issued session instead of local browser storage.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Open demo workspace</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
