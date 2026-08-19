import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query(
      `SELECT
         customer->>'phone' AS phone,
         MAX(customer->>'name') AS name,
         COUNT(*)::int AS order_count,
         SUM(total)::numeric AS total_spent,
         MAX(created_at) AS last_order_at
       FROM orders
       WHERE customer->>'phone' IS NOT NULL AND customer->>'phone' <> ''
       GROUP BY customer->>'phone'
       ORDER BY last_order_at ASC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
