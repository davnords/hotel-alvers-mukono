// GET /api/booking/info – public hotel texts, contact details and photo gallery.
import { NextResponse } from "next/server";
import { query, getSettings } from "@/lib/booking/db";
import { PUBLIC_SETTING_KEYS } from "@/lib/booking/shared";

// Reading the request makes Next.js run this on every visit (never frozen at build time),
// so changes made in the admin show up immediately – works in Next 13.4 → 16.
export async function GET(request) {
  try {
    void request.headers.get("accept");
    const all = await getSettings();
    const settings = Object.fromEntries(PUBLIC_SETTING_KEYS.map((k) => [k, all[k]]));
    const { rows } = await query(
      "SELECT id, url, caption, on_booking, on_events FROM ba_photos ORDER BY sort_order, id"
    );
    const photos = rows.map((p) => ({
      id: p.id,
      src: p.url || `/api/booking/photo/${p.id}`,
      caption: p.caption,
      onBooking: p.on_booking,
      onEvents: p.on_events,
    }));
    return NextResponse.json({ settings, photos });
  } catch (e) {
    if (e?.digest) throw e;
    console.error(e);
    return NextResponse.json({ error: "Could not load hotel info" }, { status: 500 });
  }
}
