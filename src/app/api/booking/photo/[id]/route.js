// GET /api/booking/photo/123 – serves a photo the hotel uploaded in the admin.
import { query } from "@/lib/booking/db";

export async function GET(request, { params }) {
  const { id } = await params;
  const n = parseInt(id, 10);
  if (!n) return new Response("Not found", { status: 404 });
  const { rows } = await query("SELECT data, mime FROM ba_photos WHERE id = $1 AND data IS NOT NULL", [n]);
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(rows[0].data, {
    headers: {
      "Content-Type": rows[0].mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
