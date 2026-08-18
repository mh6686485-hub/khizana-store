import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM orders ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const p = await db();
    const id = "ORD-" + Date.now().toString(36).toUpperCase();
    const { rows } = await p.query(
      `INSERT INTO orders (id, items, subtotal, discount, coupon_code, total, customer, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'جديد') RETURNING *`,
      [id, JSON.stringify(b.items), b.subtotal, b.discount || 0, b.couponCode || null, b.total, JSON.stringify(b.customer)]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
