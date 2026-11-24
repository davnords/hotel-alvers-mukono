"use client";
import Link from "next/link";
// Enquiry form for conferences, meetings, dinners, weddings and parties.
import { useState } from "react";
import s from "./booking.module.css";
import { EVENT_TYPES } from "@/lib/booking/shared";

import { useToday } from "./useToday";
import PhoneInput from "./PhoneInput";

export default function InquiryForm({ defaultType = "" }) {
  const [f, setF] = useState({
    eventType: EVENT_TYPES.includes(defaultType) ? defaultType : "",
    eventDate: "", guests: "", name: "", organization: "", email: "", phone: "",
    needsRooms: false, message: "", website: "",
  });
  const [error, setError] = useState("");
  const today = useToday();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const r = await fetch("/api/booking/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong");
      setDone(d);
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
          <h2>Thank you for your enquiry</h2>
          <p>Your reference:</p>
          <div className={s.ref}>{done.ref}</div>
          <p className={s.note}>
            We have sent a copy to <b>{f.email}</b>. Our events team will get back to you as soon as possible
            with availability and a quotation.
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
        <h2 className={s.sectionTitle}>Tell us about your event</h2>
        <div className={s.grid}>
          <div className={s.field}>
            <label htmlFor="type">Type of event *</label>
            <select id="type" className={s.select} required value={f.eventType} onChange={set("eventType")}>
              <option value="">Choose…</option>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label htmlFor="date">Preferred date</label>
            <input id="date" type="date" min={today || undefined} className={s.input} value={f.eventDate} onChange={set("eventDate")} />
          </div>
          <div className={s.field}>
            <label htmlFor="guests">Number of guests</label>
            <input id="guests" type="number" min="1" max="5000" className={s.input} value={f.guests} onChange={set("guests")} />
          </div>
        </div>
        <label className={s.checkbox} style={{ marginTop: 14 }}>
          <input type="checkbox" checked={f.needsRooms} onChange={set("needsRooms")} />
          We also need accommodation for some guests
        </label>

        <h2 className={s.sectionTitle} style={{ marginTop: 26 }}>Your contact details</h2>
        <div className={s.grid2}>
          <div className={s.field}>
            <label htmlFor="name">Full name *</label>
            <input id="name" className={s.input} required value={f.name} onChange={set("name")} autoComplete="name" />
          </div>
          <div className={s.field}>
            <label htmlFor="org">Company / organisation</label>
            <input id="org" className={s.input} value={f.organization} onChange={set("organization")} autoComplete="organization" />
          </div>
          <div className={s.field}>
            <label htmlFor="email">E-mail *</label>
            <input id="email" type="email" className={s.input} required value={f.email} onChange={set("email")} autoComplete="email" />
          </div>
          <div className={s.field}>
            <label htmlFor="phone">Phone (incl. country code) *</label>
            <PhoneInput required value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
          </div>
        </div>
        <div className={s.field} style={{ marginTop: 14 }}>
          <label htmlFor="msg">Describe your event</label>
          <textarea id="msg" className={s.textarea} placeholder="Times, catering, equipment (projector, sound), decoration, budget…"
            value={f.message} onChange={set("message")} />
        </div>
        <div className={s.hp} aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
        </div>
        {error && <div className={s.error}>{error}</div>}
        <div className={s.actions}>
          <button className={s.btn} disabled={sending}>{sending ? "Sending…" : "Send enquiry"}</button>
          <span className={s.muted}>We usually reply within 24 hours.</span>
        </div>
      </div>
    </form>
  );
}
