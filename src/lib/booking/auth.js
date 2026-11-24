// Simple password login for the hotel admin page.
// Set ADMIN_PASSWORD in Vercel. The login is remembered with a signed cookie for 7 days.
import crypto from "crypto";

export const COOKIE = "ba_admin";
const MAX_AGE = 7 * 24 * 3600;

function secret() {
  return (process.env.ADMIN_SESSION_SECRET || "") + "|" + (process.env.ADMIN_PASSWORD || "");
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof pw !== "string") return false;
  const a = crypto.createHash("sha256").update(pw).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

export function createSessionValue() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${exp}.${sign(String(exp))}`;
}

export function isAdmin(request) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const v = request.cookies.get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE,
};
