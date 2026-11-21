"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type QrSettings,
  getQrSettings,
  reissueQr,
  resetDisplayKey,
  setQrMode,
  setStoreLocation,
} from "@/lib/client-api";
import { readLocation } from "@/lib/geolocation";

const button =
  "inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-surfacestroke bg-surface px-4 text-sm font-bold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-70";

export default function QrSettingsPanel({ storeId }: { storeId: string }) {
  const [settings, setSettings] = useState<QrSettings | null>(null);
  const [radius, setRadius] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((next: QrSettings) => {
    setSettings(next);
    setRadius(String(next.radius_m));
  }, []);

  useEffect(() => {
    getQrSettings(storeId).then(apply, (loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Couldn't load QR settings."),
    );
  }, [storeId, apply]);

  const run = async (action: () => Promise<QrSettings | void>, done: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await action();
      if (next) apply(next);
      setMessage(done);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmThen = (question: string, action: () => Promise<QrSettings | void>, done: string) => {
    if (window.confirm(question)) void run(action, done);
  };

  const saveLocation = (useDevice: boolean) =>
    run(async () => {
      let lat = settings?.lat ?? null;
      let lng = settings?.lng ?? null;
      if (useDevice || lat === null || lng === null) {
        const here = await readLocation(15000);
        if (!here) throw new Error("Couldn't read this device's location. Allow location access and try again.");
        ({ lat, lng } = here);
      }
      return setStoreLocation(storeId, lat, lng, Number(radius));
    }, "Location saved.");

  const displayLink = settings?.display_key
    ? `${window.location.origin}/display/${encodeURIComponent(storeId)}#${settings.display_key}`
    : null;

  return (
    <div className="mt-4 rounded-[14px] border border-surfacestroke bg-background px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">QR code</p>
      {settings ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="QR mode">
            {(["printed", "display"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={busy}
                aria-pressed={settings.qr_mode === mode}
                onClick={() => settings.qr_mode !== mode && void run(() => setQrMode(storeId, mode), "QR mode saved.")}
                className={`${button} ${settings.qr_mode === mode ? "border-primary text-primary" : ""}`}
              >
                {mode === "printed" ? "Printed QR" : "Display QR"}
              </button>
            ))}
          </div>

          {displayLink ? (
            <div className="mt-3 text-sm font-medium text-text-muted">
              <p>Open this link on the store tablet. Treat it like a password.</p>
              <input
                readOnly
                aria-label="Display link"
                value={displayLink}
                className="mt-2 h-11 w-full rounded-[12px] border border-surfacestroke bg-surface px-4 text-sm font-semibold text-foreground"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={button}
                  onClick={() =>
                    navigator.clipboard.writeText(displayLink).then(
                      () => setMessage("Link copied."),
                      () => setError("Couldn't copy. Select the link and copy it."),
                    )
                  }
                >
                  Copy link
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    confirmThen(
                      "Reset the display link? The tablet stops working until you open the new link on it.",
                      () => resetDisplayKey(storeId),
                      "New display link created.",
                    )
                  }
                >
                  Reset display link
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    confirmThen(
                      "Reissue the QR? Every printed or displayed QR stops working immediately.",
                      () => reissueQr(storeId),
                      "QR reissued.",
                    )
                  }
                >
                  Reissue QR
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 border-t border-surfacestroke pt-3 text-sm font-medium text-text-muted">
            <p>
              Store location:{" "}
              {settings.has_location
                ? `${settings.lat?.toFixed(5)}, ${settings.lng?.toFixed(5)}`
                : "not set. Clock-ins are not checked against the store location."}
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs font-bold text-text-muted">
                Radius (m)
                <input
                  type="number"
                  min={25}
                  max={1000}
                  step={1}
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  className="mt-1 block h-11 w-28 rounded-[12px] border border-surfacestroke bg-surface px-3 text-sm font-semibold text-foreground"
                />
              </label>
              <button type="button" disabled={busy} className={button} onClick={() => void saveLocation(true)}>
                Use my current location
              </button>
              {settings.has_location ? (
                <button type="button" disabled={busy} className={button} onClick={() => void saveLocation(false)}>
                  Save radius
                </button>
              ) : null}
            </div>
            <p className="mt-2">Do this while standing in the store.</p>
          </div>
        </>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
