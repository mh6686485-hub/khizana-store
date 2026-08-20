export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/boss", "/api"],
      },
    ],
    sitemap: "https://khizana-next.vercel.app/sitemap.xml",
  };
}
