/**
 * CSV export helpers.
 *
 * RFC 4180: quote every cell and double any inner quotes, so a comma or a
 * newline inside a message body cannot shift every later column. This is the
 * whole reason not to build the string inline at each call site.
 */

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}

/** Downloadable response. The BOM is what makes Excel read it as UTF-8. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** `adversado-leads-events-2026-09-07.csv` */
export function csvFilename(...parts: string[]): string {
  return `adversado-${parts.filter(Boolean).join("-")}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
}
