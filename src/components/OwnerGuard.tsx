"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { getOwnerSession, loginOwner } from "@/lib/client-api";

export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOwnerSession()
      .then((session) => {
        setAuthorized(session.authenticated);
      })
      .catch(() => {
        setError("QRShift couldn't verify owner access right now.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await loginOwner(secret);
      setAuthorized(true);
      setSecret("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Owner access failed.");
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
          <p className="text-sm font-medium text-text-muted">Checking owner access...</p>
        </div>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.08),transparent_38%),var(--color-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="rounded-[32px] border border-border-strong bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_76%,var(--color-surface))] p-5 shadow-[var(--shadow-panel)] sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <BrandMark />
            <span className="rounded-full border border-surfacestroke bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Owner access
            </span>
          </div>

          <div className="mb-6 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Internal setup
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,2.5rem)] font-bold tracking-[-0.05em] text-foreground">
              Unlock internal setup
            </h1>
            <p className="max-w-sm text-sm font-medium leading-6 text-text-muted">
              Enter the owner secret to create stores and seed demo data from this workspace.
            </p>
          </div>

          <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-primary/15 bg-primary/10 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium leading-6 text-foreground">
              This route is protected by a server-issued owner session instead of public client-side writes.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-[22px] border border-[color:color-mix(in_srgb,var(--error)_28%,var(--color-border-soft))] bg-error/10 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-error">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                Enter owner secret
              </span>
              <input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="w-full rounded-[22px] border border-surfacestroke bg-background px-5 py-4 text-base font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Owner secret"
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
              <span>Open internal setup</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
