import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/auth";

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    const { rows } = await p.query(
      `UPDATE bundles SET name=$1, description=$2, image=$3, price=$4, active=$5 WHERE id=$6 RETURNING *`,
      [b.name, b.description || "", b.image || "", Number(b.price) || 0, b.active !== false, params.id]
    );
    if (Array.isArray(b.items)) {
      await p.query("DELETE FROM bundle_items WHERE bundle_id=$1", [params.id]);
      for (const item of b.items) {
        await p.query(
          "INSERT INTO bundle_items (bundle_id, product_id, qty) VALUES ($1,$2,$3)",
          [params.id, item.productId, Number(item.qty) || 1]
        );
      }
    }
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    await p.query("DELETE FROM bundles WHERE id=$1", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
