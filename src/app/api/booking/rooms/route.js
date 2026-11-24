// GET /api/booking/rooms?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
// Returns active room types, prices and (if dates given) how many rooms are free.
import { NextResponse } from "next/server";
import { query, getSettings, getPool, availableRooms } from "@/lib/booking/db";
import { isIsoDate, nightsBetween, MAX_NIGHTS } from "@/lib/booking/utils";


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const settings = await getSettings();
    const { rows } = await query(
      `SELECT id, name, description, price_per_night, extra_person_fee, total_rooms, max_guests, image_url
       FROM ba_room_types WHERE active = TRUE ORDER BY sort_order, id`
    );
    const withDates =
      isIsoDate(checkIn) && isIsoDate(checkOut) &&
      nightsBetween(checkIn, checkOut) > 0 && nightsBetween(checkIn, checkOut) <= MAX_NIGHTS;

    const rooms = [];
    for (const r of rows) {
      const available = withDates
        ? await availableRooms(getPool(), r.id, r.total_rooms, checkIn, checkOut)
        : null;
      rooms.push({
        id: r.id,
        name: r.name,
        description: r.description,
        pricePerNight: r.price_per_night,
        extraPersonFee: r.extra_person_fee,
        maxGuests: r.max_guests,
        imageUrl: r.image_url,
        available,
      });
    }
    return NextResponse.json({ currency: settings.currency, rooms });
  } catch (e) {
    if (e?.digest) throw e; // let Next.js handle its own internal signals
    console.error(e);
    return NextResponse.json({ error: "Could not load rooms" }, { status: 500 });
  }
}
