import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(req) {
  const c = req.cookies.get("kh_admin");
  return NextResponse.json({ authed: !!c && c.value === "true" });
}

export async function POST(req) {
  try {
    const { password } = await req.json();
    const p = await db();
    const { rows } = await p.query("SELECT admin_password FROM settings WHERE id=1");
    const correct = rows[0]?.admin_password || process.env.ADMIN_PASSWORD || "khizana2026";
    if (password !== correct) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("kh_admin", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("kh_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
