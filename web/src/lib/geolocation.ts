export type ScanLocation = { lat: number; lng: number; accuracy: number };

export function readLocation(timeoutMs = 5000): Promise<ScanLocation | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    // The API timeout only starts after the permission prompt is answered, so cap the wait here too.
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const done = (value: ScanLocation | null) => {
      clearTimeout(timer);
      resolve(value);
    };
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => done({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      () => done(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
