// Sends e-mails (auto-reply to the guest + notification to the hotel).
// Simplest setup: the hotel's Gmail account with an "App password".
//   SMTP_USER=hotelalvers@gmail.com
//   SMTP_PASS=<16-character Gmail app password>
//   HOTEL_NOTIFY_EMAIL=hotelalvers@gmail.com   (who receives new requests)
// Optional: SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465), MAIL_FROM.
// If SMTP is not configured, bookings still work — e-mails are just skipped.
import nodemailer from "nodemailer";
import { escapeHtml } from "./utils";
import { DEFAULT_SETTINGS, mapsLink } from "./shared";

let transporter;

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const HOTEL_NAME = "Hotel Alvers Mukono";

export async function sendMail({ to, subject, text, html, replyTo }) {
  const t = getTransporter();
  if (!t) {
    console.warn("[booking] SMTP not configured – e-mail skipped:", subject);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || `"${HOTEL_NAME}" <${process.env.SMTP_USER}>`,
      to, subject, text, html, replyTo,
    });
    return true;
  } catch (e) {
    console.error("[booking] e-mail failed:", e.message);
    return false;
  }
}

export function hotelEmail() {
  return process.env.HOTEL_NOTIFY_EMAIL || process.env.SMTP_USER || "";
}

// Turns [label, value] rows into a simple, readable e-mail (HTML + plain text).
// `info` = hotel settings (address, phone, map) so the footer is always up to date.
export function buildEmail({ intro, rows, outro, info = {}, showMap = false }) {
  const st = { ...DEFAULT_SETTINGS, ...info };
  const map = mapsLink(st.map_query);
  const text =
    `${intro}\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    (outro ? `\n\n${outro}` : "") +
    (showMap ? `\n\nFind us on Google Maps: ${map}` : "") +
    `\n\n${HOTEL_NAME}\n${st.address}\nTel: ${st.phone}`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#2b2a26">
    <h2 style="color:#2f4a3a;margin-bottom:4px">${HOTEL_NAME}</h2>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${escapeHtml(intro).replace(/\n/g, "<br>")}</p>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#777;width:40%">${escapeHtml(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee"><b>${escapeHtml(v)}</b></td></tr>`).join("")}
    </table>
    ${outro ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${escapeHtml(outro).replace(/\n/g, "<br>")}</p>` : ""}
    ${showMap ? `
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:24px 0 8px">
      <a href="${escapeHtml(map)}" style="display:inline-block;background:#2f4a3a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold">📍 Find us on Google Maps</a>
    </p>` : ""}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin-top:${showMap ? 8 : 24}px">
      ${HOTEL_NAME} · ${escapeHtml(st.address)}<br>Tel: ${escapeHtml(st.phone)}
    </p>
  </div>`;
  return { text, html };
}
