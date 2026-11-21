"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { BrandMark } from "@/components/BrandMark";
import { ApiError, DisplayQr, getDisplayQr } from "@/lib/client-api";

export default function DisplayPage({ params }: { params: { storeId: string } }) {
  const [qr, setQr] = useState<DisplayQr | null>(null);
  const [failure, setFailure] = useState<"key" | "network" | null>(null);

  useEffect(() => {
    // The key lives in the URL fragment so it is never sent to a server, logged or put in Referer.
    const key = window.location.hash.slice(1);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const next = await getDisplayQr(params.storeId, key);
        if (cancelled) return;
        setQr(next);
        setFailure(null);
        timer = setTimeout(load, Math.max(next.refresh_in_ms + 500, 1000));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "invalid_display_key") {
          setQr(null);
          setFailure("key");
          return;
        }
        setFailure("network");
        timer = setTimeout(load, 5000);
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [params.storeId]);

  const scanUrl = qr ? `${window.location.origin}/scan/${qr.qr_token}?w=${qr.window}&sig=${qr.sig}` : null;
  const retrying =
    failure === "network" ? (
      <p className="mt-4 text-sm font-medium text-error" aria-live="polite">
        Connection lost. Retrying...
      </p>
    ) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center rounded-[var(--radius-panel)] border border-border-strong bg-surface px-6 py-8 text-center shadow-[var(--shadow-panel)]">
        <BrandMark />
        {failure === "key" ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-error" aria-live="polite">
            <CircleAlert className="h-8 w-8" />
            <p className="font-display text-xl font-bold">This display link is no longer valid.</p>
            <p className="text-sm font-medium text-text-muted">Ask the store owner for a new display link.</p>
          </div>
        ) : scanUrl && qr ? (
          <>
            <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.04em] text-foreground">{qr.store_name}</h1>
            <p className="mt-1 text-sm font-medium text-text-muted">Scan with your phone to clock in or out</p>
            <div className="mt-6 rounded-[20px] bg-white p-4">
              <QRCodeSVG value={scanUrl} size={288} level="M" />
            </div>
            {retrying}
          </>
        ) : (
          <>
            <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
            {retrying}
          </>
        )}
      </div>
    </div>
  );
}
