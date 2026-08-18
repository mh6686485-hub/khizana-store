import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/auth";

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    const { rows } = await p.query(
      `UPDATE products SET code=$1,name=$2,category=$3,price=$4,original_price=$5,description=$6,specs=$7,image=$8,status=$9,is_new=$10,is_best_seller=$11,offer_expiry=$12 WHERE id=$13 RETURNING *`,
      [
        b.code, b.name, b.category, Number(b.price) || 0,
        b.originalPrice ? Number(b.originalPrice) : Number(b.price) || 0,
        b.description || "", b.specs || "", b.image || "",
        b.status || "available", !!b.isNew, !!b.isBestSeller,
        b.offerExpiry || null, params.id,
      ]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    await p.query("DELETE FROM products WHERE id=$1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
