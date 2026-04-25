"use client";

import { CalendarDays, CheckCircle2, Clock3, Mail, QrCode } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { siteConfig } from "@/lib/site-config";

const steps = [
  {
    icon: QrCode,
    title: "Print the QR code",
    description: "One code per location. Stick it at the front desk.",
  },
  {
    icon: CheckCircle2,
    title: "Staff scan to clock in",
    description: "No app install, no login, no hardware.",
  },
  {
    icon: Clock3,
    title: "Export payroll-ready hours",
    description: "Pull a CSV at end of week. Done.",
  },
];

const features = [
  "No app install required",
  "No staff accounts to manage",
  "Live attendance dashboard",
  "Payroll-ready CSV export",
  "Works on any phone browser",
  "Manager PIN protection",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <a
              href={siteConfig.CONTACT_EMAIL}
              className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
            >
              Contact
            </a>
            <a
              href={siteConfig.DEMO_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-primary">
            QR-based attendance for small businesses
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Time tracking that gets out of your way
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Staff scan a QR code to clock in and out. Managers get a live dashboard and payroll-ready exports. No apps, no logins, no friction.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={siteConfig.DEMO_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <CalendarDays className="h-4 w-4" />
              Request a Demo
            </a>
            <a
              href={siteConfig.CONTACT_EMAIL}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              <Mail className="h-4 w-4" />
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-muted">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-muted">
          What you get
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-xl border border-border bg-surface px-8 py-10 text-center sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Ready to simplify attendance?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Book a 15-minute demo and see how QRShift fits into your workflow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={siteConfig.DEMO_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <CalendarDays className="h-4 w-4" />
              Book a Demo
            </a>
            <a
              href={siteConfig.CONTACT_EMAIL}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              <Mail className="h-4 w-4" />
              Send a Message
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <BrandMark showWordmark={false} />
          <p className="text-xs text-muted">QR-based attendance for small businesses.</p>
        </div>
      </footer>
    </main>
  );
}
