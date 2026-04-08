"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

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
    <div className="bg-primary text-white p-4 rounded-[32px] shadow-xl border border-white/10 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 ml-2">
        <div className="bg-white/20 p-2 rounded-2xl">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm sm:text-base tracking-tight">Install App</p>
          <p className="text-white/70 text-xs sm:text-sm">Add to home screen for native experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-primary font-bold px-5 py-2 rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all shadow-sm"
        >
          Install
        </button>
        <button 
          onClick={() => setShowPrompt(false)}
          className="p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
