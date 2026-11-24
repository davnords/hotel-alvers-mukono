// POST /api/booking/inquiry – request for conference, meeting, dinner, wedding or party.
import { NextResponse } from "next/server";
import { query, getSettings } from "@/lib/booking/db";
import { notifyWhatsApp } from "@/lib/booking/whatsapp";
import { EVENT_TYPES, isIsoDate, todayInUganda, makeRef, cleanText, isEmail, isPhone, prettyDate } from "@/lib/booking/utils";
import { sendMail, hotelEmail, buildEmail } from "@/lib/booking/mail";


function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return bad("Invalid request"); }
  if (body.website) return NextResponse.json({ ok: true, ref: "OK" }); // spam trap

  const eventType = EVENT_TYPES.includes(body.eventType) ? body.eventType : null;
  const eventDate = body.eventDate || null;
  const guests = body.guests ? parseInt(body.guests, 10) : null;
  const name = cleanText(body.name, 120);
  const organization = cleanText(body.organization, 160);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 30);
  const needsRooms = !!body.needsRooms;
  const message = cleanText(body.message, 3000);

  if (!eventType) return bad("Please choose the type of event.");
  if (eventDate && (!isIsoDate(eventDate) || eventDate < todayInUganda())) return bad("Please choose a valid date.");
  if (guests !== null && !(guests >= 1 && guests <= 5000)) return bad("Please enter number of guests.");
  if (name.length < 2) return bad("Please enter your name.");
  if (!isEmail(email)) return bad("Please enter a valid e-mail address.");
  if (!isPhone(phone)) return bad("Please enter a valid phone number.");

  const ref = makeRef("EVT");
  try {
    await query(
      `INSERT INTO ba_inquiries (ref, event_type, event_date, guests, name, organization, email, phone, needs_rooms, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [ref, eventType, eventDate, guests, name, organization, email, phone, needsRooms, message]
    );
  } catch (e) {
    console.error(e);
    return bad("Something went wrong. Please try again or contact us by phone.", 500);
  }

  const rows = [
    ["Reference", ref],
    ["Type of event", eventType],
    ["Preferred date", eventDate ? prettyDate(eventDate) : "Not decided"],
    ["Number of guests", guests ? String(guests) : "Not decided"],
    ["Accommodation needed", needsRooms ? "Yes" : "No"],
  ];
  const settings = await getSettings();
  const guestMail = buildEmail({
    intro: `Dear ${name},\n\nThank you for your enquiry. We have received your request and our events team will get back to you as soon as possible with availability and a quotation.`,
    rows,
    outro: message ? `Your message:\n${message}` : "",
    info: settings,
    showMap: true,
  });
  const hotelMail = buildEmail({
    intro: "New event / conference enquiry from the website.",
    rows: [...rows, ["Name", name], ["Organisation", organization || "–"], ["E-mail", email], ["Phone", phone], ["Message", message || "–"]],
    info: settings,
  });

  await Promise.all([
    sendMail({ to: email, subject: `Enquiry received – ${ref}`, ...guestMail, replyTo: hotelEmail() || undefined }),
    hotelEmail()
      ? sendMail({ to: hotelEmail(), subject: `New ${eventType.toLowerCase()} enquiry ${ref}: ${name}`, ...hotelMail, replyTo: email })
      : null,
    notifyWhatsApp(
      `🎉 New ${eventType.toLowerCase()} enquiry ${ref}\n${name}${organization ? " (" + organization + ")" : ""} · ${phone}\n` +
      `Date: ${eventDate ? prettyDate(eventDate) : "not decided"} · Guests: ${guests || "?"}` +
      (needsRooms ? " · needs rooms" : "") + (message ? `\n"${message.slice(0, 300)}"` : "")
    ),
  ]);

  return NextResponse.json({ ok: true, ref });
}
