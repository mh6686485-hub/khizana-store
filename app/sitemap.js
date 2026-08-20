import { db } from "../lib/db";

export default async function sitemap() {
  const base = "https://khizana-next.vercel.app";
  const staticRoutes = ["", "/about", "/returns", "/track"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.5,
  }));

  try {
    const p = await db();
    const { rows } = await p.query(
      "SELECT id, created_at FROM products WHERE status='available' ORDER BY id"
    );
    const productRoutes = rows.map((product) => ({
      url: `${base}/product/${product.id}`,
      lastModified: product.created_at || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
