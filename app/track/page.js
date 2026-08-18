"use client";
import { useState } from "react";
import { Search, Check, Circle, X as XIcon } from "lucide-react";
import Link from "next/link";

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }

const STEPS = ["جديد", "تم التأكيد", "قيد التجهيز", "تم الشحن", "خرج للتوصيل", "تم التسليم"];

export default function TrackPage(){
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [orderNumber, setOrderNumber] = useState(params?.get("order") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(e){
    e.preventDefault();
    setError(""); setOrder(null); setLoading(true);
    try{
      const res = await fetch("/api/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();
      if(!res.ok){ setError(data.error || "حدث خطأ"); }
      else setOrder(data);
    }catch(e2){ setError("تعذر الاتصال، حاول تاني"); }
    setLoading(false);
  }

  const cancelled = order?.status === "تم الإلغاء";
  const currentStepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="kh-root">
      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <Link href="/" className="kh-logo-wrap">
            <div className="kh-logo-text"><h1>خِزانة</h1></div>
          </Link>
        </div>
      </header>

      <div className="kh-wrap kh-section" style={{maxWidth:560, margin:"0 auto"}}>
        <div className="kh-section-head" style={{display:"block"}}>
          <h2>تتبع طلبك</h2>
          <p className="kh-muted" style={{marginTop:6}}>أدخل رقم الطلب ورقم الهاتف اللي طلبت بيه</p>
        </div>

        <form className="kh-form" onSubmit={track} style={{background:"var(--white)", padding:22, borderRadius:"var(--radius)", border:"1px solid rgba(53,67,49,.08)"}}>
          <label>رقم الطلب<input value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} placeholder="KH-10258" required/></label>
          <label>رقم الهاتف<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="01xxxxxxxxx" required/></label>
          <button className="kh-btn kh-btn-primary kh-full" type="submit" disabled={loading}>
            <Search size={16}/> {loading ? "جارِ البحث..." : "تتبع الطلب"}
          </button>
        </form>

        {error && <div className="kh-coupon-msg" style={{marginTop:14, textAlign:"center"}}>{error}</div>}

        {order && (
          <div style={{background:"var(--white)", padding:22, borderRadius:"var(--radius)", border:"1px solid rgba(53,67,49,.08)", marginTop:20}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
              <strong style={{fontSize:"1.1rem"}}>{order.order_number}</strong>
              <span className="kh-muted">{new Date(order.created_at).toLocaleDateString("ar-EG")}</span>
            </div>

            {cancelled ? (
              <div className="kh-avail out" style={{fontSize:"1rem"}}><XIcon size={16}/> تم إلغاء الطلب</div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:0}}>
                {STEPS.map((step, i)=>(
                  <div key={step} style={{display:"flex", alignItems:"center", gap:12}}>
                    <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                      <div style={{
                        width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                        background: i<=currentStepIndex ? "var(--olive)" : "var(--cream-deep)",
                        color: i<=currentStepIndex ? "#fff" : "var(--ink-soft)",
                      }}>
                        {i<currentStepIndex ? <Check size={14}/> : <Circle size={8} fill="currentColor"/>}
                      </div>
                      {i<STEPS.length-1 && <div style={{width:2, height:34, background: i<currentStepIndex ? "var(--olive)" : "var(--cream-deep)"}}/>}
                    </div>
                    <span style={{
                      fontWeight: i===currentStepIndex ? 700 : 500,
                      color: i<=currentStepIndex ? "var(--ink)" : "var(--ink-soft)",
                      paddingBottom: 20,
                    }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="kh-cart-summary" style={{marginTop:10}}>
              <div><span>عدد المنتجات</span><span>{(order.items||[]).length}</span></div>
              <div><span>قيمة المنتجات</span><span>{egp(order.subtotal)} ج.م</span></div>
              <div><span>الشحن</span><span>{egp(order.shipping_cost)} ج.م</span></div>
              <div className="kh-cart-total"><span>الإجمالي</span><span>{egp(order.total)} ج.م</span></div>
            </div>
            <p className="kh-muted" style={{marginTop:10}}>
              {order.governorate}{order.city ? " — "+order.city : ""}{order.area ? " — "+order.area : ""}
            </p>
          </div>
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
