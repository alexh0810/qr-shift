"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  Mail,
  Radar,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { siteConfig } from "@/lib/site-config";

const benefitCards = [
  {
    title: "One QR code",
    description: "Clock in and out from one shared station without handing out logins.",
    icon: <ScanLine className="h-4 w-4" />,
  },
  {
    title: "Works in the browser",
    description: "Staff scan on the device you already keep on-site. No app install required.",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    title: "Live shift visibility",
    description: "Managers can see who is on shift right now without chasing paper timesheets.",
    icon: <Radar className="h-4 w-4" />,
  },
  {
    title: "Payroll-ready export",
    description: "Export clean attendance totals for salary calculation and bookkeeping.",
    icon: <Download className="h-4 w-4" />,
  },
];

const businessHighlights = [
  "Payroll-ready CSV export",
  "Setup in under 5 minutes",
  "Manager PIN protection",
  "No monthly per-user fees",
  "Perfect for retail and hospitality",
];

const brandedQrPattern = [
  "111100000101101",
  "100100110010001",
  "101100001110101",
  "100100110010001",
  "111100000101111",
  "000001101100000",
  "110101221221011",
  "001011122111100",
  "110121122211011",
  "001011122111100",
  "111001221221111",
  "000001101100000",
  "111100010101111",
  "100100111010001",
  "111100010101111",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-surfacestroke/80 bg-[color:color-mix(in_srgb,var(--color-surface)_78%,transparent)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <BrandMark />
          <a
            href={siteConfig.DEMO_BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-primary bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary-dark"
          >
            Book Demo
          </a>
        </div>
      </header>

      <section className="px-0 py-10 sm:py-14 lg:py-18">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
          <div className="qr-grid-accent relative overflow-hidden rounded-[34px] border border-surfacestroke bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,251,0.84))] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-secondary/80" />
            <div className="absolute bottom-8 right-8 h-2.5 w-2.5 rounded-full bg-primary/80" />

            <div className="mx-auto flex max-w-[840px] flex-col items-center text-center">
              <span className="inline-flex min-h-[34px] items-center rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                QR time tracking
              </span>

              <h1 className="mt-5 max-w-[760px] font-display text-[clamp(2.7rem,7vw,5.4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-foreground">
                Time tracking that{" "}
                <span className="inline-block rounded-[16px] bg-primary px-2.5 pb-1 pt-0.5 text-white">
                  stays simple
                </span>
              </h1>

              <p className="mt-5 max-w-[640px] text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                Staff scan a QR code to clock in and out. Managers get live visibility and
                payroll-ready totals without apps, logins, or paper timesheets.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={siteConfig.DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book Demo
                </a>
                <a
                  href={siteConfig.CONTACT_EMAIL}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-border-strong bg-background/85 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
              </div>

              <p className="mt-4 text-xs font-medium text-text-muted">
                Built for small teams that need clearer attendance and easier payroll handoff.
              </p>
            </div>

            <div className="mx-auto mt-9 max-w-[760px]">
              <WorkspacePanel
                eyebrow="Manager panel preview"
                title="Dashboard and reports"
                compact
                description="Managers use the dashboard for live shift visibility, then switch to reports to review hours and export payroll-ready CSVs."
                className="bg-surface/96"
                bodyClassName="space-y-4"
                headerActions={
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex min-h-[36px] items-center rounded-[14px] border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white">
                      Dashboard
                    </span>
                    <span className="inline-flex min-h-[36px] items-center rounded-[14px] border border-surfacestroke bg-background px-3 py-2 text-xs font-semibold text-foreground">
                      Reports
                    </span>
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <WorkspaceStatCard
                        label="On Shift"
                        value="12"
                        compact
                        icon={<Radar className="h-4 w-4" />}
                        className="bg-background/90 shadow-none"
                        valueClassName="mt-2 text-[1.55rem] sm:text-[1.7rem]"
                      />
                      <WorkspaceStatCard
                        label="Off Shift"
                        value="5"
                        compact
                        icon={<Check className="h-4 w-4" />}
                        className="bg-background/90 shadow-none"
                        valueClassName="mt-2 text-[1.55rem] sm:text-[1.7rem]"
                      />
                    </div>

                    <div className="rounded-[22px] border border-surfacestroke bg-background/90 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                            Dashboard view
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            3 team members currently clocked in
                          </p>
                        </div>
                        <span className="inline-flex min-h-[34px] items-center rounded-full bg-success px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                          Active
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {[
                          "Nora Kim • Clocked in 8:57 AM",
                          "Marco Diaz • Clocked in 9:08 AM",
                          "Kim Tran • Clocked in 9:12 AM",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-[16px] border border-surfacestroke bg-surface px-3 py-2.5 text-sm font-medium text-foreground"
                          >
                            <span className="h-2.5 w-2.5 rounded-full bg-success" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-surfacestroke bg-background/90 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                          Reports view
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          Review hours and export CSV
                        </p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-surfacestroke bg-surface text-primary">
                        <FileSpreadsheet className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="rounded-[16px] border border-surfacestroke bg-surface px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                          Date range
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          Apr 20 to Apr 26
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-surfacestroke bg-surface px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                          Total hours
                        </p>
                        <p className="mt-1 font-mono-brand text-2xl font-bold tracking-[-0.05em] text-foreground">
                          59.85 h
                        </p>
                      </div>
                      <div className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[16px] border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white">
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                      </div>
                    </div>
                  </div>
                </div>
              </WorkspacePanel>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:color-mix(in_srgb,var(--color-surface)_38%,var(--color-bg-elevated))] py-14 sm:py-18 lg:py-22">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Everything you need
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-4xl">
              Simple for staff. Clear for managers.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
              QRShift focuses on the parts that matter most: clocking in quickly, seeing who is
              working, and exporting hours cleanly.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {benefitCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[24px] border border-surfacestroke bg-background/88 p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-primary/15 bg-primary/10 text-primary">
                  {card.icon}
                </div>
                <h3 className="mt-4 text-base font-bold tracking-[-0.03em] text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-4xl">
                Built for businesses like yours
              </h2>
              <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-text-muted">
                Whether you run a coffee shop, retail store, or restaurant, QRShift makes time
                tracking effortless for you and your team.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {businessHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-secondary/30 bg-secondary/8 text-secondary">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <a
                  href={siteConfig.DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg"
                >
                  Book Demo
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex w-full justify-center lg:justify-end">
              <div className="relative w-full max-w-[360px]">
                <span className="absolute -right-1 top-1 h-4 w-4 rounded-full bg-secondary shadow-[0_0_0_6px_rgba(255,255,255,0.92)]" />
                <span className="absolute -bottom-1 left-3 h-3 w-3 rounded-full bg-primary shadow-[0_0_0_6px_rgba(255,255,255,0.92)]" />

                <div className="rounded-[30px] border border-surfacestroke bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,251,0.88))] p-4 shadow-[var(--shadow-panel)] sm:p-5">
                  <div className="mx-auto flex w-full max-w-[240px] flex-col items-center rounded-[22px] border border-surfacestroke bg-surface px-4 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <div className="relative rounded-[18px] bg-background p-3.5">
                      <div className="absolute left-4 top-4 h-11 w-11 rounded-[10px] border-[5px] border-primary bg-white">
                        <span className="absolute left-1.5 top-1.5 h-5 w-5 rounded-[4px] bg-primary" />
                      </div>
                      <div className="absolute right-4 top-4 h-11 w-11 rounded-[10px] border-[5px] border-primary bg-white">
                        <span className="absolute left-1.5 top-1.5 h-5 w-5 rounded-[4px] bg-primary" />
                      </div>
                      <div className="absolute bottom-4 left-4 h-11 w-11 rounded-[10px] border-[5px] border-secondary bg-white">
                        <span className="absolute left-1.5 top-1.5 h-5 w-5 rounded-[4px] bg-secondary" />
                      </div>

                      <div className="grid w-[183px] grid-cols-[repeat(15,minmax(0,1fr))] gap-[3px]">
                        {brandedQrPattern.flatMap((row, rowIndex) =>
                          row.split("").map((cell, columnIndex) => {
                            const toneClass =
                              cell === "1"
                                ? "bg-primary"
                                : cell === "2"
                                  ? "bg-secondary"
                                  : "bg-transparent";

                            return (
                              <span
                                key={`${rowIndex}-${columnIndex}`}
                                className={`aspect-square w-full rounded-[2px] ${toneClass}`}
                              />
                            );
                          }),
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-semibold text-text-muted">Scan to clock in</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:color-mix(in_srgb,var(--color-surface)_35%,var(--color-bg-elevated))] py-14 sm:py-18 lg:py-22">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
          <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,rgba(36,92,255,0.98),rgba(30,215,181,0.88))] px-5 py-6 text-white shadow-[var(--shadow-panel)] sm:px-7 sm:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/78">
                  Demo and contact
                </p>
                <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
                  Make payroll-ready time tracking feel lighter.
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/86 sm:text-base">
                  QRShift keeps clocking simple for staff and gives managers cleaner visibility when
                  it is time to review hours.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={siteConfig.DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-background"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book Demo
                </a>
                <a
                  href={siteConfig.CONTACT_EMAIL}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
