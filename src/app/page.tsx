"use client";

import { CalendarDays, CheckCircle2, Clock3, Download, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ProductPreviewFrame } from "@/components/landing/ProductPreviewFrame";
import { SectionBlock } from "@/components/landing/SectionBlock";
import { ShiftStatusPanel } from "@/components/manager/ShiftStatusPanel";
import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { WorkspaceStatCard } from "@/components/manager/WorkspaceStatCard";
import { ScanActionPanel } from "@/components/scan/ScanActionPanel";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-5 py-5 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 pb-8">
        <header className="grid gap-3 rounded-[26px] border border-surfacestroke bg-surface/90 p-4 shadow-[var(--shadow-panel)] lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <BrandMark />
          <div className="hidden justify-center lg:flex">
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-surfacestroke bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              Scan -&gt; Monitor -&gt; Export
            </span>
          </div>
          <a
            href={siteConfig.DEMO_BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[38px] w-fit items-center justify-center rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-primary-dark"
          >
            Book Demo
          </a>
        </header>

        <section className="grid items-start gap-4 rounded-[28px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] sm:px-6 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="max-w-lg">
            <p className="mb-3 inline-flex min-h-[34px] items-center rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              QR-first attendance
            </p>
            <h1 className="font-display text-[clamp(2.2rem,4.4vw,3.8rem)] font-bold leading-[0.94] tracking-[-0.055em] text-foreground">
              QR Scan Attendance System for small businesses
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
              Staff scan in seconds. Managers monitor live status and export payroll-ready totals.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["No app install", "No staff login", "Payroll-ready"].map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-[32px] items-center rounded-full border border-surfacestroke bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={siteConfig.DEMO_BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <CalendarDays className="h-4 w-4" />
                Request a Demo
              </a>
              <a
                href={siteConfig.CONTACT_EMAIL}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
            </div>
          </div>

          <ProductPreviewFrame
            label="Scan"
            description="Mobile-friendly clock in or clock out screen."
            className="self-start"
          >
            <div className="mx-auto max-w-[340px]">
              <ScanActionPanel
                employeeName="Nora Kim"
                nextAction="IN"
                latestTimestamp={null}
                timelogLoading={false}
                actionLoading={false}
                successMessage={null}
                onBack={() => {}}
                onConfirm={() => {}}
              />
            </div>
          </ProductPreviewFrame>
        </section>

        <SectionBlock
          eyebrow="Product Snapshot"
          title="Scan, Monitor, Export in one product story."
          description="Dashboard stays the manager proof anchor, with reports completing the payroll handoff."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ProductPreviewFrame label="Monitor" description="Live dashboard visibility for who is on shift right now.">
              <ShiftStatusPanel
                title="On Shift"
                description="2 active now"
                emptyMessage="No one is currently clocked in."
                icon={CheckCircle2}
                compact
                items={[
                  {
                    id: "nora",
                    name: "Nora Kim",
                    detail: "Clocked in 8:57 AM",
                    statusLabel: "IN",
                    tone: "active",
                  },
                  {
                    id: "marco",
                    name: "Marco Diaz",
                    detail: "Clocked in 9:08 AM",
                    statusLabel: "IN",
                    tone: "active",
                  },
                ]}
              />
            </ProductPreviewFrame>

            <ProductPreviewFrame label="Export" description="Reports stay payroll-readable and ready for CSV handoff.">
              <WorkspacePanel
                eyebrow="Reports"
                title="This pay period"
                compact
                description="Supporting export proof from the same manager workspace."
                headerActions={<span className="inline-flex min-h-[38px] items-center justify-center rounded-[14px] border border-primary bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Export</span>}
              >
                <div className="grid gap-2.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <WorkspaceStatCard
                      label="Employees"
                      value="6"
                      compact
                      className="bg-background px-4 py-4 shadow-none"
                      valueClassName="mt-2 text-[1.75rem]"
                    />
                    <WorkspaceStatCard
                      label="Total Hours"
                      value="36.50 h"
                      compact
                      className="bg-background px-4 py-4 shadow-none"
                      valueClassName="mt-2 text-[1.75rem]"
                    />
                  </div>
                  <WorkspaceStatCard
                    label="Export"
                    value="CSV"
                    description="Ready for payroll handoff."
                    icon={<Download className="h-4 w-4" />}
                    compact
                    className="bg-background px-4 py-4 shadow-none"
                    valueClassName="mt-2 text-[1.75rem]"
                  />
                </div>
              </WorkspacePanel>
            </ProductPreviewFrame>
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Best fit"
          title="Built for owner-led teams with hourly staff."
          description="Best for single-location businesses replacing paper or spreadsheet timesheets."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              "Bubble tea shops and small cafes",
              "Casual restaurants and takeaway counters",
              "Nail, beauty, and salon businesses",
              "Small retail shops and kiosks",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2.5 rounded-[18px] border border-surfacestroke bg-background/80 px-3 py-3"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 text-secondary" />
                <span className="text-xs font-medium leading-5 text-foreground sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Request a demo"
          title="See QRShift in your workflow."
          description="Book a walkthrough or send a quick email."
          className="self-start"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={siteConfig.DEMO_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
            >
              <CalendarDays className="h-4 w-4" />
              Request a Demo
            </a>
            <a
              href={siteConfig.CONTACT_EMAIL}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
          </div>
        </SectionBlock>
      </div>
    </main>
  );
}
