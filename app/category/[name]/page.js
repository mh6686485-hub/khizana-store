import CategoryPageClient from "./CategoryPageClient";

export function generateMetadata({ params }) {
  const name = decodeURIComponent(params.name);
  return {
    title: `${name} | خِزانة`,
    description: `تسوق ${name} بأفضل الأسعار مع توصيل لجميع محافظات مصر والدفع عند الاستلام.`,
  };
}

export default function CategoryPage({ params }) {
  const categoryName = decodeURIComponent(params.name);
  return <CategoryPageClient categoryName={categoryName} />;
}