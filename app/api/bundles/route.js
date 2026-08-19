import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  try {
    const p = await db();
    const admin = isAdmin(req);
    const { rows: bundles } = await p.query(
      admin ? "SELECT * FROM bundles ORDER BY id DESC" : "SELECT * FROM bundles WHERE active=true ORDER BY id DESC"
    );
    if (bundles.length === 0) return NextResponse.json([]);
    const { rows: items } = await p.query(
      `SELECT bi.bundle_id, bi.product_id, bi.qty, pr.name, pr.price, pr.image
       FROM bundle_items bi LEFT JOIN products pr ON pr.id = bi.product_id
       WHERE bi.bundle_id = ANY($1::int[])`,
      [bundles.map((b) => b.id)]
    );
    const result = bundles.map((b) => ({
      ...b,
      items: items.filter((it) => it.bundle_id === b.id),
    }));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const p = await db();
    const { rows } = await p.query(
      `INSERT INTO bundles (name, description, image, price, active) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [b.name, b.description || "", b.image || "", Number(b.price) || 0, b.active !== false]
    );
    const bundle = rows[0];
    for (const item of b.items || []) {
      await p.query(
        "INSERT INTO bundle_items (bundle_id, product_id, qty) VALUES ($1,$2,$3)",
        [bundle.id, item.productId, Number(item.qty) || 1]
      );
    }
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
