// POST = log in with the admin password, DELETE = log out.
import { NextResponse } from "next/server";
import { checkPassword, createSessionValue, COOKIE, cookieOptions } from "@/lib/booking/auth";


export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not set in Vercel." }, { status: 500 });
  }
  let body = {};
  try { body = await request.json(); } catch {}
  if (!checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, createSessionValue(), cookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
