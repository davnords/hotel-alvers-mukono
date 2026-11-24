// Sends a WhatsApp message to the hotel when a new booking or enquiry arrives.
// Uses the free CallMeBot service (https://www.callmebot.com/blog/free-api-whatsapp-messages/):
//   1. Save +34 694 29 84 96 as a contact on the hotel's WhatsApp phone.
//   2. Send it the message: I allow callmebot to send me messages
//   3. You get an API key back. Put these in Vercel:
//        WHATSAPP_PHONE=256782353140        (the hotel's number, with country code)
//        WHATSAPP_APIKEY=123456             (the key you received)
//   Several numbers: WHATSAPP_PHONE=256782353140,256752601770 and WHATSAPP_APIKEY=111111,222222
// If the variables are missing, nothing is sent (e-mail still works).

export async function notifyWhatsApp(text) {
  const phones = (process.env.WHATSAPP_PHONE || "").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);
  const keys = (process.env.WHATSAPP_APIKEY || "").split(",").map((s) => s.trim());
  if (!phones.length || !keys[0]) return false;
  const results = await Promise.all(phones.map(async (phone, i) => {
    const apikey = keys[i] || keys[0];
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${encodeURIComponent(apikey)}&text=${encodeURIComponent(text.slice(0, 1500))}`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) console.error("[booking] WhatsApp failed:", r.status);
      return r.ok;
    } catch (e) {
      console.error("[booking] WhatsApp failed:", e.message);
      return false;
    }
  }));
  return results.some(Boolean);
}
