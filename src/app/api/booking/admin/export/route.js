// GET /api/booking/admin/export – all bookings as a CSV file (opens in Excel / Google Sheets).
import { query } from "@/lib/booking/db";
import { isAdmin } from "@/lib/booking/auth";

const COLS = [
  ["ref", "Reference"], ["status", "Status"], ["check_in", "Check-in"], ["check_out", "Check-out"], ["nights", "Nights"],
  ["room_type_name", "Room type"], ["rooms", "Rooms"], ["guests", "Guests"], ["name", "Name"], ["email", "E-mail"],
  ["phone", "Phone"], ["total", "Total"], ["currency", "Currency"], ["payment_status", "Payment"],
  ["amount_paid", "Amount paid"], ["payment_method", "Payment method"], ["confirmation_sent", "Confirmation sent"],
  ["source", "Source"], ["message", "Guest message"], ["notes", "Internal notes"], ["created_at", "Received"],
];

function cell(v) {
  let s = v instanceof Date ? v.toISOString() : String(v ?? "");
  if (/^\+[\d\s()-]+$/.test(s)) s = " " + s; // phone number: leading space keeps it as text in Excel
  else if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formulas
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request) {
  if (!isAdmin(request)) return new Response("Not logged in", { status: 401 });
  const { rows } = await query("SELECT * FROM ba_bookings ORDER BY check_in, created_at");
  const csv = "﻿" + [COLS.map((c) => c[1]).join(","), ...rows.map((r) => COLS.map(([k]) => cell(r[k])).join(","))].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hotel-alvers-bookings-${date}.csv"`,
    },
  });
}
