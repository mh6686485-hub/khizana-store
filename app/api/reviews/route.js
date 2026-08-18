import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const p = await db();
    if (productId) {
      const admin = isAdmin(req);
      const { rows } = await p.query(
        admin
          ? "SELECT * FROM reviews WHERE product_id=$1 ORDER BY created_at DESC"
          : "SELECT * FROM reviews WHERE product_id=$1 AND approved=true ORDER BY created_at DESC",
        [productId]
      );
      return NextResponse.json(rows);
    }
    if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { rows } = await p.query(
      `SELECT r.*, pr.name AS product_name FROM reviews r
       LEFT JOIN products pr ON pr.id = r.product_id
       ORDER BY r.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    if (!b.productId || !b.name || !b.rating) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }
    const p = await db();
    const { rows } = await p.query(
      `INSERT INTO reviews (product_id, name, phone, rating, comment, approved)
       VALUES ($1,$2,$3,$4,$5,false) RETURNING *`,
      [b.productId, b.name, b.phone || "", Math.min(5, Math.max(1, Number(b.rating))), b.comment || ""]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
