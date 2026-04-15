"use client";

import { useState, useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";
import { getStoreByQrToken } from "@/lib/db";
import { ArrowRight, Loader2 } from "lucide-react";
import { Store } from "@/types";

export default function PinGuard({ qr_token, children }: { qr_token: string, children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage first
    const isUnlocked = localStorage.getItem(`store_${qr_token}_unlocked`) === "true";
    if (isUnlocked) {
      setUnlocked(true);
      setLoading(false);
      return;
    }
    localStorage.removeItem(`store_${qr_token}_unlocked`);

    // Fetch store to get the PIN for validation
    getStoreByQrToken(qr_token)
      .then((foundStore) => {
        setStore(foundStore);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load store.");
        setLoading(false);
      });
  }, [qr_token]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    
    if (pinInput === store.pin) {
      localStorage.setItem(`store_${qr_token}_unlocked`, "true");
      setUnlocked(true);
      setError(null);
    } else {
      setError("Incorrect PIN. Please try again.");
      setPinInput(""); // Clear on wrong attempt
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] border border-surfacestroke bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]">
          <BrandMark />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-muted">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="rounded-[32px] border border-surfacestroke bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_72%,var(--color-surface))] p-5 shadow-[var(--shadow-panel)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <BrandMark />
            <span className="rounded-full border border-surfacestroke bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Demo gate
            </span>
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Manager workspace
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,2.5rem)] font-bold tracking-[-0.05em] text-foreground">
              Unlock this device
            </h1>
            <p className="text-base font-semibold text-foreground">
              {store?.name || "QRShift workspace"}
            </p>
            <p className="max-w-sm text-sm font-medium leading-6 text-text-muted">
              Use the manager PIN to reopen this demo workspace on this browser. This keeps the
              current QRShift route boundary, but it is not full account authentication.
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
                onChange={e => setPinInput(e.target.value)}
                className="font-mono-brand w-full rounded-[22px] border border-surfacestroke bg-background px-5 py-4 text-center text-3xl font-bold tracking-[0.36em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="••••"
                required
                autoFocus
              />
            </label>

            <div className="rounded-[20px] border border-surfacestroke bg-background px-4 py-3">
              <p className="text-sm font-medium leading-6 text-text-muted">
                QRShift stores the unlocked state on this device with local browser storage. Lock
                the workspace when you finish on a shared phone, tablet, or laptop.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <span>Open workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
