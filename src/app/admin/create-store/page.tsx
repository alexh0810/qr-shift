"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FlaskConical,
  Loader2,
  PlusCircle,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Store as StoreIcon,
} from "lucide-react";

import OwnerGuard from "@/components/OwnerGuard";
import { createDemoStore, createStore } from "@/lib/client-api";

export default function AdminCreateStore() {
  const [storeName, setStoreName] = useState("");
  const [pin, setPin] = useState("");
  const [employeesInput, setEmployeesInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [storeCreationError, setStoreCreationError] = useState("");
  const [demoStoreError, setDemoStoreError] = useState("");

  const qrRef = useRef<SVGSVGElement>(null);

  const resetFlow = () => {
    setSuccess(false);
    setStoreName("");
    setPin("");
    setEmployeesInput("");
    setGeneratedToken(null);
    setStoreCreationError("");
    setDemoStoreError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeName.trim() || !employeesInput.trim() || !pin.trim()) {
      return;
    }

    setStoreCreationError("");
    setDemoStoreError("");
    setLoading(true);

    try {
      const names = employeesInput.split("\n").filter((name) => name.trim().length > 0);
      const result = await createStore(storeName, pin, names);

      setStoreName(result.storeName);
      setGeneratedToken(result.qrToken);
      setSuccess(true);
    } catch (error) {
      setStoreCreationError(error instanceof Error ? error.message : "Failed to create store. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoStore = async () => {
    setStoreCreationError("");
    setDemoStoreError("");
    setLoading(true);

    try {
      const result = await createDemoStore();

      setStoreName(result.storeName);
      setPin(result.pin);
      setEmployeesInput("Kim\nAlex\nMaria\nNoah");
      setGeneratedToken(result.qrToken);
      setSuccess(true);
    } catch (error) {
      setDemoStoreError(error instanceof Error ? error.message : "Failed to create demo store. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) {
      return;
    }

    const svg = qrRef.current;
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes("xmlns=")) {
      svgData = svgData.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "black";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(storeName, canvas.width / 2, img.height + 25);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${storeName.replace(/\s+/g, "_")}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(36,92,255,0.08),rgba(244,247,251,0)_28%),var(--background)] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="overflow-hidden rounded-[var(--radius-panel)] border border-surfacestroke bg-surface shadow-[var(--shadow-panel)]">
            <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:rgba(36,92,255,0.18)] bg-[color:rgba(36,92,255,0.08)] text-primary">
                  <StoreIcon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                    QRShift Internal Setup
                  </p>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Create a store, seed a demo, and hand off a working QR in one pass.
                  </h1>
                  <p className="max-w-2xl text-sm text-text-muted sm:text-base">
                    This route is now owner-protected. Store creation, demo seeding, and QR export all stay in the existing QRShift flow.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-background px-4 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Guardrails
                  </div>
                  <p className="mt-2 text-sm text-foreground">Owner-gated setup with numeric manager PIN constraints intact.</p>
                </div>
                <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-background px-4 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                    <QrCode className="h-4 w-4 text-primary" />
                    Output
                  </div>
                  <p className="mt-2 text-sm text-foreground">Every successful setup ends with a scan-ready QR and token.</p>
                </div>
                <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-background px-4 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    Demo Seed
                  </div>
                  <p className="mt-2 text-sm text-foreground">Fake timelogs remain available for dashboard and report walkthroughs.</p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-5 py-6 shadow-[var(--shadow-panel)] sm:px-6 sm:py-7">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Setup Details</p>
                <h2 className="font-display text-2xl font-bold text-foreground">Store onboarding</h2>
                <p className="text-sm text-text-muted">
                  Add the store name, choose a manager PIN, and paste one employee per line.
                </p>
              </div>

              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground/80">Store Name</label>
                    <input
                      required
                      type="text"
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      placeholder="e.g. Downtown Coffee"
                      className="h-11 w-full rounded-[var(--radius-control)] border border-surfacestroke bg-background px-4 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-[color:rgba(36,92,255,0.2)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground/80">Manager PIN</label>
                    <input
                      required
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                      placeholder="e.g. 1234"
                      className="h-11 w-full rounded-[var(--radius-control)] border border-surfacestroke bg-background px-4 font-mono text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-[color:rgba(36,92,255,0.2)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-foreground/80">Employee Names</label>
                    <textarea
                      required
                      value={employeesInput}
                      onChange={(event) => setEmployeesInput(event.target.value)}
                      placeholder={"Alice\nBob\nCharlie"}
                      rows={7}
                      className="w-full rounded-[var(--radius-control)] border border-surfacestroke bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-[color:rgba(36,92,255,0.2)]"
                    />
                  </div>

                  {storeCreationError ? (
                    <div className="rounded-[var(--radius-control)] border border-[color:rgba(255,107,71,0.3)] bg-[color:rgba(255,107,71,0.08)] px-4 py-3 text-sm text-foreground">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#ff6b47]" />
                        <p>{storeCreationError}</p>
                      </div>
                    </div>
                  ) : null}

                  {demoStoreError ? (
                    <div className="rounded-[var(--radius-control)] border border-[color:rgba(255,107,71,0.3)] bg-[color:rgba(255,107,71,0.08)] px-4 py-3 text-sm text-foreground">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#ff6b47]" />
                        <p>{demoStoreError}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 lg:flex-row">
                    <button
                      type="submit"
                      disabled={loading}
                      className="min-h-[44px] h-11 flex-1 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <PlusCircle className="h-5 w-5" />
                            Create Store & Generate QR
                          </>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateDemoStore}
                      disabled={loading}
                      className="min-h-[44px] h-11 flex-1 rounded-[var(--radius-control)] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <FlaskConical className="h-5 w-5" />
                            Create demo store
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-[var(--radius-panel)] border border-[color:rgba(30,215,181,0.26)] bg-[color:rgba(30,215,181,0.08)] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:#1ed7b5]" />
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">Store ready</h3>
                        <p className="mt-1 text-sm text-text-muted">
                          <span className="font-bold text-foreground">{storeName}</span> is set up and the QR link is ready to share.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-background px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Store token</p>
                      <p className="mt-2 break-all font-mono text-base font-bold text-foreground">{generatedToken}</p>
                    </div>
                    <div className="rounded-[var(--radius-panel)] border border-surfacestroke bg-background px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Next step</p>
                      <p className="mt-2 text-sm text-foreground">Print the QR, place it near the shift start point, and test one scan flow.</p>
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-panel)] border border-dashed border-surfacestroke bg-background px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Setup notes</p>
                    <div className="mt-3 space-y-2 text-sm text-foreground">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p>Scan URL: <span className="font-mono text-xs sm:text-sm">{`${window.location.origin}/scan/${generatedToken}`}</span></p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p>Manager PIN now stays hashed on the store record after setup.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p>Use the seeded demo history to verify the dashboard and payroll export flow.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row">
                    <button
                      onClick={downloadQR}
                      className="min-h-[44px] h-11 flex-1 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Download className="h-5 w-5" />
                        Download printable QR
                      </span>
                    </button>
                    <button
                      onClick={resetFlow}
                      className="min-h-[44px] h-11 flex-1 rounded-[var(--radius-control)] border border-surfacestroke bg-background px-4 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Create another store
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[var(--radius-panel)] border border-surfacestroke bg-surface px-5 py-6 shadow-[var(--shadow-panel)] sm:px-6 sm:py-7">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">QR output</p>
                <h2 className="font-display text-2xl font-bold text-foreground">Printable code</h2>
                <p className="text-sm text-text-muted">Share this QR on-site so staff can clock in without accounts or app installs.</p>
              </div>

              <div className="flex min-h-[420px] items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-surfacestroke bg-background p-6">
                {generatedToken ? (
                  <div className="text-center">
                    <QRCodeSVG
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/scan/${generatedToken}`}
                      size={240}
                      level="H"
                      includeMargin
                      ref={qrRef}
                    />
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Generated QR</p>
                    <p className="mt-2 text-base font-bold text-foreground">{storeName}</p>
                  </div>
                ) : (
                  <div className="max-w-sm text-center">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-surfacestroke bg-surface text-primary">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-base font-bold text-foreground">No QR generated yet</p>
                    <p className="mt-2 text-sm text-text-muted">
                      Create a store or demo seed to generate the printable QR code for your scan station.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </OwnerGuard>
  );
}
