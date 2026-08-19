"use client";
import { useEffect, useState } from "react";
import { User, Heart, Package, LogOut, ShoppingCart, X, ImageOff } from "lucide-react";
import Link from "next/link";

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }
function ProductImage({src,alt,className}){
  if(!src) return <div className={className+" kh-img-placeholder"}><ImageOff size={20}/></div>;
  return <img src={src} alt={alt} className={className} style={{objectFit:"cover"}}/>;
}

export default function AccountPage(){
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [phone,setPhone] = useState(null);
  const [phoneInput,setPhoneInput] = useState("");
  const [tab,setTab] = useState(params?.get("tab") === "wishlist" ? "wishlist" : "orders");
  const [orders,setOrders] = useState([]);
  const [wishlistProducts,setWishlistProducts] = useState([]);
  const [points,setPoints] = useState(null);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    const saved = localStorage.getItem("kh_phone");
    if(saved) setPhone(saved);
  },[]);

  useEffect(()=>{
    if(!phone) return;
    setLoading(true);
    Promise.all([
      fetch("/api/customer/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone}) }).then(r=>r.json()),
      fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}`).then(r=>r.json()),
      fetch("/api/products").then(r=>r.json()),
      fetch(`/api/points?phone=${encodeURIComponent(phone)}`).then(r=>r.json()),
    ]).then(([ordersData, wishlistIds, allProducts, pointsData])=>{
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      const ids = Array.isArray(wishlistIds) ? wishlistIds : [];
      setWishlistProducts((allProducts||[]).filter(p=>ids.includes(p.id)));
      setPoints(pointsData);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[phone]);

  function login(e){
    e.preventDefault();
    if(phoneInput.trim().length<8) return;
    localStorage.setItem("kh_phone", phoneInput.trim());
    setPhone(phoneInput.trim());
  }
  function logout(){
    localStorage.removeItem("kh_phone");
    setPhone(null);
    setOrders([]);
    setWishlistProducts([]);
  }
  async function removeFromWishlist(productId){
    setWishlistProducts(prev=>prev.filter(p=>p.id!==productId));
    try{
      await fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}&productId=${productId}`, {method:"DELETE"});
    }catch(e){}
  }

  return (
    <div className="kh-root">
      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <Link href="/" className="kh-logo-wrap">
            <div className="kh-logo-text"><h1>خِزانة</h1></div>
          </Link>
        </div>
      </header>

      <div className="kh-wrap kh-section" style={{maxWidth:640, margin:"0 auto"}}>
        {!phone ? (
          <form className="kh-form" onSubmit={login} style={{background:"var(--white)", padding:24, borderRadius:"var(--radius)", border:"1px solid rgba(53,67,49,.08)", maxWidth:380, margin:"0 auto"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"var(--cream-deep)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"var(--olive-deep)"}}>
              <User size={26}/>
            </div>
            <h2 style={{textAlign:"center", marginBottom:8}}>حسابي</h2>
            <p className="kh-muted" style={{textAlign:"center", marginBottom:18}}>أدخل رقم موبايلك لعرض طلباتك ومفضلتك</p>
            <label>رقم الموبايل<input value={phoneInput} onChange={e=>setPhoneInput(e.target.value)} placeholder="01xxxxxxxxx"/></label>
            <button className="kh-btn kh-btn-primary kh-full" type="submit" style={{marginTop:6}}>دخول</button>
          </form>
        ) : (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
              <div>
                <h2 style={{fontSize:"1.3rem"}}>حسابي</h2>
                <p className="kh-muted">{phone}</p>
                {points?.points>0 && <p style={{color:"var(--olive-deep)", fontWeight:700, fontSize:".85rem", marginTop:4}}>⭐ {points.points} نقطة ولاء (تساوي {egp(points.points*(points.pointValue||1))} ج.م)</p>}
              </div>
              <button className="kh-btn kh-btn-ghost" onClick={logout}><LogOut size={15}/> خروج</button>
            </div>

            <div className="kh-chips" style={{marginBottom:22}}>
              <button className={"kh-chip"+(tab==="orders"?" active":"")} onClick={()=>setTab("orders")}><Package size={14}/> طلباتي ({orders.length})</button>
              <button className={"kh-chip"+(tab==="wishlist"?" active":"")} onClick={()=>setTab("wishlist")}><Heart size={14}/> المفضلة ({wishlistProducts.length})</button>
            </div>

            {loading && <p className="kh-muted">جارِ التحميل...</p>}

            {!loading && tab==="orders" && (
              orders.length===0 ? <div className="kh-empty">لسه معملتش أي طلبات.</div> : (
                <div className="kh-orders">
                  {orders.map(o=>(
                    <div key={o.id} className="kh-order-card">
                      <div className="kh-order-head">
                        <strong>{o.order_number}</strong>
                        <span>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                        <span className="kh-status ok">{o.status}</span>
                      </div>
                      <ul>{(o.items||[]).map((it,i)=><li key={i}>{it.name} × {it.qty}</li>)}</ul>
                      <div className="kh-order-total">الإجمالي: {egp(o.total)} ج.م</div>
                    </div>
                  ))}
                </div>
              )
            )}

            {!loading && tab==="wishlist" && (
              wishlistProducts.length===0 ? <div className="kh-empty">مفيش منتجات في المفضلة لسه.</div> : (
                <div className="kh-prod-grid">
                  {wishlistProducts.map(p=>(
                    <div key={p.id} className="kh-prod-card">
                      <div className="kh-prod-media">
                        <ProductImage src={p.image} alt={p.name} className="kh-prod-img"/>
                        <button className="kh-heart active" onClick={()=>removeFromWishlist(p.id)} aria-label="إزالة من المفضلة">
                          <X size={15}/>
                        </button>
                      </div>
                      <div className="kh-prod-info">
                        <span className="kh-prod-code">{p.code}</span>
                        <h4>{p.name}</h4>
                        <div className="kh-price-row">
                          <div className="kh-price">{egp(p.price)} <small>ج.م</small></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
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
