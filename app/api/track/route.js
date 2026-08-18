import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req) {
  try {
    const { orderNumber, phone } = await req.json();
    const raw = String(orderNumber || "").trim().toUpperCase().replace("KH-", "");
    const orderNo = Number(raw) - 10000;
    if (!orderNo || !phone) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }
    const p = await db();
    const { rows } = await p.query(
      `SELECT id, created_at, items, subtotal, discount, total, status,
              governorate, city, area, shipping_cost, customer,
              ('KH-' || (order_no + 10000)) AS order_number
       FROM orders WHERE order_no=$1`,
      [orderNo]
    );
    const order = rows[0];
    if (!order || order.customer?.phone !== phone) {
      return NextResponse.json({ error: "لم نجد طلبًا بهذه البيانات" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
