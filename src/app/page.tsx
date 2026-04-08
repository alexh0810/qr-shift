"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const lastDash = localStorage.getItem("last_dashboard_token");
    const lastScan = localStorage.getItem("last_scan_token");
    
    // Auto-resume sessions if they launch the PWA from home screen
    if (lastScan) {
      router.replace(`/scan/${lastScan}`);
    } else if (lastDash) {
      router.replace(`/dashboard/${lastDash}`);
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">QRShift</h1>
      <p className="text-foreground/60 mb-8 max-w-sm text-lg font-medium">
        Lightning fast QR-based staff attendance. 
        Employees must scan their unique store QR code to clock in or out.
      </p>
      
      <div className="bg-surface p-6 rounded-[32px] shadow-xl border border-surfacestroke max-w-xs w-full">
        <p className="text-sm font-bold text-foreground/40 uppercase tracking-wider mb-4">Internal Links</p>
        <a 
          href="/admin/create-store" 
          className="block w-full text-center py-3 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
        >
          Administrator Portal
        </a>
      </div>
    </div>
  );
}
