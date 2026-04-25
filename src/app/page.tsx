"use client";

import { ArrowRight, CheckCircle2, Clock, QrCode, Smartphone, Users, Zap } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { siteConfig } from "@/lib/site-config";

const features = [
  {
    icon: QrCode,
    title: "One QR Code",
    description: "Print once, use forever. No hardware, no apps to install.",
  },
  {
    icon: Smartphone,
    title: "Any Phone Works",
    description: "Staff scan with their camera. Works on every smartphone browser.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "See who's clocked in right now. Live dashboard updates instantly.",
  },
  {
    icon: Users,
    title: "No Staff Accounts",
    description: "Employees don't need logins. Just scan and tap to clock in.",
  },
];

const benefits = [
  "Payroll-ready CSV export",
  "Manager PIN protection",
  "Works offline",
  "No monthly per-user fees",
  "Setup in under 5 minutes",
  "Perfect for retail and hospitality",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <BrandMark size="md" />
          <div className="flex items-center gap-4">
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
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              Book Demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">QR-based time tracking</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Time tracking that{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                just works
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              Staff scan a QR code to clock in and out. Managers get a live dashboard 
              and payroll-ready exports. No apps, no logins, no friction.
            </p>
            
            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href={siteConfig.DEMO_BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.CONTACT_EMAIL}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:border-border-strong hover:bg-surface sm:w-auto"
              >
                Watch Demo
              </a>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-muted">
              Trusted by 500+ small businesses worldwide
            </p>
          </div>

          {/* Product preview mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-border bg-surface p-2 shadow-lg sm:p-3">
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                {/* Mockup header */}
                <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-error/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                    qrshift.app/dashboard
                  </div>
                </div>
                {/* Mockup content */}
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="h-4 w-32 rounded bg-foreground/10" />
                      <div className="mt-2 h-3 w-24 rounded bg-muted/20" />
                    </div>
                    <div className="h-8 w-20 rounded-lg bg-primary/10" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "On Shift", value: "12", color: "bg-success" },
                      { label: "Off Shift", value: "5", color: "bg-muted/30" },
                      { label: "Total", value: "17", color: "bg-primary" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
                        <div className={`mb-2 h-1.5 w-8 rounded-full ${stat.color}`} />
                        <div className="font-mono text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="mt-1 text-xs text-muted">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-lg text-muted">
              Built for small teams who need simple, reliable time tracking.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-hover group rounded-2xl border border-border bg-background p-6"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for businesses like yours
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Whether you run a coffee shop, retail store, or restaurant, QRShift 
                makes time tracking effortless for you and your team.
              </p>
              
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm font-medium text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <a
                  href={siteConfig.DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* QR Code illustration */}
            <div className="relative flex items-center justify-center">
              <div className="relative rounded-3xl border border-border bg-surface p-8 shadow-lg sm:p-12">
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-background shadow-inner sm:h-64 sm:w-64">
                  <div className="grid h-32 w-32 grid-cols-5 gap-1.5 sm:h-44 sm:w-44 sm:gap-2">
                    {/* Simulated QR pattern */}
                    {Array.from({ length: 25 }).map((_, i) => {
                      const isCorner = [0, 1, 2, 5, 10, 20, 21, 22, 4, 9, 14, 24].includes(i);
                      const isAccent = [6, 7, 8, 11, 12, 13, 16, 17, 18].includes(i);
                      return (
                        <div
                          key={i}
                          className={`rounded-sm ${
                            isCorner
                              ? "bg-primary"
                              : isAccent
                                ? "bg-accent"
                                : Math.random() > 0.5
                                  ? "bg-foreground"
                                  : "bg-transparent"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="mt-6 text-center text-sm font-medium text-muted">
                  Scan to clock in
                </p>
                {/* Decorative elements */}
                <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-success shadow-lg" />
                <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-primary shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-center shadow-xl sm:p-16">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to simplify time tracking?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join hundreds of businesses using QRShift to save time on payroll 
                and focus on what matters.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href={siteConfig.DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-primary shadow-md transition-all hover:bg-white/90 sm:w-auto"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={siteConfig.CONTACT_EMAIL}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <BrandMark size="sm" />
          <p className="text-sm text-muted">
            Simple time tracking for small businesses.
          </p>
        </div>
      </footer>
    </main>
  );
}
