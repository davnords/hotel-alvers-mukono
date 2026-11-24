// Helpers that are safe to use both in the browser and on the server.

export const EVENT_TYPES = ["Conference", "Meeting", "Dinner", "Wedding", "Party / celebration", "Other"];

// Price: rooms × nights × room price, plus a fixed fee per night for every
// guest beyond the first one in each room (the 2nd person's breakfast).
export function calcPrice({ pricePerNight, extraPersonFee, nights, rooms, guests }) {
  const extraGuests = Math.max(0, guests - rooms);
  const roomCost = pricePerNight * rooms * nights;
  const extraCost = extraPersonFee * extraGuests * nights;
  return { roomCost, extraCost, extraGuests, total: roomCost + extraCost };
}

export function formatMoney(amount, currency) {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US")}`;
}


// Booking life-cycle. All statuses except "cancelled" and "no_show" keep the room reserved.
export const BOOKING_STATUSES = [
  ["pending", "Awaiting confirmation"],
  ["confirmed", "Confirmed"],
  ["checked_in", "Checked in"],
  ["checked_out", "Checked out"],
  ["cancelled", "Cancelled"],
  ["no_show", "No-show"],
];
export const BLOCKING_STATUSES = ["pending", "confirmed", "checked_in", "checked_out"];
export const PAYMENT_STATUSES = [["unpaid", "Unpaid"], ["deposit", "Deposit paid"], ["paid", "Paid in full"], ["refunded", "Refunded"]];
export const PAYMENT_METHODS = ["", "Cash", "Mobile Money (MTN)", "Mobile Money (Airtel)", "Card", "Bank transfer", "Other"];
export const BOOKING_SOURCES = ["website", "phone", "walk-in", "e-mail", "WhatsApp", "booking site", "other"];
export const INQUIRY_STATUSES = [["new", "New"], ["contacted", "Contacted"], ["confirmed", "Confirmed"], ["closed", "Closed"]];

// Texts and contact details the hotel can edit in the admin (Settings tab).
export const DEFAULT_SETTINGS = {
  currency: "UGX",
  highlight: "A quiet, green neighbourhood just off the main Kampala–Jinja road towards Kenya · Delicious food in our restaurant · Friendly, welcoming staff",
  address: "Alvers Close, near Kampala–Jinja Road, Mukono, Uganda",
  phone: "+256 392 176623",
  whatsapp: "+256 752 601 770",
  email: "hotelalvers@gmail.com",
  map_query: "Hotel Alvers, Mukono, Uganda",
  check_in_time: "1:00 PM",
  check_out_time: "11:00 AM",
};
export const PUBLIC_SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

export function mapsLink(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query || DEFAULT_SETTINGS.map_query);
}
export function mapsEmbed(query) {
  return "https://maps.google.com/maps?q=" + encodeURIComponent(query || DEFAULT_SETTINGS.map_query) + "&z=15&output=embed";
}
// wa.me link that opens a WhatsApp chat with a phone number (digits only, with country code).
export function whatsappLink(phone, text = "") {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "256" + d.slice(1); // local Ugandan number → +256
  return `https://wa.me/${d}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}

// Switch for the "Book a room" / "Conferences & events" links on the homepage and in the footer.
// Set to true when the booking system has been fully tested and should be visible to guests.
// (The pages /booking, /events and /admin work either way – this only hides the links.)
export const SHOW_BOOKING_LINKS = false;
