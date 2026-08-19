"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AboutPage(){
  const [settings,setSettings] = useState(null);
  useEffect(()=>{
    fetch("/api/settings").then(r=>r.json()).then(setSettings).catch(()=>{});
  },[]);

  return (
    <div className="kh-root">
      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <Link href="/" className="kh-logo-wrap">
            <div className="kh-logo-text"><h1>{settings?.store_name || "خِزانة"}</h1></div>
          </Link>
        </div>
      </header>

      <div className="kh-wrap kh-section" style={{maxWidth:680, margin:"0 auto"}}>
        <h2 style={{marginBottom:20}}>من نحن</h2>
        {!settings ? (
          <p className="kh-muted">جارِ التحميل...</p>
        ) : settings.about_us ? (
          <p className="kh-content-page">{settings.about_us}</p>
        ) : (
          <p className="kh-muted">لسه مفيش محتوى مضاف هنا.</p>
        )}
      </div>

      <footer className="kh-footer">
        <div className="kh-wrap kh-footer-inner">
          <Link href="/">← الرجوع للمتجر</Link>
        </div>
      </footer>
    </div>
  );
}
