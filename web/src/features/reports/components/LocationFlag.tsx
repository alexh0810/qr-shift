import { TriangleAlert } from "lucide-react";
import { LocationStatus } from "@/types";

export function LocationFlag({ status }: { status?: LocationStatus | null }) {
  if (status !== "outside" && status !== "unknown") {
    return null;
  }
  const label = status === "outside" ? "Clocked in or out away from the store" : "Location unavailable at clock time";
  return (
    <span title={label} aria-label={label} role="img" className="ml-1.5 inline-flex align-middle text-amber-600">
      <TriangleAlert className="h-4 w-4" />
    </span>
  );
}
