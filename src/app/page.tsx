"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  FileSpreadsheet,
  Loader2,
  Mail,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const DEMO_BOOKING_URL = "https://calendly.com/your-handle";
const CONTACT_EMAIL = "mailto:youremail@gmail.com?subject=QRShift%20Inquiry";

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
    <main className="min-h-screen bg-background px-6 py-6 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-[32px] border border-surfacestroke bg-surface/90 p-5 shadow-[var(--shadow-panel)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-surfacestroke bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              QR-Based Attendance
            </span>
            <a
              href="/admin/create-store"
              className="inline-flex items-center justify-center rounded-full border border-border-strong bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              Open Demo Admin
            </a>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[36px] border border-surfacestroke bg-surface px-6 py-8 shadow-[var(--shadow-panel)] sm:px-8 sm:py-10">
            <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_top_right,rgba(36,92,255,0.18),transparent_58%)] lg:block" />
            <div className="absolute right-6 top-6 hidden rounded-[28px] border border-border-strong/60 bg-background/70 p-4 lg:block">
              <div className="qr-grid-accent rounded-[18px] border border-surfacestroke bg-surface p-3">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="relative max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <ScanLine className="h-4 w-4" />
                No Apps. No Logins.
              </p>
              <h1 className="font-display max-w-3xl text-5xl font-bold tracking-[-0.07em] text-foreground sm:text-6xl lg:text-7xl">
                Clock in with a QR code. Payroll-ready in seconds.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-text-muted sm:text-lg">
                QRShift replaces paper timesheets for small businesses with a fast
                scan-in, scan-out workflow. Managers can see who is working in real
                time and export cleaner payroll reports without forcing staff to use
                accounts or apps.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-semibold text-white transition-all hover:bg-primary-dark"
                >
                  <CalendarDays className="h-5 w-5" />
                  Request a Demo
                </a>
                <a
                  href={CONTACT_EMAIL}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-6 py-4 text-base font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <Mail className="h-5 w-5" />
                  Contact
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-surfacestroke bg-background/75 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Fast setup
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Single QR flow</p>
                </div>
                <div className="rounded-[24px] border border-surfacestroke bg-background/75 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Live visibility
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Know who's working</p>
                </div>
                <div className="rounded-[24px] border border-surfacestroke bg-background/75 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Payroll ready
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Decimal-hour exports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] border border-surfacestroke bg-surface p-6 shadow-[var(--shadow-panel)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                Best fit
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  "Bubble tea shops and small cafes",
                  "Casual restaurants and takeaway counters",
                  "Nail, beauty, and salon businesses",
                  "Small retail shops and kiosks",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-surfacestroke bg-background/80 p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-secondary" />
                    <span className="text-sm font-medium leading-6 text-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-surfacestroke bg-surface p-6 shadow-[var(--shadow-panel)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                What QRShift helps with
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-surfacestroke bg-background p-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">See who is on shift</p>
                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      Replaces paper check-ins with live attendance visibility.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-surfacestroke bg-background p-3">
                    <FileSpreadsheet className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Export cleaner payroll reports</p>
                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      Worked time is already shaped for payroll-friendly reporting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-border-strong bg-primary px-5 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Internal Demo Access
                </p>
                <p className="mt-3 text-lg font-semibold">
                  Need to create a demo store or generate QR data?
                </p>
                <a
                  href="/admin/create-store"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
                >
                  Open Administrator Portal
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
