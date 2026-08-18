import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET() {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM products ORDER BY id");
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    const { rows } = await p.query(
      `INSERT INTO products (code,name,category,price,original_price,description,specs,image,status,is_new,is_best_seller,offer_expiry)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        b.code, b.name, b.category, Number(b.price) || 0,
        b.originalPrice ? Number(b.originalPrice) : Number(b.price) || 0,
        b.description || "", b.specs || "", b.image || "",
        b.status || "available", !!b.isNew, !!b.isBestSeller,
        b.offerExpiry || null,
      ]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
