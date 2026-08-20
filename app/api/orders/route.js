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

    const { rows: sRows } = await p.query(
      "SELECT shipping_cost, points_per_egp, point_value, free_shipping_min, min_order_amount FROM settings WHERE id=1"
    );
    const baseShippingCost = Number(sRows[0]?.shipping_cost ?? 60);
    const freeShippingMin = Number(sRows[0]?.free_shipping_min ?? 0);
    const minOrderAmount = Number(sRows[0]?.min_order_amount ?? 0);
    const orderSubtotalAfterCoupon = Math.max(0, Number(b.total || 0));

    if (minOrderAmount > 0 && orderSubtotalAfterCoupon < minOrderAmount) {
      return NextResponse.json(
        { error: `الحد الأدنى للطلب ${minOrderAmount} ج.م` },
        { status: 400 }
      );
    }

    const shippingCost = (freeShippingMin > 0 && orderSubtotalAfterCoupon >= freeShippingMin) ? 0 : baseShippingCost;
    const pointsPerEgp = Number(sRows[0]?.points_per_egp ?? 0.1);
    const pointValue = Number(sRows[0]?.point_value ?? 1);

    // Loyalty points redemption (optional, capped at the customer's balance and the order value).
    let pointsUsed = 0;
    let pointsDiscount = 0;
    const phone = b.customer?.phone;
    if (b.usePoints && phone) {
      const { rows: cpRows } = await p.query("SELECT points FROM customer_points WHERE phone=$1", [phone]);
      const available = cpRows[0]?.points || 0;
      const subtotalAfterCoupon = Math.max(0, Number(b.total || 0));
      const maxRedeemableValue = Math.min(subtotalAfterCoupon, available * pointValue);
      pointsUsed = Math.floor(maxRedeemableValue / pointValue);
      pointsDiscount = pointsUsed * pointValue;
    }

    const finalTotal = Math.max(0, Number(b.total || 0) - pointsDiscount) + shippingCost;
    const pointsEarned = Math.floor(finalTotal * pointsPerEgp);

    const id = "ORD-" + Date.now().toString(36).toUpperCase();
    const paymentMethod = b.paymentMethod === "bank_transfer" ? "bank_transfer" : "cod";
    const { rows } = await p.query(
      `INSERT INTO orders
         (id, items, subtotal, discount, coupon_code, total, customer, status,
          governorate, city, area, landmark, phone2, shipping_cost, payment_method,
          points_earned, points_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'جديد',$8,$9,$10,$11,$12,$13,$14,$15,$16)
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
        paymentMethod,
        pointsEarned,
        pointsUsed,
      ]
    );

    // Deduct stock: for product lines directly, for bundle lines across each component.
    for (const item of b.items || []) {
      if (item.type === "bundle" && item.bundleId) {
        const { rows: comp } = await p.query(
          "SELECT product_id, qty FROM bundle_items WHERE bundle_id=$1",
          [item.bundleId]
        );
        for (const c of comp) {
          await p.query(
            "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
            [Number(c.qty) * (Number(item.qty) || 1), c.product_id]
          );
        }
      } else if (item.productId) {
        await p.query(
          "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
          [Number(item.qty) || 1, item.productId]
        );
      }
    }

    // Coupon usage tracking.
    if (b.couponCode) {
      await p.query("UPDATE coupons SET used_count = used_count + 1 WHERE code = $1", [b.couponCode]);
    }

    // Loyalty points: deduct used, add earned.
    if (phone) {
      await p.query(
        `INSERT INTO customer_points (phone, points) VALUES ($1, $2)
         ON CONFLICT (phone) DO UPDATE SET points = customer_points.points + $2`,
        [phone, pointsEarned - pointsUsed]
      );
    }

    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
