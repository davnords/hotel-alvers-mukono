// Database connection + automatic table setup for the booking system.
// Works with any PostgreSQL database (e.g. Neon via Vercel Marketplace).
// Requires the environment variable DATABASE_URL.
import { Pool, types } from "pg";
import { DEFAULT_SETTINGS, BLOCKING_STATUSES } from "./shared";

// Return DATE columns as plain "YYYY-MM-DD" strings (avoids time-zone shifts).
types.setTypeParser(1082, (v) => v);

let pool;
let schemaReady;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const local = /localhost|127\.0\.0\.1|\/var\/run/.test(url) || url.includes("host=/");
    pool = new Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

const DEFAULT_ROOMS = [
  {
    name: "Double Room",
    description: "Comfortable double room with private bathroom and mosquito net. Breakfast included.",
    price: 150000, extra: 30000, total: 6, max: 2, image: "/booking/double-room.jpg", sort: 1,
  },
  {
    name: "Double Room with Garden View",
    description: "Double room overlooking the garden. Private bathroom and mosquito net. Breakfast included.",
    price: 170000, extra: 30000, total: 4, max: 2, image: "/booking/garden-view.jpg", sort: 2,
  },
  {
    name: "Double Room De Luxe",
    description: "Spacious de luxe room with premium furnishing, TV and private bathroom. Breakfast included.",
    price: 200000, extra: 30000, total: 3, max: 2, image: "/booking/deluxe.jpg", sort: 3,
  },
  {
    name: "Double Room De Luxe with Garden View",
    description: "Our finest room – spacious de luxe room with a view over the garden. Breakfast included.",
    price: 230000, extra: 30000, total: 2, max: 2, image: "/booking/deluxe-garden-view.jpg", sort: 4,
  },
];

const G = "/booking/gallery/";
const DEFAULT_PHOTOS = [
  { url: G + "hotel.jpg", caption: "Hotel Alvers, Mukono", booking: true, events: true },
  { url: G + "double-room.jpg", caption: "Double room", booking: true, events: false },
  { url: G + "deluxe.jpg", caption: "De luxe room", booking: true, events: false },
  { url: G + "two-beds.jpg", caption: "Room with two beds", booking: true, events: false },
  { url: G + "bathroom.jpg", caption: "Private bathroom", booking: true, events: false },
  { url: G + "garden-view.jpg", caption: "Garden view room", booking: true, events: false },
  { url: G + "wedding-1.jpg", caption: "Wedding reception", booking: true, events: true },
  { url: G + "conference.jpg", caption: "Conference room", booking: false, events: true },
  { url: G + "dinner-1.jpg", caption: "Dinner setting", booking: false, events: true },
  { url: G + "dinner-2.jpg", caption: "Banquet tables", booking: false, events: true },
  { url: G + "wedding-stage.jpg", caption: "Wedding stage", booking: false, events: true },
  { url: G + "hall.jpg", caption: "Our event hall", booking: true, events: true },
];

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS ba_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ba_room_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          price_per_night INTEGER NOT NULL DEFAULT 0,
          extra_person_fee INTEGER NOT NULL DEFAULT 0,
          total_rooms INTEGER NOT NULL DEFAULT 0,
          max_guests INTEGER NOT NULL DEFAULT 2,
          image_url TEXT NOT NULL DEFAULT '',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS ba_bookings (
          id SERIAL PRIMARY KEY,
          ref TEXT UNIQUE NOT NULL,
          room_type_id INTEGER REFERENCES ba_room_types(id),
          room_type_name TEXT NOT NULL,
          check_in DATE NOT NULL,
          check_out DATE NOT NULL,
          nights INTEGER NOT NULL,
          rooms INTEGER NOT NULL,
          guests INTEGER NOT NULL,
          price_per_night INTEGER NOT NULL,
          extra_person_fee INTEGER NOT NULL,
          total INTEGER NOT NULL,
          currency TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          message TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS amount_paid INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '';
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'website';
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS history TEXT NOT NULL DEFAULT '';
        ALTER TABLE ba_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        CREATE INDEX IF NOT EXISTS ba_bookings_dates ON ba_bookings (room_type_id, check_in, check_out);
        CREATE TABLE IF NOT EXISTS ba_inquiries (
          id SERIAL PRIMARY KEY,
          ref TEXT UNIQUE NOT NULL,
          event_type TEXT NOT NULL,
          event_date DATE,
          guests INTEGER,
          name TEXT NOT NULL,
          organization TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          needs_rooms BOOLEAN NOT NULL DEFAULT FALSE,
          message TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE ba_inquiries ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
        CREATE TABLE IF NOT EXISTS ba_photos (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL DEFAULT '',
          data BYTEA,
          mime TEXT NOT NULL DEFAULT 'image/jpeg',
          caption TEXT NOT NULL DEFAULT '',
          on_booking BOOLEAN NOT NULL DEFAULT TRUE,
          on_events BOOLEAN NOT NULL DEFAULT FALSE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
        await db.query(`INSERT INTO ba_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [k, v]);
      }
      const ph = await db.query("SELECT COUNT(*)::int AS n FROM ba_photos");
      if (ph.rows[0].n === 0) {
        let i = 0;
        for (const p of DEFAULT_PHOTOS) {
          await db.query(
            "INSERT INTO ba_photos (url, caption, on_booking, on_events, sort_order) VALUES ($1,$2,$3,$4,$5)",
            [p.url, p.caption, p.booking, p.events, ++i]
          );
        }
      }
      const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM ba_room_types");
      if (rows[0].n === 0) {
        for (const r of DEFAULT_ROOMS) {
          await db.query(
            `INSERT INTO ba_room_types (name, description, price_per_night, extra_person_fee, total_rooms, max_guests, image_url, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [r.name, r.description, r.price, r.extra, r.total, r.max, r.image, r.sort]
          );
        }
      }
    })().catch((e) => {
      schemaReady = undefined;
      throw e;
    });
  }
  return schemaReady;
}

export async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}

export async function getSettings() {
  const { rows } = await query("SELECT key, value FROM ba_settings");
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

// Number of rooms of a type still free for EVERY night in [checkIn, checkOut).
// Every booking that is not cancelled / no-show blocks rooms, so the hotel is never overbooked.
export async function availableRooms(client, roomTypeId, totalRooms, checkIn, checkOut, excludeBookingId = null) {
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(booked), 0)::int AS max_booked FROM (
       SELECT d::date AS night,
              (SELECT COALESCE(SUM(rooms),0) FROM ba_bookings b
                WHERE b.room_type_id = $1
                  AND b.status = ANY($5::text[])
                  AND b.check_in <= d::date AND b.check_out > d::date
                  AND ($4::int IS NULL OR b.id <> $4::int)) AS booked
       FROM generate_series($2::date, $3::date - INTERVAL '1 day', INTERVAL '1 day') d
     ) t`,
    [roomTypeId, checkIn, checkOut, excludeBookingId, BLOCKING_STATUSES]
  );
  return Math.max(0, totalRooms - rows[0].max_booked);
}
