"use client";
import Link from "next/link";
// Room booking form for guests: dates → room type → details → preliminary booking.
import { useEffect, useMemo, useRef, useState } from "react";
import PhoneInput from "./PhoneInput";
import s from "./booking.module.css";
import { calcPrice, formatMoney, DEFAULT_SETTINGS } from "@/lib/booking/shared";
import { useToday } from "./useToday";

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function nights(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export default function BookingForm({ settings = DEFAULT_SETTINGS }) {
  const t = useToday();
  return t ? <BookingFormInner today={t} settings={settings} /> : <div className={s.card}><p className={s.muted}>Loading…</p></div>;
}

function BookingFormInner({ today, settings }) {
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const guestsRef = useRef(null);
  const [scrollTick, setScrollTick] = useState(0);
  // When a room is picked, glide down so the "rooms / guests" row is in view.
  function pickRoom(id) { setRoomId(id); setScrollTick((t) => t + 1); }
  useEffect(() => {
    if (!scrollTick || !guestsRef.current) return;
    const el = guestsRef.current;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove(s.flash); void el.offsetWidth; el.classList.add(s.flash);
  }, [scrollTick]);

  const n = nights(checkIn, checkOut);
  const datesOk = checkIn >= today && n >= 1;

  useEffect(() => {
    if (!datesOk) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/booking/rooms?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData({ error: "Could not load rooms" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [checkIn, checkOut, datesOk]);

  const room = data?.rooms?.find((r) => r.id === roomId);
  const currency = data?.currency || "UGX";
  const maxRooms = room ? Math.max(1, Math.min(room.available ?? 10, 10)) : 1;
  const maxGuests = room ? rooms * room.maxGuests : 2;

  // Keep rooms/guests within limits when the room or dates change.
  useEffect(() => {
    if (!room) return;
    if (rooms > maxRooms) setRooms(maxRooms);
  }, [room, rooms, maxRooms]);
  useEffect(() => {
    if (guests > maxGuests) setGuests(maxGuests);
    if (guests < rooms) setGuests(rooms);
  }, [guests, rooms, maxGuests]);
  useEffect(() => {
    if (room && room.available === 0) setRoomId(null);
  }, [room]);

  const price = useMemo(() => room && calcPrice({
    pricePerNight: room.pricePerNight, extraPersonFee: room.extraPersonFee, nights: n, rooms, guests,
  }), [room, n, rooms, guests]);

  function onCheckIn(v) {
    setCheckIn(v);
    if (!checkOut || checkOut <= v) setCheckOut(addDays(v, 1));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!room) return setError("Please choose a room type.");
    setSending(true);
    try {
      const r = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, roomTypeId: room.id, rooms, guests, ...form }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong");
      setDone({ ...d, roomName: room.name, email: form.email });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className={s.card}>
        <div className={s.success}>
          <span className={s.check}>✓</span>
          <h2>Thank you – your request is received</h2>
          <p>Your booking reference:</p>
          <div className={s.ref}>{done.ref}</div>
          <p>
            {done.roomName} · {done.nights} night{done.nights > 1 ? "s" : ""} · estimated {formatMoney(done.total, done.currency)}
          </p>
          <p className={s.note}>
            This is a <b>preliminary booking</b>. We have sent a confirmation of your request to <b>{done.email}</b>.
            Our staff will contact you as soon as possible to confirm your reservation. No payment is needed now.
          </p>
          <div className={s.actions} style={{ justifyContent: "center" }}>
            <Link className={s.btnGhost} href="/">Back to homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className={s.card}>
        <span className={s.step}>Step 1</span>
        <h2 className={s.sectionTitle}>When are you staying?</h2>
        <div className={s.grid}>
          <div className={s.field}>
            <label htmlFor="ci">Check-in</label>
            <input id="ci" className={s.input} type="date" min={today} value={checkIn}
              onChange={(e) => onCheckIn(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label htmlFor="co">Check-out</label>
            <input id="co" className={s.input} type="date" min={addDays(checkIn, 1)} value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)} required />
          </div>
          <div className={s.field}>
            <span className={s.label}>Length of stay</span>
            <div className={s.input} style={{ background: "transparent" }}>
              {datesOk ? `${n} night${n > 1 ? "s" : ""}` : "Choose valid dates"}
            </div>
          </div>
        </div>
        <p className={s.note}>Check-in from {settings.check_in_time} · Check-out by {settings.check_out_time} · Breakfast included</p>
      </div>

      <div className={s.card}>
        <span className={s.step}>Step 2</span>
        <h2 className={s.sectionTitle}>Choose your room</h2>
        {loading && !data && <p className={s.muted}>Loading rooms…</p>}
        {data?.error && <div className={s.error}>{data.error}</div>}
        <div className={s.rooms} style={{ opacity: loading ? 0.6 : 1 }}>
          {data?.rooms?.map((r) => {
            const full = r.available === 0;
            return (
              <button type="button" key={r.id} disabled={full}
                className={`${s.room} ${roomId === r.id ? s.roomSelected : ""}`}
                onClick={() => pickRoom(r.id)}>
                {r.imageUrl ? <img className={s.roomImg} src={r.imageUrl} alt={r.name} /> : <div className={s.roomImg} />}
                <div className={s.roomBody}>
                  <span className={s.roomName}>{r.name}</span>
                  <span className={s.roomDesc}>{r.description}</span>
                  <span className={s.price}>
                    {formatMoney(r.pricePerNight, data.currency)} <small>/ night</small>
                  </span>
                  {r.extraPersonFee > 0 && (
                    <span className={s.muted}>+ {formatMoney(r.extraPersonFee, data.currency)} / night for 2nd guest</span>
                  )}
                  {r.available !== null && (
                    <span className={`${s.badge} ${full ? s.badgeFull : ""}`}>
                      {full ? "Fully booked" : r.available <= 2 ? `Only ${r.available} left` : "Available"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {room && (
          <div ref={guestsRef} className={`${s.grid} ${s.guestRow}`} style={{ marginTop: 20 }}>
            <div className={s.field}>
              <label htmlFor="rooms">Number of rooms</label>
              <select id="rooms" className={s.select} value={rooms} onChange={(e) => setRooms(+e.target.value)}>
                {Array.from({ length: maxRooms }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label htmlFor="guests">Number of guests</label>
              <select id="guests" className={s.select} value={guests} onChange={(e) => setGuests(+e.target.value)}>
                {Array.from({ length: maxGuests - rooms + 1 }, (_, i) => i + rooms).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {room && price && (
        <div className={s.card}>
          <span className={s.step}>Step 3</span>
          <h2 className={s.sectionTitle}>Your details</h2>
          <div className={s.grid2}>
            <div>
              <div className={s.grid2} style={{ gridTemplateColumns: "1fr" }}>
                <div className={s.field}>
                  <label htmlFor="name">Full name *</label>
                  <input id="name" className={s.input} required value={form.name} autoComplete="name"
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className={s.field}>
                  <label htmlFor="email">E-mail *</label>
                  <input id="email" type="email" className={s.input} required value={form.email} autoComplete="email"
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className={s.field}>
                  <label htmlFor="phone">Phone (incl. country code) *</label>
                  <PhoneInput required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                </div>
                <div className={s.field}>
                  <label htmlFor="msg">Message / special requests</label>
                  <textarea id="msg" className={s.textarea} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <div className={s.hp} aria-hidden="true">
                  <input tabIndex={-1} autoComplete="off" value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <div className={s.summary}>
                <b style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 18 }}>{room.name}</b>
                <div className={s.summaryRow}><span>Dates</span><span>{checkIn} → {checkOut}</span></div>
                <div className={s.summaryRow}>
                  <span>{rooms} room{rooms > 1 ? "s" : ""} × {n} night{n > 1 ? "s" : ""}</span>
                  <span>{formatMoney(price.roomCost, currency)}</span>
                </div>
                {price.extraGuests > 0 && (
                  <div className={s.summaryRow}>
                    <span>Extra guest{price.extraGuests > 1 ? "s" : ""} ({price.extraGuests}) × {n} night{n > 1 ? "s" : ""}</span>
                    <span>{formatMoney(price.extraCost, currency)}</span>
                  </div>
                )}
                <div className={`${s.summaryRow} ${s.summaryTotal}`}>
                  <span>Estimated total</span><span>{formatMoney(price.total, currency)}</span>
                </div>
              </div>
              <p className={s.note}>
                Breakfast is included. This is a booking <b>request</b> – no payment is taken online.
                The hotel will contact you to confirm.
              </p>
            </div>
          </div>
          {error && <div className={s.error}>{error}</div>}
          <div className={s.actions}>
            <button className={s.btn} disabled={sending}>{sending ? "Sending…" : "Send booking request"}</button>
          </div>
        </div>
      )}
    </form>
  );
}
