import { CheckCircle2, Download, FileSpreadsheet, QrCode, Radar, ScanLine } from "lucide-react";

export function HeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border-strong bg-background/90 p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.22),transparent_68%)]" />
      <div className="relative rounded-[26px] border border-surfacestroke bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 border-b border-surfacestroke pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Scan -&gt; Monitor -&gt; Export
            </p>
            <p className="mt-2 font-display text-2xl font-bold tracking-[-0.05em] text-foreground">
              Dashboard and Reports, one QRShift workspace
            </p>
          </div>
          <div className="qr-grid-accent rounded-[20px] border border-surfacestroke bg-background p-3">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <ScanLine className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Scan
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">QR</p>
            <p className="mt-2 text-sm text-text-muted">Staff scan once and QRShift handles the clock action.</p>
          </div>

          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <Radar className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Monitor
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">06</p>
            <p className="mt-2 text-sm text-text-muted">Live Board keeps on-shift status visible all day.</p>
          </div>

          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <Download className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Export
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">CSV</p>
            <p className="mt-2 text-sm text-text-muted">Payroll-ready rows stay readable before download.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Dashboard / Live Board</p>
              <span className="rounded-full border border-surfacestroke px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Live
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Ava", "Clocked in 08:57", "On shift"],
                ["Leo", "Clocked in 09:04", "On shift"],
                ["Mia", "Clocked out 14:12", "Finished"],
              ].map(([name, detail, status]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[18px] border border-surfacestroke bg-surface px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-text-muted">{detail}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Reports / Export</p>
              <FileSpreadsheet className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-4 space-y-4">
              {[
                ["Week total", "156.75 h"],
                ["Edited rows", "3 local updates"],
                ["Report status", "Ready to export"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-surfacestroke bg-surface px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                </div>
              ))}
              <div className="rounded-[18px] border border-surfacestroke bg-surface px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Export proof
                  </p>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">Ready for payroll handoff</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
