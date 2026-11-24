// POST /api/booking/reserve – creates a PRELIMINARY room booking (status "pending").
// No payment is taken. The guest gets an automatic e-mail saying the hotel will confirm soon.
import { NextResponse } from "next/server";
import { ensureSchema, getPool, getSettings, availableRooms } from "@/lib/booking/db";
import {
  isIsoDate, nightsBetween, todayInUganda, calcPrice, makeRef, cleanText,
  isEmail, isPhone, formatMoney, prettyDate, MAX_NIGHTS,
} from "@/lib/booking/utils";
import { sendMail, hotelEmail, buildEmail } from "@/lib/booking/mail";
import { notifyWhatsApp } from "@/lib/booking/whatsapp";


function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return bad("Invalid request"); }

  if (body.website) return NextResponse.json({ ok: true, ref: "OK" }); // spam trap

  const checkIn = body.checkIn, checkOut = body.checkOut;
  const roomTypeId = parseInt(body.roomTypeId, 10);
  const rooms = parseInt(body.rooms, 10);
  const guests = parseInt(body.guests, 10);
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 30);
  const message = cleanText(body.message, 1500);

  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return bad("Please choose check-in and check-out dates.");
  if (checkIn < todayInUganda()) return bad("Check-in date cannot be in the past.");
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return bad("Check-out must be after check-in.");
  if (nights > MAX_NIGHTS) return bad(`For stays longer than ${MAX_NIGHTS} nights, please contact us directly.`);
  if (!roomTypeId) return bad("Please choose a room type.");
  if (!(rooms >= 1 && rooms <= 20)) return bad("Please choose number of rooms.");
  if (!(guests >= 1)) return bad("Please choose number of guests.");
  if (name.length < 2) return bad("Please enter your name.");
  if (!isEmail(email)) return bad("Please enter a valid e-mail address.");
  if (!isPhone(phone)) return bad("Please enter a valid phone number.");

  await ensureSchema();
  const settings = await getSettings();
  const client = await getPool().connect();
  let booking;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM ba_room_types WHERE id = $1 AND active = TRUE", [roomTypeId]
    );
    const rt = rows[0];
    if (!rt) { await client.query("ROLLBACK"); return bad("Room type not found."); }
    if (guests > rooms * rt.max_guests) {
      await client.query("ROLLBACK");
      return bad(`Max ${rt.max_guests} guests per room – please add another room.`);
    }
    if (guests < rooms) {
      await client.query("ROLLBACK");
      return bad("Each room needs at least one guest.");
    }
    // Lock this room type so two guests can't grab the last room at the same moment.
    await client.query("SELECT pg_advisory_xact_lock(4711, $1)", [roomTypeId]);
    const free = await availableRooms(client, rt.id, rt.total_rooms, checkIn, checkOut);
    if (free < rooms) {
      await client.query("ROLLBACK");
      return bad(free === 0
        ? "Sorry, this room type is fully booked for those dates."
        : `Sorry, only ${free} room(s) of this type are available for those dates.`, 409);
    }
    const price = calcPrice({
      pricePerNight: rt.price_per_night, extraPersonFee: rt.extra_person_fee, nights, rooms, guests,
    });
    const ref = makeRef("ALV");
    const ins = await client.query(
      `INSERT INTO ba_bookings (ref, room_type_id, room_type_name, check_in, check_out, nights, rooms, guests,
         price_per_night, extra_person_fee, total, currency, name, email, phone, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [ref, rt.id, rt.name, checkIn, checkOut, nights, rooms, guests,
       rt.price_per_night, rt.extra_person_fee, price.total, settings.currency, name, email, phone, message]
    );
    await client.query("COMMIT");
    booking = ins.rows[0];
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return bad("Something went wrong. Please try again or contact us by phone.", 500);
  } finally {
    client.release();
  }

  const cur = booking.currency;
  const rowsForMail = [
    ["Booking reference", booking.ref],
    ["Room type", booking.room_type_name],
    ["Check-in", `${prettyDate(booking.check_in)} (from ${settings.check_in_time})`],
    ["Check-out", `${prettyDate(booking.check_out)} (by ${settings.check_out_time})`],
    ["Nights", String(booking.nights)],
    ["Rooms", String(booking.rooms)],
    ["Guests", String(booking.guests)],
    ["Estimated total", `${formatMoney(booking.total, cur)} (breakfast included)`],
  ];

  const guestMail = buildEmail({
    intro: `Dear ${booking.name},\n\nThank you for your booking request at Hotel Alvers. This is a preliminary booking – our staff will contact you as soon as possible to confirm your reservation.`,
    rows: rowsForMail,
    outro: "No payment has been taken.\nIf you have any questions, simply reply to this e-mail or call us.",
    info: settings,
    showMap: true,
  });
  const hotelMail = buildEmail({
    intro: "New room booking request from the website. Please confirm with the guest.",
    rows: [...rowsForMail, ["Name", booking.name], ["E-mail", booking.email], ["Phone", booking.phone], ["Message", booking.message || "–"]],
    info: settings,
  });

  await Promise.all([
    sendMail({ to: booking.email, subject: `Booking request received – ${booking.ref}`, ...guestMail, replyTo: hotelEmail() || undefined }),
    hotelEmail()
      ? sendMail({ to: hotelEmail(), subject: `New booking ${booking.ref}: ${booking.name}, ${prettyDate(booking.check_in)}`, ...hotelMail, replyTo: booking.email })
      : null,
    notifyWhatsApp(
      `🛏️ New booking ${booking.ref}\n${booking.name} · ${booking.phone}\n${booking.room_type_name}\n` +
      `${prettyDate(booking.check_in)} → ${prettyDate(booking.check_out)} (${booking.nights} night${booking.nights > 1 ? "s" : ""})\n` +
      `${booking.rooms} room(s), ${booking.guests} guest(s) · ${formatMoney(booking.total, cur)}` +
      (booking.message ? `\n"${booking.message}"` : "") + `\nPlease confirm with the guest.`
    ),
  ]);

  return NextResponse.json({
    ok: true,
    ref: booking.ref,
    total: booking.total,
    currency: cur,
    nights: booking.nights,
  });
}
