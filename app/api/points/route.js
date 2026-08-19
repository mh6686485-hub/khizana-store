import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req) {
  try {
    const phone = new URL(req.url).searchParams.get("phone");
    if (!phone) return NextResponse.json({ points: 0 });
    const p = await db();
    const { rows: sRows } = await p.query("SELECT point_value FROM settings WHERE id=1");
    const { rows } = await p.query("SELECT points FROM customer_points WHERE phone=$1", [phone]);
    return NextResponse.json({
      points: rows[0]?.points || 0,
      pointValue: Number(sRows[0]?.point_value ?? 1),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
