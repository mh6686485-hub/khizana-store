import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM settings WHERE id=1");
    const s = rows[0] || {};
    if (isAdmin(req)) return NextResponse.json(s);
    return NextResponse.json({ store_name: s.store_name, whatsapp: s.whatsapp, shipping_cost: s.shipping_cost });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    const { rows } = await p.query(
      `UPDATE settings SET store_name=$1, whatsapp=$2, admin_password=$3, shipping_cost=$4 WHERE id=1 RETURNING *`,
      [b.storeName, b.whatsapp, b.adminPassword, Number(b.shippingCost) || 0]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
