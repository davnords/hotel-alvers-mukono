"use client";
import Link from "next/link";
// Shared parts of the guest pages: header with logo text, hero, highlights,
// photo gallery with lightbox, mini map and footer. Texts come from the admin (Hotel info).
import { useEffect, useState, useCallback } from "react";
import s from "./booking.module.css";
import { DEFAULT_SETTINGS, mapsLink, mapsEmbed } from "@/lib/booking/shared";
import { useToday } from "./useToday";

export function useHotelInfo() {
  const [info, setInfo] = useState({ settings: DEFAULT_SETTINGS, photos: [], loaded: false });
  useEffect(() => {
    let off = false;
    fetch("/api/booking/info")
      .then((r) => r.json())
      .then((d) => { if (!off && d.settings) setInfo({ settings: { ...DEFAULT_SETTINGS, ...d.settings }, photos: d.photos || [], loaded: true }); })
      .catch(() => {});
    return () => { off = true; };
  }, []);
  return info;
}

export function Wordmark({ light = false }) {
  return (
    <Link href="/" className={`${s.wordmark} ${light ? s.wordmarkLight : ""}`} aria-label="Hotel Alvers – home">
      <span className={s.wmSmall}>Hotel</span>
      <span className={s.wmBig}>Alvers</span>
      <span className={s.wmPlace}>Mukono · Uganda</span>
    </Link>
  );
}

export function SiteHeader({ active }) {
  return (
    <header className={s.siteHeader}>
      <div className={s.siteHeaderInner}>
        <Wordmark light />
        <nav className={s.siteNav}>
          <Link href="/booking" className={active === "booking" ? s.navOn : ""}>Rooms</Link>
          <Link href="/events" className={active === "events" ? s.navOn : ""}>Conferences &amp; events</Link>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export function Hero({ img, title, settings, sub }) {
  const points = (settings?.highlight || "").split("·").map((x) => x.trim()).filter(Boolean);
  return (
    <div className={s.hero} style={{ backgroundImage: `url(${img})` }}>
      <div className={s.heroInner}>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {points.length > 0 && (
          <ul className={s.highlights}>
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        <a className={s.heroMapLink} href={mapsLink(settings?.map_query)} target="_blank" rel="noopener noreferrer">
          <PinIcon /> {settings?.address} · View on map
        </a>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: "-2px" }}>
      <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export function Gallery({ photos, title, intro }) {
  const [open, setOpen] = useState(-1);
  const close = useCallback(() => setOpen(-1), []);
  useEffect(() => {
    if (open < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length, close]);
  if (!photos?.length) return null;
  const p = photos[open];
  return (
    <section className={s.gallerySection}>
      {title && <h2 className={s.sectionTitle}>{title}</h2>}
      {intro && <p className={s.muted} style={{ marginTop: -8, marginBottom: 14 }}>{intro}</p>}
      <div className={s.gallery}>
        {photos.map((ph, i) => (
          <button type="button" key={ph.id} className={s.thumb} onClick={() => setOpen(i)} aria-label={`Show photo: ${ph.caption}`}>
            <img src={ph.src} alt={ph.caption} loading="lazy" />
            {ph.caption && <span>{ph.caption}</span>}
          </button>
        ))}
      </div>
      {p && (
        <div className={s.lightbox} onClick={close} role="dialog" aria-label={p.caption}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={p.src} alt={p.caption} />
            <figcaption>{p.caption} <span className={s.muted}>({open + 1}/{photos.length})</span></figcaption>
          </figure>
          <button className={`${s.lbBtn} ${s.lbPrev}`} onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }} aria-label="Previous">‹</button>
          <button className={`${s.lbBtn} ${s.lbNext}`} onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }} aria-label="Next">›</button>
          <button className={`${s.lbBtn} ${s.lbClose}`} onClick={close} aria-label="Close">×</button>
        </div>
      )}
    </section>
  );
}

// Mini map. On the real website it is a live Google map; `staticMap` shows a placeholder (used in the demo).
export function MapCard({ settings, staticMap = false }) {
  const st = settings || DEFAULT_SETTINGS;
  return (
    <section className={s.mapSection} id="map">
      <div className={s.mapText}>
        <h2 className={s.sectionTitle}>Find us</h2>
        <p>{st.address}</p>
        <p className={s.muted}>Easy to reach from the main Kampala–Jinja road – about 24 km from Kampala and 70 km from Entebbe Airport.</p>
        <a className={s.btn} href={mapsLink(st.map_query)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", textDecoration: "none", marginTop: 6 }}>
          Open in Google Maps
        </a>
      </div>
      <div className={s.mapFrame}>
        {staticMap ? (
          <a href={mapsLink(st.map_query)} target="_blank" rel="noopener noreferrer" className={s.mapPlaceholder}>
            <svg viewBox="0 0 400 260" aria-hidden="true">
              <rect width="400" height="260" fill="#e9efe6" />
              <path d="M-10 190 C80 170 140 150 210 150 S330 120 410 90" stroke="#f4d58d" strokeWidth="14" fill="none" />
              <path d="M-10 190 C80 170 140 150 210 150 S330 120 410 90" stroke="#e2b85a" strokeWidth="2" fill="none" />
              <path d="M200 150 L215 95 L240 60" stroke="#fff" strokeWidth="6" fill="none" />
              <circle cx="232" cy="72" r="20" fill="#2f4a3a" opacity=".15" />
              <path d="M232 40a14 14 0 0 0-14 14c0 10.4 14 26 14 26s14-15.6 14-26a14 14 0 0 0-14-14z" fill="#a33b2b" />
              <circle cx="232" cy="54" r="5" fill="#fff" />
              <text x="20" y="180" fontSize="12" fill="#7a6a3a" fontFamily="Arial">Kampala–Jinja Road</text>
              <text x="252" y="58" fontSize="13" fill="#22372b" fontFamily="Arial" fontWeight="bold">Hotel Alvers</text>
            </svg>
            <span>Live Google map shows here on the website · click to open</span>
          </a>
        ) : (
          <iframe
            title="Map showing Hotel Alvers"
            src={mapsEmbed(st.map_query)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
      </div>
    </section>
  );
}

export function SiteFooter({ settings }) {
  const st = settings || DEFAULT_SETTINGS;
  const year = (useToday() || "").slice(0, 4);
  const phones = (st.phone || "").split("/").map((p) => p.trim()).filter(Boolean);
  return (
    <footer className={s.footer} id="contact">
      <div className={s.footerInner}>
        <div>
          <Wordmark light />
          <p className={s.footerTag}>Your tranquil haven in Mukono – rooms, restaurant, conferences and celebrations.</p>
        </div>
        <div>
          <h3>Visit us</h3>
          <p>{st.address}</p>
          <a href={mapsLink(st.map_query)} target="_blank" rel="noopener noreferrer">View on Google Maps →</a>
        </div>
        <div>
          <h3>Contact</h3>
          {phones.map((p) => <p key={p}><a href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a></p>)}
          <p><a href={`mailto:${st.email}`}>{st.email}</a></p>
        </div>
        <div>
          <h3>Your stay</h3>
          <p>Check-in from {st.check_in_time}</p>
          <p>Check-out by {st.check_out_time}</p>
          <p>Breakfast included</p>
          <p><Link href="/booking">Book a room</Link> · <Link href="/events">Events</Link></p>
        </div>
      </div>
      <div className={s.footerBottom}>© {year} Hotel Alvers Mukono</div>
    </footer>
  );
}
