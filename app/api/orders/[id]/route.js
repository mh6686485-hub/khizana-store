import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/auth";

export async function GET(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows } = await p.query(
      `SELECT *, ('KH-' || (order_no + 10000)) AS order_number FROM orders WHERE id=$1`,
      [params.id]
    );
    if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    if (b.status !== undefined && b.note !== undefined) {
      const { rows } = await p.query(
        `UPDATE orders SET status=$1, admin_note=$2 WHERE id=$3 RETURNING *, ('KH-' || (order_no + 10000)) AS order_number`,
        [b.status, b.note, params.id]
      );
      return NextResponse.json(rows[0]);
    }
    if (b.note !== undefined) {
      const { rows } = await p.query(
        `UPDATE orders SET admin_note=$1 WHERE id=$2 RETURNING *, ('KH-' || (order_no + 10000)) AS order_number`,
        [b.note, params.id]
      );
      return NextResponse.json(rows[0]);
    }
    const { rows } = await p.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *, ('KH-' || (order_no + 10000)) AS order_number`,
      [b.status, params.id]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
