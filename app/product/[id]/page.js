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

  const { rows: reviewStats } = await p.query(
    "SELECT AVG(rating)::numeric AS avg, COUNT(*)::int AS count FROM reviews WHERE product_id=$1 AND approved=true",
    [product.id]
  );
  const avgRating = Number(reviewStats[0]?.avg || 0);
  const reviewCount = Number(reviewStats[0]?.count || 0);
  const inStock = product.status === "available" && Number(product.stock ?? 0) > 0;
  const canonicalUrl = `https://khizana-next.vercel.app/product/${product.id}`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    sku: product.code,
    ...(product.image && product.image.startsWith("http") ? { image: [product.image] } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "EGP",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient product={product} settings={settings} />
    </>
  );
}
