import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM subscribers ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: "رقم هاتف غير صحيح" }, { status: 400 });
    }
    const p = await db();
    await p.query(
      "INSERT INTO subscribers (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING",
      [phone.trim()]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
