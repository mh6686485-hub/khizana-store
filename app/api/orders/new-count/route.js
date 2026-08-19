import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query("SELECT COUNT(*)::int AS c FROM orders WHERE status='جديد'");
    return NextResponse.json({ count: rows[0].c });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
