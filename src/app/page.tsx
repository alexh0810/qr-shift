"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  Layers3,
  Loader2,
  Mail,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { SectionBlock } from "@/components/landing/SectionBlock";

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
    <main className="min-h-screen bg-background px-5 py-5 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
        <header className="sticky top-4 z-20 flex flex-col gap-5 rounded-[32px] border border-surfacestroke bg-surface/90 p-5 shadow-[var(--shadow-panel)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-surfacestroke bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              QR-Based Attendance
            </span>
            <a
              href="/admin/create-store"
              className="inline-flex items-center justify-center rounded-full border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              Open Demo Admin
            </a>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[36px] border border-surfacestroke bg-surface px-6 py-8 shadow-[var(--shadow-panel)] sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(36,92,255,0.16),transparent_38%),linear-gradient(135deg,rgba(30,215,181,0.08),transparent_45%)]" />
            <div className="relative max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <ScanLine className="h-4 w-4" />
                No Apps. No Logins.
              </p>
              <h1 className="font-display max-w-3xl text-5xl font-bold tracking-[-0.07em] text-foreground sm:text-6xl lg:text-[4.6rem]">
                Clock in with a QR code. Payroll-ready in seconds.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-text-muted sm:text-lg">
                QRShift gives small businesses a faster way to track staff hours without paper,
                apps, or login friction. Staff scan in and out, managers see who is on shift,
                and payroll-ready reports are already structured for export.
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
                  <p className="mt-2 text-xl font-semibold text-foreground">Know who&apos;s working</p>
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

          <HeroPreview />
        </section>

        <SectionBlock
          eyebrow="How it works"
          title="A simple attendance loop your team can use immediately."
          description="QRShift keeps the process easy for staff and practical for owners. One QR station, one quick scan flow, and cleaner visibility from the first day."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Create a QR station",
                body: "Set up one QR code at the shop, counter, or front desk.",
                icon: Layers3,
              },
              {
                title: "Staff scan in or out",
                body: "No passwords, accounts, or app installs required for the team.",
                icon: Smartphone,
              },
              {
                title: "See who is on shift",
                body: "Managers get a live view of current attendance without paper timesheets.",
                icon: Users,
              },
              {
                title: "Export for payroll",
                body: "Reports are already structured in decimal hours for payroll use.",
                icon: FileSpreadsheet,
              },
            ].map(({ title, body, icon: Icon }, index) => (
              <div
                key={title}
                className="rounded-[24px] border border-surfacestroke bg-background/80 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-brand text-sm font-semibold text-text-muted">
                    0{index + 1}
                  </span>
                  <div className="rounded-2xl border border-surfacestroke bg-surface p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="mt-5 text-lg font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{body}</p>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Core benefits"
          title="Built for owners who need cleaner shift visibility without extra admin."
          description="The value of QRShift is practical: faster attendance tracking, clearer live visibility, and payroll-friendly reporting that does not make staff learn another tool."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "No app or login friction",
                body: "Staff do not need accounts to clock in or out, which keeps onboarding fast even when turnover is high.",
                icon: CheckCircle2,
              },
              {
                title: "Live shift visibility",
                body: "Managers can see who is working right now instead of chasing paper records or asking around the floor.",
                icon: Users,
              },
              {
                title: "Cleaner payroll exports",
                body: "Worked time stays shaped for payroll-ready reporting so handoff is clearer at the end of the pay period.",
                icon: FileSpreadsheet,
              },
            ].map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[26px] border border-surfacestroke bg-background/80 p-6"
              >
                <div className="rounded-2xl border border-surfacestroke bg-surface p-3 w-fit">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-5 text-xl font-semibold text-foreground">{title}</p>
                <p className="mt-3 text-sm leading-7 text-text-muted">{body}</p>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Best fit"
          title="Best suited to small businesses with hourly staff."
          description="QRShift is designed for single-location teams that need something faster and simpler than paper, but do not need a heavy workforce platform."
        >
          <div className="grid gap-3 lg:grid-cols-2">
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
                <span className="text-sm font-medium leading-6 text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Request a demo"
          title="See how QRShift can replace paper timesheets in your business."
          description="If you want a quick walkthrough, book a demo. If you would rather start with a conversation, send an email directly."
          className="relative overflow-hidden"
        >
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_right,rgba(30,215,181,0.18),transparent_72%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm leading-7 text-text-muted">
                QRShift is for small teams that want a simple QR-based clock-in flow, live shift visibility,
                and payroll-ready reporting without adding another app to staff phones.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
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
          </div>

          <div className="relative mt-8 rounded-[24px] border border-dashed border-surfacestroke bg-background/70 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              Internal Demo Access
            </p>
            <p className="mt-3 text-base font-semibold text-foreground">
              Need to create a demo store or generate QR data?
            </p>
            <a
              href="/admin/create-store"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Open Administrator Portal
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </SectionBlock>
      </div>
    </main>
  );
}
