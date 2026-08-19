import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/auth";

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { products } = await req.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات لاستيرادها" }, { status: 400 });
    }
    const p = await db();

    let added = 0, updated = 0;
    const errors = [];

    for (const row of products) {
      try {
        const code = String(row.code || "").trim();
        const name = String(row.name || "").trim();
        if (!code || !name) {
          errors.push(`صف بدون كود أو اسم تم تخطيه`);
          continue;
        }

        // Auto-create the category if it doesn't already exist.
        const category = String(row.category || "").trim();
        if (category) {
          await p.query(
            "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
            [category]
          );
        }

        const { rows: existing } = await p.query("SELECT id FROM products WHERE code=$1", [code]);
        const price = Number(row.price) || 0;
        const originalPrice = row.originalPrice ? Number(row.originalPrice) : price;
        const stock = Number.isFinite(Number(row.stock)) ? Number(row.stock) : 20;
        const minStock = Number.isFinite(Number(row.minStock)) ? Number(row.minStock) : 5;
        const status = row.status === "غير متاح" ? "unavailable" : "available";
        const isNew = row.isNew === "نعم";
        const isBestSeller = row.isBestSeller === "نعم";

        if (existing[0]) {
          await p.query(
            `UPDATE products SET name=$1,category=$2,price=$3,original_price=$4,description=$5,specs=$6,image=$7,status=$8,is_new=$9,is_best_seller=$10,stock=$11,min_stock=$12 WHERE code=$13`,
            [name, category, price, originalPrice, row.description || "", row.specs || "", row.image || "", status, isNew, isBestSeller, stock, minStock, code]
          );
          updated++;
        } else {
          await p.query(
            `INSERT INTO products (code,name,category,price,original_price,description,specs,image,status,is_new,is_best_seller,stock,min_stock)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [code, name, category, price, originalPrice, row.description || "", row.specs || "", row.image || "", status, isNew, isBestSeller, stock, minStock]
          );
          added++;
        }
      } catch (rowErr) {
        errors.push(`${row.code || "؟"}: ${rowErr.message}`);
      }
    }

    return NextResponse.json({ added, updated, errors });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
