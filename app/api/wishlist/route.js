import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req) {
  try {
    const phone = new URL(req.url).searchParams.get("phone");
    if (!phone) return NextResponse.json([]);
    const p = await db();
    const { rows } = await p.query("SELECT product_id FROM wishlist WHERE phone=$1", [phone]);
    return NextResponse.json(rows.map((r) => r.product_id));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { phone, productId } = await req.json();
    if (!phone || !productId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    const p = await db();
    await p.query(
      "INSERT INTO wishlist (phone, product_id) VALUES ($1,$2) ON CONFLICT (phone, product_id) DO NOTHING",
      [phone, productId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone");
    const productId = url.searchParams.get("productId");
    if (!phone || !productId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    const p = await db();
    await p.query("DELETE FROM wishlist WHERE phone=$1 AND product_id=$2", [phone, productId]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
