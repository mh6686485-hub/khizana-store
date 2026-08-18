import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET() {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM coupons ORDER BY code");
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
      `INSERT INTO coupons (code, discount_percent, min_order, expiry, active, discount_type, max_uses)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (code) DO UPDATE SET discount_percent=$2, min_order=$3, expiry=$4, active=$5, discount_type=$6, max_uses=$7
       RETURNING *`,
      [
        String(b.code).toUpperCase(),
        Number(b.discountPercent) || 0,
        Number(b.minOrder) || 0,
        b.expiry || null,
        b.active !== false,
        b.discountType === "fixed" ? "fixed" : "percent",
        b.maxUses ? Number(b.maxUses) : null,
      ]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
