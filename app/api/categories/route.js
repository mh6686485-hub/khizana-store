import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET() {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM categories ORDER BY id");
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { name } = await req.json();
    const p = await db();
    const { rows } = await p.query(
      "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *",
      [name]
    );
    return NextResponse.json(rows[0] || { name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
