'use client'

// Homepage top bar – the same green bar and "Hotel Alvers" logo text as the booking pages.
import { SiteHeader } from "@/components/booking/HotelChrome"
import { SHOW_BOOKING_LINKS } from "@/lib/booking/shared"

const sectionLinks = [
    { href: "#experience", label: "Rooms & Dining", key: "experience" },
    { href: "#conveniences", label: "Amenities", key: "conveniences" },
    { href: "#location", label: "Location", key: "location" },
    { href: "#staff", label: "Our Team", key: "staff" },
    { href: "#contact", label: "Contact", key: "contact" },
]

const bookingLinks = [
    { href: "/events", label: "Events", key: "events" },
    { href: "/booking", label: "Book a room", key: "booking", cta: true },
]

export default function Navbar() {
    return <SiteHeader sticky links={SHOW_BOOKING_LINKS ? [...sectionLinks, ...bookingLinks] : sectionLinks} />
}
