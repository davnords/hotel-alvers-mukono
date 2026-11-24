// Admin data API (requires login).
// GET   → settings, room types, bookings (sorted by stay date), event enquiries, photos
// PATCH → { action: "...", ... } to change bookings, rooms, prices, photos, texts
import { NextResponse } from "next/server";
import { query, getPool, getSettings, ensureSchema, availableRooms } from "@/lib/booking/db";
import { isAdmin } from "@/lib/booking/auth";
import { cleanText, isIsoDate, nightsBetween, isEmail, makeRef, MAX_NIGHTS } from "@/lib/booking/utils";
import {
  calcPrice, BOOKING_STATUSES, BLOCKING_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS,
  BOOKING_SOURCES, INQUIRY_STATUSES, PUBLIC_SETTING_KEYS,
} from "@/lib/booking/shared";

const keys = (list) => list.map((x) => (Array.isArray(x) ? x[0] : x));

function unauthorized() {
  return NextResponse.json({ error: "Not logged in" }, { status: 401 });
}
function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
function int(v, min = 0, max = 1e10) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}
const stamp = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16).replace("T", " ");

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  const settings = await getSettings();
  const rooms = (await query("SELECT * FROM ba_room_types ORDER BY sort_order, id")).rows;
  const bookings = (await query("SELECT * FROM ba_bookings ORDER BY check_in ASC, created_at ASC")).rows;
  const inquiries = (await query(
    "SELECT * FROM ba_inquiries ORDER BY event_date ASC NULLS LAST, created_at ASC"
  )).rows;
  const photos = (await query(
    "SELECT id, url, caption, on_booking, on_events, sort_order FROM ba_photos ORDER BY sort_order, id"
  )).rows.map((p) => ({ ...p, src: p.url || `/api/booking/photo/${p.id}` }));
  return NextResponse.json({ settings, rooms, bookings, inquiries, photos });
}

// Create or update a booking (manual booking, rebooking, payment, notes …).
async function saveBooking(b) {
  const isNew = !b.id;
  const checkIn = b.check_in, checkOut = b.check_out;
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return bad("Please enter check-in and check-out dates.");
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return bad("Check-out must be after check-in.");
  if (nights > MAX_NIGHTS * 6) return bad("Stay is too long.");
  const rooms = int(b.rooms, 1, 50), guests = int(b.guests, 1, 200);
  if (!rooms || !guests) return bad("Please enter number of rooms and guests.");
  const status = keys(BOOKING_STATUSES).includes(b.status) ? b.status : "confirmed";
  const paymentStatus = keys(PAYMENT_STATUSES).includes(b.payment_status) ? b.payment_status : "unpaid";
  const paymentMethod = PAYMENT_METHODS.includes(b.payment_method) ? b.payment_method : "";
  const source = BOOKING_SOURCES.includes(b.source) ? b.source : isNew ? "phone" : "website";
  const name = cleanText(b.name, 120), email = cleanText(b.email, 160).toLowerCase(), phone = cleanText(b.phone, 30);
  if (name.length < 2) return bad("Please enter the guest's name.");
  if (email && !isEmail(email)) return bad("The e-mail address is not valid.");
  const amountPaid = int(b.amount_paid ?? 0) ?? 0;

  await ensureSchema();
  const settings = await getSettings();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const rt = (await client.query("SELECT * FROM ba_room_types WHERE id = $1", [int(b.room_type_id, 1)])).rows[0];
    if (!rt) { await client.query("ROLLBACK"); return bad("Please choose a room type."); }
    if (guests > rooms * rt.max_guests) {
      await client.query("ROLLBACK");
      return bad(`Max ${rt.max_guests} guests per room for this room type.`);
    }
    const old = isNew ? null : (await client.query("SELECT * FROM ba_bookings WHERE id = $1 FOR UPDATE", [int(b.id, 1)])).rows[0];
    if (!isNew && !old) { await client.query("ROLLBACK"); return bad("Booking not found.", 404); }

    if (BLOCKING_STATUSES.includes(status)) {
      await client.query("SELECT pg_advisory_xact_lock(4711, $1)", [rt.id]);
      const free = await availableRooms(client, rt.id, rt.total_rooms, checkIn, checkOut, old ? old.id : null);
      if (free < rooms) {
        await client.query("ROLLBACK");
        return bad(free === 0
          ? `${rt.name} is fully booked on some of those nights.`
          : `Only ${free} room(s) of ${rt.name} are free for those dates.`, 409);
      }
    }

    // Price: recalculated from today's room prices, unless staff typed a different total.
    const auto = calcPrice({ pricePerNight: rt.price_per_night, extraPersonFee: rt.extra_person_fee, nights, rooms, guests }).total;
    const total = b.total_manual && int(b.total) !== null ? int(b.total) : auto;

    // Keep a short change log (rebooking, cancellations, payments).
    const log = [];
    if (old) {
      const oldIn = old.check_in, oldOut = old.check_out;
      if (oldIn !== checkIn || oldOut !== checkOut || old.room_type_id !== rt.id || old.rooms !== rooms) {
        log.push(`Rebooked from ${oldIn}→${oldOut} ${old.room_type_name} ×${old.rooms} to ${checkIn}→${checkOut} ${rt.name} ×${rooms}`);
      }
      if (old.status !== status) log.push(`Status ${old.status} → ${status}`);
      if (old.amount_paid !== amountPaid || old.payment_status !== paymentStatus) {
        log.push(`Payment ${paymentStatus}, paid ${amountPaid}${paymentMethod ? " (" + paymentMethod + ")" : ""}`);
      }
      if (old.total !== total) log.push(`Total ${old.total} → ${total}`);
    } else {
      log.push(`Created by staff (${source})`);
    }
    const history = ((old?.history || "") + log.map((l) => `\n${stamp()}  ${l}`).join("")).trim();

    const vals = [
      rt.id, rt.name, checkIn, checkOut, nights, rooms, guests, rt.price_per_night, rt.extra_person_fee, total,
      name, email, phone, cleanText(b.message, 1500), status, paymentStatus, amountPaid, paymentMethod,
      cleanText(b.notes, 3000), !!b.confirmation_sent, source, history,
    ];
    let saved;
    if (isNew) {
      saved = (await client.query(
        `INSERT INTO ba_bookings (room_type_id, room_type_name, check_in, check_out, nights, rooms, guests, price_per_night,
           extra_person_fee, total, name, email, phone, message, status, payment_status, amount_paid, payment_method,
           notes, confirmation_sent, source, history, ref, currency)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING id, ref`,
        [...vals, makeRef("ALV"), settings.currency]
      )).rows[0];
    } else {
      saved = (await client.query(
        `UPDATE ba_bookings SET room_type_id=$1, room_type_name=$2, check_in=$3, check_out=$4, nights=$5, rooms=$6, guests=$7,
           price_per_night=$8, extra_person_fee=$9, total=$10, name=$11, email=$12, phone=$13, message=$14, status=$15,
           payment_status=$16, amount_paid=$17, payment_method=$18, notes=$19, confirmation_sent=$20, source=$21, history=$22,
           updated_at=NOW()
         WHERE id=$23 RETURNING id, ref`,
        [...vals, old.id]
      )).rows[0];
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, id: saved.id, ref: saved.ref });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return bad("Could not save the booking.", 500);
  } finally {
    client.release();
  }
}

export async function PATCH(request) {
  if (!isAdmin(request)) return unauthorized();
  let b;
  try { b = await request.json(); } catch { return bad("Invalid request"); }

  switch (b.action) {
    case "saveBooking":
      return saveBooking(b.booking || {});

    case "bookingStatus": {
      if (!keys(BOOKING_STATUSES).includes(b.status)) return bad("Invalid status");
      const old = (await query("SELECT * FROM ba_bookings WHERE id=$1", [int(b.id, 1)])).rows[0];
      if (!old) return bad("Booking not found", 404);
      // Re-activating a cancelled booking must not overbook.
      if (BLOCKING_STATUSES.includes(b.status) && !BLOCKING_STATUSES.includes(old.status)) {
        const rt = (await query("SELECT * FROM ba_room_types WHERE id=$1", [old.room_type_id])).rows[0];
        const free = rt ? await availableRooms(getPool(), rt.id, rt.total_rooms, old.check_in, old.check_out, old.id) : 0;
        if (free < old.rooms) return bad("The rooms have been booked by someone else in the meantime – rebook to other dates.", 409);
      }
      await query(
        "UPDATE ba_bookings SET status=$1, history = TRIM(history || $3), updated_at=NOW() WHERE id=$2",
        [b.status, old.id, `\n${stamp()}  Status ${old.status} → ${b.status}`]
      );
      break;
    }
    case "confirmationSent": {
      await query("UPDATE ba_bookings SET confirmation_sent=$1, updated_at=NOW() WHERE id=$2", [!!b.value, int(b.id, 1)]);
      break;
    }
    case "inquiry": {
      const st = keys(INQUIRY_STATUSES).includes(b.status) ? b.status : "new";
      await query("UPDATE ba_inquiries SET status=$1, notes=$2 WHERE id=$3", [st, cleanText(b.notes, 3000), int(b.id, 1)]);
      break;
    }
    case "saveRoom": {
      const r = b.room || {};
      const vals = {
        name: cleanText(r.name, 100),
        description: cleanText(r.description, 500),
        price: int(r.price_per_night),
        extra: int(r.extra_person_fee),
        total: int(r.total_rooms, 0, 500),
        max: int(r.max_guests, 1, 10),
        image: cleanText(r.image_url, 300),
        active: r.active !== false,
        sort: int(r.sort_order, 0, 1000) ?? 0,
      };
      if (!vals.name || vals.price === null || vals.extra === null || vals.total === null || vals.max === null) {
        return bad("Please fill in name, price, extra fee, number of rooms and max guests.");
      }
      const params = [vals.name, vals.description, vals.price, vals.extra, vals.total, vals.max, vals.image, vals.active, vals.sort];
      if (r.id) {
        await query(
          `UPDATE ba_room_types SET name=$1, description=$2, price_per_night=$3, extra_person_fee=$4,
             total_rooms=$5, max_guests=$6, image_url=$7, active=$8, sort_order=$9 WHERE id=$10`,
          [...params, int(r.id, 1)]
        );
      } else {
        await query(
          `INSERT INTO ba_room_types (name, description, price_per_night, extra_person_fee, total_rooms, max_guests, image_url, active, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          params
        );
      }
      break;
    }
    case "settings": {
      const s = b.settings || {};
      if (s.currency !== undefined && !/^[A-Z]{3}$/.test(String(s.currency).trim().toUpperCase())) {
        return bad("Use a 3-letter currency code, e.g. UGX");
      }
      for (const k of PUBLIC_SETTING_KEYS) {
        if (s[k] === undefined) continue;
        let v = cleanText(s[k], 600);
        if (k === "currency") v = v.toUpperCase();
        await query(
          "INSERT INTO ba_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [k, v]
        );
      }
      break;
    }
    case "addPhoto": {
      const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(b.dataUrl || "");
      if (!m) return bad("Please upload a JPG, PNG or WebP image.");
      const buf = Buffer.from(m[3], "base64");
      if (buf.length > 3 * 1024 * 1024) return bad("Image is too large (max 3 MB).");
      const max = (await query("SELECT COALESCE(MAX(sort_order),0)::int AS m FROM ba_photos")).rows[0].m;
      await query(
        "INSERT INTO ba_photos (data, mime, caption, on_booking, on_events, sort_order) VALUES ($1,$2,$3,$4,$5,$6)",
        [buf, m[1], cleanText(b.caption, 120), b.on_booking !== false, !!b.on_events, max + 1]
      );
      break;
    }
    case "updatePhoto": {
      await query(
        "UPDATE ba_photos SET caption=$1, on_booking=$2, on_events=$3, sort_order=$4 WHERE id=$5",
        [cleanText(b.caption, 120), !!b.on_booking, !!b.on_events, int(b.sort_order, 0, 10000) ?? 0, int(b.id, 1)]
      );
      break;
    }
    case "deletePhoto": {
      await query("DELETE FROM ba_photos WHERE id=$1", [int(b.id, 1)]);
      break;
    }
    default:
      return bad("Unknown action");
  }
  return NextResponse.json({ ok: true });
}
