import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    const p = await db();
    const { rows } = await p.query(
      `SELECT id, created_at, items, total, status, ('KH-' || (order_no + 10000)) AS order_number
       FROM orders WHERE customer->>'phone' = $1 ORDER BY created_at DESC`,
      [phone]
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
