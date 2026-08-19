import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { isAdmin } from "../../../lib/auth";

export async function GET(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const p = await db();
    const { rows: orderRows } = await p.query(
      `SELECT id, items, total, status, customer, created_at, ('KH-' || (order_no+10000)) AS order_number
       FROM orders ORDER BY created_at DESC`
    );
    const { rows: prodCountRows } = await p.query("SELECT COUNT(*)::int AS c FROM products");
    const { rows: pendingReviewRows } = await p.query("SELECT COUNT(*)::int AS c FROM reviews WHERE approved=false");

    const validOrders = orderRows.filter((o) => o.status !== "تم الإلغاء");
    const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const customers = new Set(orderRows.map((o) => o.customer?.phone).filter(Boolean));

    const productTotals = {};
    for (const o of validOrders) {
      for (const item of o.items || []) {
        const key = item.name || item.code;
        productTotals[key] = (productTotals[key] || 0) + Number(item.qty || 0);
      }
    }
    const topProducts = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Last 7 days revenue trend for the dashboard mini-chart.
    const dailyMap = {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(key);
      dailyMap[key] = 0;
    }
    for (const o of validOrders) {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (key in dailyMap) dailyMap[key] += Number(o.total || 0);
    }
    const dailyRevenue = days.map((key) => ({
      date: key,
      label: new Date(key).toLocaleDateString("ar-EG", { weekday: "short" }),
      total: dailyMap[key],
    }));

    return NextResponse.json({
      totalOrders: orderRows.length,
      newOrders: orderRows.filter((o) => o.status === "جديد").length,
      totalRevenue,
      totalProducts: prodCountRows[0].c,
      totalCustomers: customers.size,
      pendingReviews: pendingReviewRows[0].c,
      recentOrders: orderRows.slice(0, 6),
      topProducts,
      dailyRevenue,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
