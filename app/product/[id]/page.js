import { db } from "../../../lib/db";
import ProductPageClient from "./ProductPageClient";

export async function generateMetadata({ params }) {
  try {
    const p = await db();
    const { rows } = await p.query("SELECT * FROM products WHERE id=$1", [params.id]);
    const product = rows[0];
    if (!product) return { title: "المنتج غير متاح | خِزانة" };

    const description =
      (product.description || "").slice(0, 155) ||
      `${product.name} — اشترِ الآن من خِزانة بأفضل سعر مع توصيل لجميع محافظات مصر والدفع عند الاستلام.`;

    const meta = {
      title: `${product.name} | خِزانة`,
      description,
      openGraph: {
        title: product.name,
        description,
        type: "website",
      },
    };
    if (product.image && product.image.startsWith("http")) {
      meta.openGraph.images = [{ url: product.image }];
    }
    return meta;
  } catch (e) {
    return { title: "خِزانة" };
  }
}

export default async function ProductPage({ params }) {
  const p = await db();
  const { rows } = await p.query("SELECT * FROM products WHERE id=$1", [params.id]);
  const product = rows[0];

  const { rows: settingsRows } = await p.query(
    "SELECT store_name, whatsapp FROM settings WHERE id=1"
  );
  const settings = settingsRows[0] || { store_name: "خِزانة", whatsapp: "201000000000" };

  if (!product) {
    return (
      <div className="kh-root kh-loading" style={{ flexDirection: "column", gap: 14 }}>
        <p>هذا المنتج غير متاح حاليًا.</p>
        <a href="/" className="kh-btn kh-btn-primary">الرجوع للمتجر</a>
      </div>
    );
  }

  return <ProductPageClient product={product} settings={settings} />;
}
