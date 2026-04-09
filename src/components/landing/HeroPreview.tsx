import { BarChart3, Clock3, FileSpreadsheet, QrCode, Users } from "lucide-react";

export function HeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border-strong bg-background/90 p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.22),transparent_68%)]" />
      <div className="relative rounded-[26px] border border-surfacestroke bg-surface p-4">
        <div className="flex items-center justify-between gap-4 border-b border-surfacestroke pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              QRShift Live
            </p>
            <p className="mt-2 font-display text-2xl font-bold tracking-[-0.05em] text-foreground">
              Shift Overview
            </p>
          </div>
          <div className="qr-grid-accent rounded-[20px] border border-surfacestroke bg-background p-3">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                On Shift
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">06</p>
            <p className="mt-2 text-sm text-text-muted">Live headcount without paper check-ins</p>
          </div>

          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <Clock3 className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Today
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">42.5h</p>
            <p className="mt-2 text-sm text-text-muted">Worked time already shaped for payroll</p>
          </div>

          <div className="rounded-[22px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Export
              </span>
            </div>
            <p className="mt-4 font-mono-brand text-3xl font-semibold text-foreground">CSV</p>
            <p className="mt-2 text-sm text-text-muted">Decimal-hour reports ready to send</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-surfacestroke bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Today&apos;s attendance</p>
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
              <p className="text-sm font-semibold text-foreground">Payroll snapshot</p>
              <BarChart3 className="h-4 w-4 text-secondary" />
            </div>
            <div className="mt-4 space-y-4">
              {[
                ["Week total", "156.75 h"],
                ["Open shifts", "2"],
                ["Report status", "Ready to export"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-surfacestroke bg-surface px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
