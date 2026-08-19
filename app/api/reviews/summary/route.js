import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const p = await db();
    const { rows } = await p.query(
      `SELECT product_id, AVG(rating)::numeric AS avg_rating, COUNT(*)::int AS count
       FROM reviews WHERE approved=true GROUP BY product_id`
    );
    const map = {};
    for (const r of rows) map[r.product_id] = { avg: Number(r.avg_rating), count: r.count };
    return NextResponse.json(map);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
