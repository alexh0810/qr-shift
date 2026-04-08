"use client";

import { useState, useEffect } from "react";
import { getStoreByQrToken } from "@/lib/db";
import { Loader2, Lock } from "lucide-react";
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface p-10 rounded-[40px] shadow-2xl border border-surfacestroke text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">Manager Access</h1>
        <p className="text-foreground/50 font-medium mb-10">{store?.name || "QRShift Portal"}</p>

        {error && (
          <div className="bg-error/10 text-error text-sm font-bold p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="flex flex-col gap-6">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/30">Enter 4-Digit PIN</p>
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="w-full p-5 bg-background text-foreground border border-surfacestroke rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center text-3xl font-mono tracking-[0.3em]"
              placeholder="••••"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-5 rounded-full font-bold text-lg hover:bg-primary-dark transition-all shadow-lg active:scale-95"
          >
            Unlock Access
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-surfacestroke">
          <div className="inline-block bg-background px-4 py-2 rounded-full border border-surfacestroke">
            <p className="text-xs font-semibold text-foreground/40">Demo PIN: <span className="text-primary">{store?.pin || "1234"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
