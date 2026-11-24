"use client";
// Hotel admin – the hotel's complete booking tool:
// bookings (rebook, payment, check-in, confirmation e-mail sent), manual bookings, occupancy
// calendar, event enquiries, rooms & prices, photos, hotel texts/contact info, CSV export.
import { useCallback, useEffect, useMemo, useState } from "react";
import s from "./booking.module.css";
import {
  formatMoney, calcPrice, BOOKING_STATUSES, BLOCKING_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS,
  BOOKING_SOURCES, INQUIRY_STATUSES, whatsappLink, mapsLink,
} from "@/lib/booking/shared";
import { ugandaToday as today } from "./useToday";

const label = (list, k) => (list.find((x) => x[0] === k) || [k, k])[1];
const fmtDate = (iso) => iso ? new Date(iso.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "–";
const fmtShort = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fmtCreated = (ts) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kampala" });
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const nightsBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

async function api(method, body) {
  const r = await fetch("/api/booking/admin/data", {
    method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || "Error"); e.status = r.status; throw e; }
  return d;
}

function confirmText(b, cur, st) {
  return `Dear ${b.name},\n\nWe are happy to confirm your booking at Hotel Alvers.\n\n` +
    `Booking reference: ${b.ref}\nRoom: ${b.room_type_name} × ${b.rooms}\nGuests: ${b.guests}\n` +
    `Check-in: ${fmtDate(b.check_in)} from ${st.check_in_time}\nCheck-out: ${fmtDate(b.check_out)} by ${st.check_out_time}\n` +
    `Total: ${formatMoney(b.total, cur)} (breakfast included)\n\n` +
    `Find us: ${mapsLink(st.map_query)}\n\nWe look forward to welcoming you!\n\nHotel Alvers Mukono\n${st.address}\nTel: ${st.phone}` + (st.whatsapp ? `\nWhatsApp: ${st.whatsapp}` : "");
}

/* ---------------- Login ---------------- */
function Login({ onDone }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/booking/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onDone(); else setErr(d.error || "Login failed");
  }
  return (
    <main className={s.wrap}>
      <form className={`${s.card} ${s.login}`} onSubmit={submit}>
        <h1 className={s.sectionTitle}>Hotel Alvers – Admin</h1>
        <div className={s.field}>
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" className={s.input} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </div>
        {err && <div className={s.error}>{err}</div>}
        <div className={s.actions}><button className={s.btn} disabled={busy}>Log in</button></div>
      </form>
    </main>
  );
}

/* ---------------- Booking editor (open, rebook, payment, new) ---------------- */
function BookingModal({ booking, rooms, settings, onSave, onClose }) {
  const isNew = !booking.id;
  const [b, setB] = useState(() => ({ total_manual: false, ...booking }));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setB({ ...b, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const rt = rooms.find((r) => r.id === +b.room_type_id);
  const n = b.check_in && b.check_out ? nightsBetween(b.check_in, b.check_out) : 0;
  const rebooked = !isNew && (b.check_in !== booking.check_in || b.check_out !== booking.check_out || +b.room_type_id !== booking.room_type_id || +b.rooms !== booking.rooms);
  // Existing bookings keep their agreed price unless the stay itself changes.
  const stayChanged = isNew || rebooked || +b.guests !== booking.guests;
  const calc = rt && n > 0 ? calcPrice({ pricePerNight: rt.price_per_night, extraPersonFee: rt.extra_person_fee, nights: n, rooms: +b.rooms || 1, guests: +b.guests || 1 }).total : 0;
  const auto = stayChanged ? calc : booking.total;
  const total = b.total_manual ? +b.total || 0 : auto;
  const balance = total - (+b.amount_paid || 0);
  const cur = booking.currency || settings.currency;
  const msg = confirmText({ ...b, room_type_name: rt?.name || b.room_type_name, total, ref: b.ref || "(new)" }, cur, settings);

  async function save(extra = {}) {
    setBusy(true); setErr("");
    try {
      await onSave({ ...b, ...extra, total, total_manual: true, room_type_id: +b.room_type_id, rooms: +b.rooms, guests: +b.guests, amount_paid: +b.amount_paid || 0 });
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  const actions = (
    <>
      <button className={s.btn} disabled={busy} onClick={() => save()}>{busy ? "Saving…" : isNew ? "Create booking" : rebooked ? "Save & rebook" : "Save"}</button>
      {!isNew && b.status !== "cancelled" && (
        <button className={s.btnGhost} disabled={busy} onClick={() => confirm(`Cancel booking ${booking.ref}?`) && save({ status: "cancelled" })}>Cancel booking</button>
      )}
    </>
  );

  return (
    <div className={s.modalBack} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Booking">
        <div className={s.modalHead}>
          <div>
            <h2 className={s.sectionTitle} style={{ margin: 0 }}>{isNew ? "New booking" : `Booking ${booking.ref}`}</h2>
            {!isNew && <span className={s.muted}>Received {fmtCreated(booking.created_at)} · via {booking.source}</span>}
          </div>
          <div className={s.modalTopActions}>{actions}<button className={s.btnGhost} onClick={onClose}>Close</button></div>
        </div>

        <fieldset className={s.fieldset}>
          <legend>Guest</legend>
          <div className={s.grid}>
            <div className={s.field}><label>Name *</label><input className={s.input} value={b.name} onChange={set("name")} /></div>
            <div className={s.field}><label>E-mail</label><input className={s.input} type="email" value={b.email} onChange={set("email")} /></div>
            <div className={s.field}><label>Phone</label><input className={s.input} value={b.phone} onChange={set("phone")} /></div>
            <div className={s.field}><label>Booked via</label>
              <select className={s.select} value={b.source} onChange={set("source")}>{BOOKING_SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
          </div>
          {b.message && (
            <div className={s.guestMsg}>
              <span>Message from the guest</span>
              <p>“{b.message}”</p>
            </div>
          )}
        </fieldset>

        <fieldset className={s.fieldset}>
          <legend>{isNew ? "Stay" : "Stay – change dates or room to rebook"}</legend>
          <div className={s.grid}>
            <div className={s.field}><label>Check-in</label><input type="date" className={s.input} value={b.check_in} onChange={(e) => setB({ ...b, check_in: e.target.value, check_out: b.check_out <= e.target.value ? addDays(e.target.value, 1) : b.check_out })} /></div>
            <div className={s.field}><label>Check-out</label><input type="date" className={s.input} min={b.check_in ? addDays(b.check_in, 1) : undefined} value={b.check_out} onChange={set("check_out")} /></div>
            <div className={s.field}><label>Room type</label>
              <select className={s.select} value={b.room_type_id} onChange={set("room_type_id")}>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.active ? "" : " (hidden)"}</option>)}
              </select>
            </div>
            <div className={s.field}><label>Rooms</label><input type="number" min="1" className={s.input} value={b.rooms} onChange={set("rooms")} /></div>
            <div className={s.field}><label>Guests</label><input type="number" min="1" className={s.input} value={b.guests} onChange={set("guests")} /></div>
            <div className={s.field}><label>Status</label>
              <select className={s.select} value={b.status} onChange={set("status")}>{BOOKING_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>
          </div>
          {n > 0 && <p className={s.muted} style={{ marginBottom: 0 }}>{n} night{n > 1 ? "s" : ""}{rebooked && " · saving will move the booking (availability is checked)"}</p>}
        </fieldset>

        <fieldset className={s.fieldset}>
          <legend>Price &amp; payment</legend>
          <div className={s.grid}>
            <div className={s.field}><label>Total ({cur})</label>
              {b.total_manual
                ? <input type="number" min="0" className={s.input} value={b.total} onChange={set("total")} />
                : <div className={s.input} style={{ background: "#fcfaf5" }}>{formatMoney(auto, cur)}{!stayChanged && <span className={s.muted}> · as booked</span>}</div>}
              <label className={s.checkbox} style={{ fontSize: 13, fontWeight: 400 }}>
                <input type="checkbox" checked={!!b.total_manual} onChange={(e) => setB({ ...b, total_manual: e.target.checked, total: e.target.checked ? total : b.total })} /> Set price manually (discount)
              </label>
            </div>
            <div className={s.field}><label>Payment status</label>
              <select className={s.select} value={b.payment_status} onChange={set("payment_status")}>{PAYMENT_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>
            <div className={s.field}><label>Amount paid ({cur})</label><input type="number" min="0" className={s.input} value={b.amount_paid} onChange={set("amount_paid")} /></div>
            <div className={s.field}><label>Payment method</label>
              <select className={s.select} value={b.payment_method} onChange={set("payment_method")}>{PAYMENT_METHODS.map((x) => <option key={x} value={x}>{x || "–"}</option>)}</select>
            </div>
          </div>
          <p style={{ margin: "10px 0 0", fontWeight: 600, color: balance > 0 ? "var(--danger)" : "var(--green)" }}>
            {balance > 0 ? `Balance due: ${formatMoney(balance, cur)}` : balance < 0 ? `Overpaid: ${formatMoney(-balance, cur)}` : "Fully paid"}
          </p>
        </fieldset>

        <fieldset className={s.fieldset}>
          <legend>Confirmation to guest</legend>
          <label className={s.checkbox}>
            <input type="checkbox" checked={!!b.confirmation_sent} onChange={set("confirmation_sent")} /> Confirmation e-mail has been sent to the guest
          </label>
          <div className={s.actions} style={{ marginTop: 10 }}>
            {b.email && <a className={s.btnGhost} href={`mailto:${b.email}?subject=${encodeURIComponent(`Booking confirmation ${b.ref || ""} – Hotel Alvers`)}&body=${encodeURIComponent(msg)}`}>✉ Write confirmation e-mail</a>}
            {b.phone && <a className={s.btnGhost} href={whatsappLink(b.phone, msg)} target="_blank" rel="noopener noreferrer">WhatsApp guest</a>}
          </div>
          <p className={s.muted} style={{ marginBottom: 0 }}>Opens a ready-written confirmation. Send it, then tick the box above and save.</p>
        </fieldset>

        <fieldset className={s.fieldset}>
          <legend>Internal notes (not shown to guest)</legend>
          <textarea className={s.textarea} style={{ minHeight: 70 }} value={b.notes} onChange={set("notes")} placeholder="E.g. airport pickup, late arrival, invoice to company…" />
          {b.history && <><div className={s.label} style={{ margin: "10px 0 4px" }}>History</div><pre className={s.history}>{b.history}</pre></>}
        </fieldset>

        {err && <div className={s.error}>{err}</div>}
        <div className={s.actions}>{actions}</div>
      </div>
    </div>
  );
}

/* ---------------- Bookings list ---------------- */
function Bookings({ data, onOpen, onNew, onStatus, onConfSent }) {
  const [view, setView] = useState("upcoming");
  const [q, setQ] = useState("");
  const t = today();
  const { bookings, settings } = data;
  const list = useMemo(() => {
    let l = bookings;
    if (view === "upcoming") l = l.filter((b) => b.check_out >= t && BLOCKING_STATUSES.includes(b.status));
    if (view === "pending") l = l.filter((b) => b.status === "pending");
    if (view === "unpaid") l = l.filter((b) => BLOCKING_STATUSES.includes(b.status) && b.payment_status !== "paid");
    if (view === "past") l = l.filter((b) => b.check_out < t).slice().reverse();
    if (view === "cancelled") l = l.filter((b) => b.status === "cancelled" || b.status === "no_show");
    if (q) {
      const k = q.toLowerCase();
      l = l.filter((b) => [b.name, b.email, b.phone, b.ref].some((x) => String(x).toLowerCase().includes(k)));
    }
    return l;
  }, [bookings, view, q, t]);

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters} style={{ marginBottom: 0 }}>
          {[["upcoming", "Upcoming"], ["pending", "Awaiting confirmation"], ["unpaid", "Not fully paid"], ["past", "Past"], ["cancelled", "Cancelled"], ["all", "All"]].map(([k, l]) => (
            <button key={k} className={`${s.tab} ${view === k ? s.tabActive : ""}`} onClick={() => setView(k)}>{l}</button>
          ))}
          <input className={s.input} style={{ maxWidth: 230 }} placeholder="Search name, e-mail, ref…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className={s.btnGhost} href="/api/booking/admin/export">Export to Excel (CSV)</a>
          <button className={s.btn} onClick={onNew}>+ New booking</button>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Check-in</th><th>Check-out</th><th>Nights</th><th>Guest</th><th>Contact</th>
              <th>Room</th><th>Amount</th><th>Payment</th><th>Status</th><th title="Confirmation e-mail sent to the guest">Mail sent</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={11} className={s.muted}>No bookings here.</td></tr>}
            {list.map((b) => {
              const inactive = !BLOCKING_STATUSES.includes(b.status);
              return (
                <tr key={b.id} className={inactive ? s.rowCancelled : b.check_out < t ? s.rowPast : ""}>
                  <td><b>{fmtDate(b.check_in)}</b></td>
                  <td>{fmtDate(b.check_out)}</td>
                  <td>{b.nights}</td>
                  <td>
                    <b>{b.name}</b><br /><span className={s.muted}>{b.ref}{b.source !== "website" ? ` · ${b.source}` : ""}</span>
                    {b.notes && <div className={s.muted} title={b.notes}>📝 {b.notes.slice(0, 40)}{b.notes.length > 40 ? "…" : ""}</div>}
                  </td>
                  <td>
                    {b.email && <><a href={`mailto:${b.email}`}>{b.email}</a><br /></>}
                    {b.phone} {b.phone && <a className={s.waLink} href={whatsappLink(b.phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp">WA</a>}
                  </td>
                  <td>{b.room_type_name}<br /><span className={s.muted}>{b.rooms} room{b.rooms > 1 ? "s" : ""} · {b.guests} guest{b.guests > 1 ? "s" : ""}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}><b>{formatMoney(b.total, b.currency)}</b></td>
                  <td>
                    <span className={`${s.pay} ${s["pay_" + b.payment_status]}`}>{label(PAYMENT_STATUSES, b.payment_status)}</span>
                    {b.amount_paid > 0 && b.payment_status !== "paid" && <div className={s.muted}>{formatMoney(b.amount_paid, b.currency)} paid</div>}
                  </td>
                  <td><span className={`${s.status} ${s["st_" + b.status]}`}>{label(BOOKING_STATUSES, b.status)}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <input type="checkbox" style={{ width: 20, height: 20 }} checked={!!b.confirmation_sent}
                      onChange={(e) => onConfSent(b.id, e.target.checked)} aria-label="Confirmation e-mail sent" />
                  </td>
                  <td><div className={s.rowActions}>
                    <button className={s.btnSmall} onClick={() => onOpen(b)}>Open / rebook</button>
                    {b.status === "pending" && <button className={s.btnSmall} onClick={() => onStatus(b.id, "confirmed")}>Confirm</button>}
                    {b.status === "confirmed" && b.check_in <= t && <button className={s.btnSmall} onClick={() => onStatus(b.id, "checked_in")}>Check in</button>}
                    {b.status === "checked_in" && <button className={s.btnSmall} onClick={() => onStatus(b.id, "checked_out")}>Check out</button>}
                    {inactive && <button className={s.btnSmall} onClick={() => onStatus(b.id, "pending")}>Restore</button>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={s.muted} style={{ marginTop: 10 }}>
        Sorted by date of stay. Every booking except cancelled / no-show reserves rooms. Click <b>Open / rebook</b> to move a booking to new dates,
        register payment or add notes. Tick <b>Mail sent</b> when you have e-mailed the guest a confirmation. Currency: {settings.currency}.
      </p>
    </>
  );
}

/* ---------------- Occupancy calendar ---------------- */
function Calendar({ data, onOpen }) {
  const [start, setStart] = useState(today());
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const t = today();
  const active = data.bookings.filter((b) => BLOCKING_STATUSES.includes(b.status));
  return (
    <>
      <div className={s.toolbar}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={s.btnGhost} onClick={() => setStart(addDays(start, -7))}>← Week</button>
          <button className={s.btnGhost} onClick={() => setStart(today())}>Today</button>
          <button className={s.btnGhost} onClick={() => setStart(addDays(start, 7))}>Week →</button>
        </div>
        <span className={s.muted}>Booked rooms / total per night. Hover a cell to see guests.</span>
      </div>
      <div className={s.calWrap}>
        <table className={s.cal}>
          <thead>
            <tr><th>Room type</th>{days.map((d) => <th key={d} className={d === t ? s.calToday : ""}>{fmtShort(d)}</th>)}</tr>
          </thead>
          <tbody>
            {data.rooms.map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b><br /><span className={s.muted}>{r.total_rooms} rooms</span></td>
                {days.map((d) => {
                  const bs = active.filter((b) => b.room_type_id === r.id && b.check_in <= d && b.check_out > d);
                  const used = bs.reduce((n, b) => n + b.rooms, 0);
                  const ratio = r.total_rooms ? used / r.total_rooms : 0;
                  const bg = used === 0 ? "#f2f6f1" : ratio >= 1 ? "#a33b2b" : ratio >= 0.6 ? "#e2a64a" : "#9cc4a6";
                  return (
                    <td key={d} className={d === t ? s.calToday : ""}>
                      <span className={s.calCell} style={{ background: bg, color: ratio >= 1 ? "#fff" : "#22372b", cursor: bs.length ? "pointer" : "default" }}
                        title={bs.map((b) => `${b.name} (${b.rooms})`).join("\n") || "Free"}
                        onClick={() => bs[0] && onOpen(bs[0])}>
                        {used}/{r.total_rooms}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.grid2} style={{ marginTop: 16 }}>
        {[["Arrivals today", active.filter((b) => b.check_in === t)], ["Departures today", active.filter((b) => b.check_out === t)]].map(([title, l]) => (
          <div key={title} className={s.roomEdit}>
            <b>{title} ({l.length})</b>
            {l.length === 0 && <p className={s.muted}>None</p>}
            {l.map((b) => (
              <p key={b.id} style={{ margin: "8px 0 0" }}>
                <a href="#" onClick={(e) => { e.preventDefault(); onOpen(b); }}>{b.name}</a> · {b.room_type_name} ×{b.rooms}
                {" "}<span className={`${s.pay} ${s["pay_" + b.payment_status]}`}>{label(PAYMENT_STATUSES, b.payment_status)}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- Event enquiries ---------------- */
function InquiryRow({ i, onSave }) {
  const [notes, setNotes] = useState(i.notes || "");
  return (
    <tr className={i.status === "closed" ? s.rowPast : ""}>
      <td><b>{fmtDate(i.event_date)}</b></td>
      <td>{i.event_type}<br /><span className={s.muted}>{i.ref}</span></td>
      <td>{i.guests ?? "–"}{i.needs_rooms && <><br /><span className={s.muted}>+ needs rooms</span></>}</td>
      <td>
        <b>{i.name}</b>{i.organization && <><br />{i.organization}</>}<br />
        <a href={`mailto:${i.email}?subject=Your enquiry ${i.ref} at Hotel Alvers`}>{i.email}</a><br />
        {i.phone} <a className={s.waLink} href={whatsappLink(i.phone)} target="_blank" rel="noopener noreferrer">WA</a>
      </td>
      <td style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{i.message || "–"}</td>
      <td style={{ minWidth: 200 }}>
        <textarea className={s.textarea} style={{ minHeight: 50, fontSize: 13 }} value={notes} placeholder="Quote, follow-up…"
          onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (i.notes || "") && onSave(i.id, i.status, notes)} />
      </td>
      <td className={s.muted} style={{ whiteSpace: "nowrap" }}>{fmtCreated(i.created_at)}</td>
      <td>
        <select className={s.btnSmall} value={i.status} onChange={(e) => onSave(i.id, e.target.value, notes)}>
          {INQUIRY_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </td>
    </tr>
  );
}

function Inquiries({ inquiries, onSave }) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr><th>Event date</th><th>Type</th><th>Guests</th><th>Contact</th><th>Details</th><th>Notes</th><th>Received</th><th>Status</th></tr>
        </thead>
        <tbody>
          {inquiries.length === 0 && <tr><td colSpan={8} className={s.muted}>No enquiries yet.</td></tr>}
          {inquiries.map((i) => <InquiryRow key={i.id + i.status} i={i} onSave={onSave} />)}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Rooms & prices ---------------- */
function RoomEditor({ room, currency, onSave }) {
  const [r, setR] = useState(room);
  const [msg, setMsg] = useState("");
  useEffect(() => setR(room), [room]);
  const set = (k) => (e) => setR({ ...r, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  async function save() {
    setMsg("Saving…");
    try { await onSave(r); setMsg("Saved ✓"); } catch (e) { setMsg(e.message); }
    setTimeout(() => setMsg(""), 2500);
  }
  return (
    <div className={s.roomEdit}>
      <div className={s.roomEditHead}>
        {r.image_url ? <img src={r.image_url} alt="" /> : null}
        <b style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 18 }}>{r.id ? r.name : "New room type"}</b>
        {!r.active && <span className={`${s.status} ${s.st_cancelled}`}>hidden</span>}
      </div>
      <div className={s.grid}>
        <div className={s.field}><label>Name</label><input className={s.input} value={r.name} onChange={set("name")} /></div>
        <div className={s.field}><label>Price per night ({currency})</label><input className={s.input} type="number" min="0" value={r.price_per_night} onChange={set("price_per_night")} /></div>
        <div className={s.field}><label>Extra fee 2nd guest / night</label><input className={s.input} type="number" min="0" value={r.extra_person_fee} onChange={set("extra_person_fee")} /></div>
        <div className={s.field}><label>Number of rooms</label><input className={s.input} type="number" min="0" value={r.total_rooms} onChange={set("total_rooms")} /></div>
        <div className={s.field}><label>Max guests / room</label><input className={s.input} type="number" min="1" max="10" value={r.max_guests} onChange={set("max_guests")} /></div>
        <div className={s.field}><label>Order on page</label><input className={s.input} type="number" min="0" value={r.sort_order} onChange={set("sort_order")} /></div>
      </div>
      <div className={s.grid2} style={{ marginTop: 12 }}>
        <div className={s.field}><label>Description</label><textarea className={s.textarea} style={{ minHeight: 60 }} value={r.description} onChange={set("description")} /></div>
        <div className={s.field}><label>Image (path, or copy an address from the Photos tab)</label><input className={s.input} value={r.image_url} onChange={set("image_url")} /></div>
      </div>
      <div className={s.actions}>
        <label className={s.checkbox}><input type="checkbox" checked={r.active} onChange={set("active")} /> Show on website</label>
        <button className={s.btn} onClick={save}>Save</button>
        <span className={s.muted}>{msg}</span>
      </div>
    </div>
  );
}

/* ---------------- Photos ---------------- */
// Shrinks a photo in the browser before upload (max 1600 px, JPEG) so uploads are fast even on mobile data.
function resizeImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Could not read " + file.name));
    img.src = URL.createObjectURL(file);
  });
}

function PhotoCard({ p, onSave, onDelete }) {
  const [v, setV] = useState(p);
  useEffect(() => setV(p), [p]);
  const dirty = v.caption !== p.caption || v.on_booking !== p.on_booking || v.on_events !== p.on_events || +v.sort_order !== p.sort_order;
  return (
    <div className={s.photoCard}>
      <img src={p.src} alt={p.caption} />
      <div>
        <input className={s.input} style={{ fontSize: 14, padding: 8 }} value={v.caption} placeholder="Caption" onChange={(e) => setV({ ...v, caption: e.target.value })} />
        <label className={s.checkbox} style={{ fontSize: 14 }}><input type="checkbox" checked={v.on_booking} onChange={(e) => setV({ ...v, on_booking: e.target.checked })} /> Show on booking page</label>
        <label className={s.checkbox} style={{ fontSize: 14 }}><input type="checkbox" checked={v.on_events} onChange={(e) => setV({ ...v, on_events: e.target.checked })} /> Show on events page</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className={s.muted}>Order</label>
          <input className={s.input} type="number" style={{ width: 70, padding: 6, fontSize: 14 }} value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: e.target.value })} />
          <button className={s.btnSmall} disabled={!dirty} onClick={() => onSave(v)}>Save</button>
          <button className={s.btnSmall} onClick={() => confirm("Delete this photo?") && onDelete(p.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Photos({ photos, patch }) {
  const [busy, setBusy] = useState("");
  const [target, setTarget] = useState("booking");
  async function upload(e) {
    const files = [...e.target.files];
    e.target.value = "";
    for (let i = 0; i < files.length; i++) {
      setBusy(`Uploading ${i + 1} of ${files.length}…`);
      try {
        const dataUrl = await resizeImage(files[i]);
        await patch({
          action: "addPhoto", dataUrl, caption: files[i].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          on_booking: target !== "events", on_events: target !== "booking",
        });
      } catch (err) { alert(err.message); }
    }
    setBusy("");
  }
  return (
    <>
      <div className={s.upload}>
        <b>Add photos of the hotel</b>
        <p className={s.muted} style={{ margin: "4px 0 10px" }}>Pick one or several photos from the computer or phone. They are resized automatically.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select className={s.select} style={{ width: "auto" }} value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="booking">Show on booking page</option>
            <option value="events">Show on events page</option>
            <option value="both">Show on both pages</option>
          </select>
          <input type="file" accept="image/*" multiple onChange={upload} disabled={!!busy} />
          <span className={s.muted}>{busy}</span>
        </div>
      </div>
      <div className={s.photoGrid}>
        {photos.map((p) => (
          <PhotoCard key={p.id} p={p}
            onSave={(v) => patch({ action: "updatePhoto", id: p.id, caption: v.caption, on_booking: v.on_booking, on_events: v.on_events, sort_order: +v.sort_order })}
            onDelete={(id) => patch({ action: "deletePhoto", id })} />
        ))}
      </div>
    </>
  );
}

/* ---------------- Hotel info / settings ---------------- */
function Settings({ settings, patch }) {
  const [v, setV] = useState(settings);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  async function save() {
    setMsg("Saving…");
    try { await patch({ action: "settings", settings: v }); setMsg("Saved ✓"); } catch (e) { setMsg(e.message); }
    setTimeout(() => setMsg(""), 2500);
  }
  return (
    <div className={s.roomEdit} style={{ maxWidth: 760 }}>
      <div className={s.field}>
        <label>The best things about the hotel (shown at the top of the booking page)</label>
        <textarea className={s.textarea} style={{ minHeight: 70 }} value={v.highlight} onChange={set("highlight")} />
        <span className={s.muted}>Separate the points with a dot “·” – each point is shown with its own bullet.</span>
      </div>
      <div className={s.grid2} style={{ marginTop: 14 }}>
        <div className={s.field}><label>Address</label><input className={s.input} value={v.address} onChange={set("address")} /></div>
        <div className={s.field}><label>Phone (separate numbers with /)</label><input className={s.input} value={v.phone} onChange={set("phone")} /></div>
        <div className={s.field}><label>WhatsApp number</label><input className={s.input} value={v.whatsapp || ""} onChange={set("whatsapp")} /></div>
        <div className={s.field}><label>E-mail</label><input className={s.input} value={v.email} onChange={set("email")} /></div>
        <div className={s.field}>
          <label>Google Maps search (place name or plus code)</label>
          <input className={s.input} value={v.map_query} onChange={set("map_query")} />
          <a href={mapsLink(v.map_query)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>Test the map link →</a>
        </div>
        <div className={s.field}><label>Check-in from</label><input className={s.input} value={v.check_in_time} onChange={set("check_in_time")} /></div>
        <div className={s.field}><label>Check-out by</label><input className={s.input} value={v.check_out_time} onChange={set("check_out_time")} /></div>
        <div className={s.field}><label>Currency code</label><input className={s.input} value={v.currency} onChange={set("currency")} /></div>
      </div>
      <div className={s.actions}><button className={s.btn} onClick={save}>Save</button><span className={s.muted}>{msg}</span></div>
    </div>
  );
}

/* ---------------- Main ---------------- */
export default function AdminApp() {
  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("bookings");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api("GET");
      setData(d); setState("ready"); setErr("");
    } catch (e) {
      if (e.status === 401) setState("login"); else { setErr(e.message); setState("ready"); }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(body) {
    try { await api("PATCH", body); await load(); }
    catch (e) { if (e.status === 401) setState("login"); else { if (body.action !== "saveBooking") alert(e.message); throw e; } }
  }
  async function logout() {
    await fetch("/api/booking/admin/login", { method: "DELETE" });
    setState("login");
  }

  if (state === "loading") return <main className={s.wrap}><p style={{ padding: 40 }}>Loading…</p></main>;
  if (state === "login") return <Login onDone={load} />;
  if (!data) return <main className={s.wrap}><div className={s.error}>{err}</div></main>;

  const t = today();
  const { bookings, inquiries, rooms, settings } = data;
  const active = bookings.filter((b) => BLOCKING_STATUSES.includes(b.status));
  const pending = bookings.filter((b) => b.status === "pending").length;
  const newInq = inquiries.filter((i) => i.status === "new").length;
  const inHouse = active.filter((b) => b.check_in <= t && b.check_out > t).reduce((n, b) => n + b.rooms, 0);
  const totalRooms = rooms.filter((r) => r.active).reduce((n, r) => n + r.total_rooms, 0);
  const arrivals = active.filter((b) => b.check_in === t).length;
  const outstanding = active.filter((b) => b.check_in <= addDays(t, 30)).reduce((n, b) => n + Math.max(0, b.total - b.amount_paid), 0);
  const blank = {
    name: "", email: "", phone: "", message: "", source: "phone", check_in: t, check_out: addDays(t, 1),
    room_type_id: rooms[0]?.id, rooms: 1, guests: 1, status: "confirmed", payment_status: "unpaid",
    amount_paid: 0, payment_method: "", notes: "", confirmation_sent: false, currency: settings.currency,
  };
  const emptyRoom = { name: "", description: "", price_per_night: 0, extra_person_fee: 0, total_rooms: 1, max_guests: 2, image_url: "", active: true, sort_order: 10 };

  return (
    <main className={s.wrap}>
      <div className={s.adminTop}>
        <div className={s.adminTopInner}>
          <h1>Hotel Alvers · Bookings</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={s.btnGhost} onClick={load}>Refresh</button>
            <button className={s.btnGhost} onClick={logout}>Log out</button>
          </div>
        </div>
      </div>
      <div className={s.adminContainer}>
        {err && <div className={s.error}>{err}</div>}
        <div className={s.stats}>
          <div className={s.stat}><b>{pending}</b><span>Awaiting confirmation</span></div>
          <div className={s.stat}><b>{arrivals}</b><span>Arrivals today</span></div>
          <div className={s.stat}><b>{inHouse} / {totalRooms}</b><span>Rooms occupied tonight</span></div>
          <div className={s.stat}><b>{formatMoney(outstanding, settings.currency)}</b><span>Unpaid, stays next 30 days</span></div>
          <div className={s.stat}><b>{newInq}</b><span>New event enquiries</span></div>
        </div>
        <div className={s.tabs}>
          {[["bookings", `Room bookings (${bookings.length})`], ["calendar", "Calendar"], ["inquiries", `Event enquiries (${inquiries.length})`],
            ["rooms", "Rooms & prices"], ["photos", `Photos (${data.photos.length})`], ["settings", "Hotel info"]].map(([k, l]) => (
            <button key={k} className={`${s.tab} ${tab === k ? s.tabActive : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === "bookings" && (
          <Bookings data={data} onOpen={setOpen} onNew={() => setOpen(blank)}
            onStatus={(id, status) => patch({ action: "bookingStatus", id, status })}
            onConfSent={(id, value) => patch({ action: "confirmationSent", id, value })} />
        )}
        {tab === "calendar" && <Calendar data={data} onOpen={setOpen} />}
        {tab === "inquiries" && <Inquiries inquiries={inquiries} onSave={(id, status, notes) => patch({ action: "inquiry", id, status, notes })} />}
        {tab === "rooms" && (
          <>
            <p className={s.muted} style={{ marginBottom: 12 }}>
              Price per night is for one guest incl. breakfast. The extra fee is added per night for the second guest in a room.
              “Number of rooms” is how many rooms of this type can be booked – lower it to block rooms (e.g. renovation).
            </p>
            {rooms.map((r) => (
              <RoomEditor key={r.id} room={r} currency={settings.currency} onSave={(room) => patch({ action: "saveRoom", room })} />
            ))}
            <h2 className={s.sectionTitle} style={{ marginTop: 24 }}>Add a new room type</h2>
            <RoomEditor key={"new" + rooms.length} room={emptyRoom} currency={settings.currency}
              onSave={(room) => patch({ action: "saveRoom", room })} />
          </>
        )}
        {tab === "photos" && <Photos photos={data.photos} patch={patch} />}
        {tab === "settings" && <Settings settings={settings} patch={patch} />}
      </div>

      {open && (
        <BookingModal booking={open} rooms={rooms} settings={settings} onClose={() => setOpen(null)}
          onSave={async (booking) => { await patch({ action: "saveBooking", booking }); setOpen(null); }} />
      )}
    </main>
  );
}
