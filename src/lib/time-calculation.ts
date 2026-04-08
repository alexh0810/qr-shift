export const DEFAULT_MINIMUM_SHIFT_MILLISECONDS = 60 * 1000;

export interface Totals {
  totalMinutes: number;
  totalHours: number;
  display: string;
}

export function formatWorkedMinutes(totalMinutes: number): string {
  const wholeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function roundHours(totalMinutes: number): number {
  return Math.round((totalMinutes / 60) * 100) / 100;
}

export function formatPayrollDuration(totalMinutes: number): string {
  return `${roundHours(totalMinutes).toFixed(2)} h (${formatWorkedMinutes(totalMinutes)})`;
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function clampRange(start: Date, end: Date, rangeStart?: Date, rangeEnd?: Date) {
  const effectiveStart = rangeStart && start < rangeStart ? rangeStart : start;
  const effectiveEnd = rangeEnd && end > rangeEnd ? rangeEnd : end;

  if (effectiveEnd <= effectiveStart) {
    return null;
  }

  return { start: effectiveStart, end: effectiveEnd };
}

export function calculateDurationMinutes(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
}

export function applyTimeValue(baseDate: Date, timeValue: string): Date | null {
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const nextDate = new Date(baseDate);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

export function createTotals(totalMinutes: number): Totals {
  return {
    totalMinutes: Math.max(0, Math.floor(totalMinutes)),
    totalHours: roundHours(totalMinutes),
    display: formatWorkedMinutes(totalMinutes),
  };
}
