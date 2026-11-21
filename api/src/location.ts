export type LocationStatus = "inside" | "outside" | "unknown";

type Point = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const MAX_USABLE_ACCURACY_M = 200;
const MAX_TOLERANCE_M = 100;

const rad = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: Point, b: Point) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const inRange = (value: unknown, limit: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export function classifyLocation(
  store: { lat: number | null; lng: number | null; radius_m: number },
  input: unknown,
): LocationStatus | null {
  if (store.lat === null || store.lng === null) {
    return null;
  }
  const { lat, lng, accuracy } = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (!inRange(lat, 90) || !inRange(lng, 180) || !inRange(accuracy, MAX_USABLE_ACCURACY_M) || accuracy < 0) {
    return "unknown";
  }
  // GPS error widens the radius so an honest employee at the door is not flagged, but never by more than 100 m.
  const tolerance = Math.min(accuracy, MAX_TOLERANCE_M);
  return haversineMeters({ lat: store.lat, lng: store.lng }, { lat, lng }) <= store.radius_m + tolerance ? "inside" : "outside";
}
