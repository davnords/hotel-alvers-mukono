"use client";
import Link from "next/link";
// The "Conferences & events" page: header, hero, venue photos, enquiry form, map, footer.
import s from "./booking.module.css";
import InquiryForm from "./InquiryForm";
import { useHotelInfo, SiteHeader, Hero, Gallery, MapCard, SiteFooter } from "./HotelChrome";

export default function EventsPage({ heroImage = "/booking/events.jpg", staticMap = false }) {
  const { settings, photos } = useHotelInfo();
  const eventPhotos = photos.filter((p) => p.onEvents);
  return (
    <main className={s.wrap}>
      <SiteHeader active="events" />
      <Hero img={heroImage} title="Conferences & events"
        sub="Meetings, dinners, weddings and celebrations – tell us what you are planning" settings={{ ...settings, highlight: "" }} />
      <div className={s.container}>
        {eventPhotos.length > 0 && (
          <div className={`${s.card} ${s.venueCard}`}>
            <Gallery photos={eventPhotos} title="Our venue"
              intro="Elegant hall, garden and conference room – with catering from our own kitchen and accommodation for your guests." />
          </div>
        )}
        <InquiryForm />
        <div className={s.links}>
          <Link href="/booking">Only need a room? Book your stay →</Link>
        </div>
        <MapCard settings={settings} staticMap={staticMap} />
      </div>
      <SiteFooter settings={settings} />
    </main>
  );
}
