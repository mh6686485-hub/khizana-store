import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://khizana-next.vercel.app"),
  title: "خِزانة | كل أدوات بيتك في مكان واحد",
  description: "متجر إلكتروني لأدوات ولوازم المنزل — توصيل لجميع محافظات مصر والدفع عند الاستلام.",
  openGraph: {
    title: "خِزانة | كل أدوات بيتك في مكان واحد",
    description: "متجر إلكتروني لأدوات ولوازم المنزل — توصيل لجميع محافظات مصر والدفع عند الاستلام.",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "خِزانة | كل أدوات بيتك في مكان واحد",
    description: "متجر إلكتروني لأدوات ولوازم المنزل.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=Tajawal:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try{
                var theme = localStorage.getItem('kh_theme');
                if(theme==='dark'){ document.documentElement.setAttribute('data-theme','dark'); }
                var lang = localStorage.getItem('kh_lang');
                if(lang==='en'){ document.documentElement.setAttribute('lang','en'); document.documentElement.setAttribute('dir','ltr'); }
              }catch(e){}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
