export function escapeCsvValue(value: string | number): string {
  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
}

export function buildReportFileName(storeName: string | undefined, startDate: string, endDate: string): string {
  const normalizedStoreName = (storeName ?? "Store").replace(/ /g, "_");
  return `QRShift_Report_${normalizedStoreName}_${startDate}_to_${endDate}`;
}
