"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only strictly show this on supported devices that haven't installed it
    const handler = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      e.preventDefault(); // Prevent standard mini-infobar
      setDeferredPrompt(installEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="rounded-[28px] border border-surfacestroke bg-surface px-4 py-4 shadow-[var(--shadow-panel)] sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="qr-grid-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-surfacestroke bg-background text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Install QRShift
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                Keep the workspace one tap away on shared phones and tablets.
              </p>
              <p className="mt-1 text-sm font-medium text-text-muted">
                This uses the browser&apos;s install flow and keeps the current QRShift session behavior.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleInstallClick}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <ArrowDownToLine className="h-4 w-4" />
              <span>Install app</span>
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-surfacestroke bg-background text-text-muted transition-colors hover:border-border-strong hover:text-foreground"
              aria-label="Dismiss install prompt"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
