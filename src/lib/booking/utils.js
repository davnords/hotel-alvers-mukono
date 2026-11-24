// Shared helpers: dates, prices, validation, reference numbers.
import crypto from "crypto";
export { EVENT_TYPES, calcPrice, formatMoney } from "./shared";

export const MAX_NIGHTS = 60;


export function isIsoDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

export function nightsBetween(checkIn, checkOut) {
  const a = Date.parse(checkIn + "T00:00:00Z");
  const b = Date.parse(checkOut + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

// Today's date in Uganda (UTC+3), so "today" matches the hotel's calendar.
export function todayInUganda() {
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}

export function makeRef(prefix) {
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${code}`;
}

export function cleanText(v, max = 200) {
  return String(v ?? "").trim().slice(0, max);
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isPhone(s) {
  return /^[+()\d\s-]{7,20}$/.test(s);
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export function prettyDate(iso) {
  if (!iso) return "";
  const s = typeof iso === "string" ? iso.slice(0, 10) : toIso(iso);
  return new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

// pg returns DATE columns as JS Dates at local midnight; turn them back into YYYY-MM-DD.
export function toIso(d) {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
