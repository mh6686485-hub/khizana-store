import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM settings WHERE id=1");
    const s = rows[0] || {};
    if (isAdmin(req)) return NextResponse.json(s);
    return NextResponse.json({
      store_name: s.store_name,
      whatsapp: s.whatsapp,
      shipping_cost: s.shipping_cost,
      points_per_egp: s.points_per_egp,
      point_value: s.point_value,
      free_shipping_min: s.free_shipping_min,
      min_order_amount: s.min_order_amount,
      about_us: s.about_us,
      return_policy: s.return_policy,
      enable_bank_transfer: s.enable_bank_transfer,
      bank_transfer_details: s.bank_transfer_details,
    });
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
      `UPDATE settings SET store_name=$1, whatsapp=$2, admin_password=$3, shipping_cost=$4, points_per_egp=$5, point_value=$6, free_shipping_min=$7, min_order_amount=$8, about_us=$9, return_policy=$10, enable_bank_transfer=$11, bank_transfer_details=$12 WHERE id=1 RETURNING *`,
      [
        b.storeName, b.whatsapp, b.adminPassword, Number(b.shippingCost) || 0,
        Number(b.pointsPerEgp) || 0, Number(b.pointValue) || 1, Number(b.freeShippingMin) || 0,
        Number(b.minOrderAmount) || 0, b.aboutUs || "", b.returnPolicy || "",
        !!b.enableBankTransfer, b.bankTransferDetails || "",
      ]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
