"use client";
import Link from "next/link";
// The full "Book a room" page: header, hero with highlights, booking form, gallery, map, footer.
import s from "./booking.module.css";
import BookingForm from "./BookingForm";
import { useHotelInfo, SiteHeader, Hero, Gallery, MapCard, SiteFooter } from "./HotelChrome";

export default function BookingPage({ heroImage = "/booking/hotel.jpg", staticMap = false }) {
  const { settings, photos } = useHotelInfo();
  return (
    <main className={s.wrap}>
      <SiteHeader active="booking" />
      <Hero img={heroImage} title="Book your stay" settings={settings} />
      <div className={s.container}>
        <BookingForm settings={settings} />
        <div className={s.links}>
          <Link href="/events">Planning a conference, wedding or party? Send an event enquiry →</Link>
        </div>
        <Gallery photos={photos.filter((p) => p.onBooking)} title="A glimpse of Hotel Alvers" />
        <MapCard settings={settings} staticMap={staticMap} />
      </div>
      <SiteFooter settings={settings} />
    </main>
  );
}
