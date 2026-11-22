"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import LoginPanel from "@/components/LoginPanel";
import type { MeDto } from "@/lib/api-types";
import { getMe, logout } from "@/lib/client-api";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] border border-border-strong bg-surface px-6 py-10 text-center shadow-[var(--shadow-panel)]">
        <BrandMark />
        {children}
      </div>
    </div>
  );
}

export default function AuthGuard({ qrToken, children }: { qrToken?: string; children: React.ReactNode }) {
  const [me, setMe] = useState<MeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await getMe());
      setError(null);
    } catch {
      setError("QRShift couldn't check your sign-in right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-text-muted">Checking sign-in...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm font-semibold text-error">{error}</p>
      </Card>
    );
  }

  if (!me) {
    return <LoginPanel onSignedIn={load} />;
  }

  if (qrToken && !me.stores.some((store) => store.qr_token === qrToken)) {
    return (
      <Card>
        <p className="text-base font-bold text-foreground">You don&apos;t have access to this store.</p>
        <p className="text-sm font-medium text-text-muted">{me.email}</p>
        <button
          type="button"
          onClick={async () => {
            await logout().catch(() => undefined);
            setMe(null);
          }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[18px] border border-surfacestroke bg-surface px-4 py-3 text-base font-bold text-foreground transition-colors hover:border-border-strong hover:bg-background"
        >
          Sign out
        </button>
      </Card>
    );
  }

  return <>{children}</>;
}
