import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query(
      `SELECT *, ('KH-' || (order_no + 10000)) AS order_number FROM orders ORDER BY created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const p = await db();

    const { rows: sRows } = await p.query("SELECT shipping_cost FROM settings WHERE id=1");
    const shippingCost = Number(sRows[0]?.shipping_cost ?? 60);
    const finalTotal = Number(b.total || 0) + shippingCost;

    const id = "ORD-" + Date.now().toString(36).toUpperCase();
    const { rows } = await p.query(
      `INSERT INTO orders
         (id, items, subtotal, discount, coupon_code, total, customer, status,
          governorate, city, area, landmark, phone2, shipping_cost, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'جديد',$8,$9,$10,$11,$12,$13,'cod')
       RETURNING *, ('KH-' || (order_no + 10000)) AS order_number`,
      [
        id,
        JSON.stringify(b.items),
        b.subtotal,
        b.discount || 0,
        b.couponCode || null,
        finalTotal,
        JSON.stringify(b.customer),
        b.governorate || "",
        b.city || "",
        b.area || "",
        b.landmark || "",
        b.phone2 || "",
        shippingCost,
      ]
    );

    // Deduct stock for each item (never goes below zero).
    for (const item of b.items || []) {
      if (item.productId) {
        await p.query(
          "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
          [Number(item.qty) || 1, item.productId]
        );
      }
    }

    // Track coupon usage.
    if (b.couponCode) {
      await p.query(
        "UPDATE coupons SET used_count = used_count + 1 WHERE code = $1",
        [b.couponCode]
      );
    }

    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
