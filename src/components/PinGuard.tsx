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
    const isUnlocked = localStorage.getItem(`store_${qr_token}_unlocked`) === "true";
    if (isUnlocked) {
      setUnlocked(true);
      setLoading(false);
      return;
    }
    localStorage.removeItem(`store_${qr_token}_unlocked`);

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
      setError("Incorrect PIN");
      setPinInput("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BrandMark size="lg" />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-background p-8 shadow-lg">
          {/* Brand logo */}
          <div className="mb-8 flex justify-center">
            <BrandMark size="lg" />
          </div>

          {/* Store name */}
          {store?.name ? (
            <p className="mb-6 text-center text-sm font-medium text-muted">
              {store.name}
            </p>
          ) : null}

          {/* Error message */}
          {error ? (
            <div className="mb-6 rounded-lg bg-error-light px-4 py-3 text-center">
              <p className="text-sm font-medium text-error">{error}</p>
            </div>
          ) : null}

          {/* PIN form */}
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="pin" className="block text-center text-sm font-medium text-foreground">
                Enter Manager PIN
              </label>
              <input
                id="pin"
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="****"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg"
            >
              Unlock
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
