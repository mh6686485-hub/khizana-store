"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, X, Plus, Minus, Check, ImageOff, Clock, Star, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }
function discountPercent(price, original){
  if(!original || original<=price) return 0;
  return Math.round(((original-price)/original)*100);
}
function remainingTime(expiry){
  if(!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  if(diff<=0) return null;
  const h = Math.floor(diff/3600000);
  const m = Math.floor((diff%3600000)/60000);
  const s = Math.floor((diff%60000)/1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function Countdown({expiry}){
  const [t,setT] = useState(remainingTime(expiry));
  useEffect(()=>{ const id=setInterval(()=>setT(remainingTime(expiry)),1000); return ()=>clearInterval(id); },[expiry]);
  if(!t) return null;
  return <span className="kh-countdown"><Clock size={13}/> ينتهي خلال {t}</span>;
}
function ProductImage({src,alt,className}){
  if(!src) return <div className={className+" kh-img-placeholder"}><ImageOff size={26}/></div>;
  return <img src={src} alt={alt} className={className} style={{objectFit:"cover"}} />;
}
function StarsRow({rating,size=13}){
  return (
    <span className="kh-stars-row" style={{margin:0}}>
      {[1,2,3,4,5].map(n=><Star key={n} size={size} fill={n<=Math.round(rating)?"var(--terracotta)":"none"} color="var(--terracotta)"/>)}
    </span>
  );
}

function AccountPromptModal({onClose,onConfirm}){
  const [value,setValue] = useState("");
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:380, textAlign:"center"}}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <h3 style={{marginBottom:8}}>حسابي في خِزانة</h3>
        <p className="kh-muted" style={{marginBottom:18}}>أدخل رقم موبايلك عشان نحفظلك المفضلة</p>
        <div className="kh-form">
          <input value={value} onChange={e=>setValue(e.target.value)} placeholder="01xxxxxxxxx"/>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:14}}
          disabled={value.trim().length<8} onClick={()=>onConfirm(value.trim())}>دخول</button>
      </div>
    </div>
  );
}

export default function ProductPageClient({ product, settings }){
  const [qty,setQty] = useState(1);
  const [reviews,setReviews] = useState([]);
  const [reviewForm,setReviewForm] = useState({name:"",rating:5,comment:""});
  const [reviewSubmitted,setReviewSubmitted] = useState(false);
  const [related,setRelated] = useState([]);
  const [phone,setPhone] = useState(null);
  const [inWishlist,setInWishlist] = useState(false);
  const [accountPromptOpen,setAccountPromptOpen] = useState(false);
  const [toast,setToast] = useState("");

  const disc = discountPercent(product.price, product.original_price);
  const stock = Number(product.stock ?? 20);
  const available = product.status === "available" && stock > 0;
  const lowStock = available && stock <= Number(product.min_stock ?? 5);
  const gallery = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
  const [activeImage,setActiveImage] = useState(gallery[0] || "");

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2600); }

  // Record this view for the "شاهدته مؤخرًا" section on the homepage.
  useEffect(()=>{
    try{
      const raw = localStorage.getItem("kh_recently_viewed");
      let list = raw ? JSON.parse(raw) : [];
      list = [product.id, ...list.filter(id=>id!==product.id)].slice(0,10);
      localStorage.setItem("kh_recently_viewed", JSON.stringify(list));
    }catch(e){}
  },[product.id]);

  useEffect(()=>{
    const saved = localStorage.getItem("kh_phone");
    if(saved) setPhone(saved);
  },[]);

  useEffect(()=>{
    if(!phone) return;
    fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}`)
      .then(r=>r.json()).then(ids=>setInWishlist(Array.isArray(ids) && ids.includes(product.id)))
      .catch(()=>{});
  },[phone, product.id]);

  useEffect(()=>{
    fetch("/api/reviews?productId="+product.id).then(r=>r.json()).then(d=>setReviews(Array.isArray(d)?d:[])).catch(()=>{});
    fetch("/api/products").then(r=>r.json()).then(all=>{
      setRelated((all||[]).filter(p=>p.category===product.category && p.id!==product.id && p.status==="available").slice(0,4));
    }).catch(()=>{});
  },[product.id, product.category]);

  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) : 0;

  function addToCart(){
    try{
      const raw = localStorage.getItem("kh_cart");
      let cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find(c=>c.type==="product" && c.id===product.id);
      if(existing) existing.qty += qty;
      else cart.push({type:"product", id:product.id, qty});
      localStorage.setItem("kh_cart", JSON.stringify(cart));
      showToast("تمت الإضافة للسلة");
    }catch(e){}
  }
  function orderNow(){
    const msg = `مرحباً، حابب أطلب:\n${product.name} (${product.code}) × ${qty}\nالسعر: ${egp(product.price*qty)} ج.م\nمن ${settings.store_name}`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  function shareProduct(){
    const link = typeof window !== "undefined" ? window.location.href : "";
    const msg = `شوف المنتج ده في ${settings.store_name}:\n${product.name} — ${egp(product.price)} ج.م\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  function toggleWishlist(){
    if(!phone){ setAccountPromptOpen(true); return; }
    const next = !inWishlist;
    setInWishlist(next);
    if(next) fetch("/api/wishlist", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone,productId:product.id})}).catch(()=>{});
    else fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}&productId=${product.id}`, {method:"DELETE"}).catch(()=>{});
  }
  function confirmPhone(value){
    localStorage.setItem("kh_phone", value);
    setPhone(value);
    setAccountPromptOpen(false);
    setInWishlist(true);
    fetch("/api/wishlist", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:value,productId:product.id})}).catch(()=>{});
  }
  async function submitReview(e){
    e.preventDefault();
    if(!reviewForm.name.trim()) return;
    try{
      await fetch("/api/reviews", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ productId:product.id, name:reviewForm.name, rating:reviewForm.rating, comment:reviewForm.comment }),
      });
      setReviewSubmitted(true);
    }catch(err){}
  }

  return (
    <div className="kh-root">
      {toast && <div className="kh-toast">{toast}</div>}

      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <Link href="/" className="kh-logo-wrap">
            <div className="kh-logo-text"><h1>{settings.store_name}</h1></div>
          </Link>
          <Link href="/" className="kh-action-btn" style={{marginRight:"auto"}}>
            <ArrowRight size={18}/> الرجوع للمتجر
          </Link>
        </div>
      </header>

      <div className="kh-wrap kh-section">
        <div className="kh-detail-grid" style={{maxWidth:900, margin:"0 auto"}}>
          <div>
            <ProductImage src={activeImage} alt={product.name} className="kh-detail-img"/>
            {gallery.length>1 && (
              <div className="kh-gallery-thumbs">
                {gallery.map((src,i)=>(
                  <button key={i} className={"kh-gallery-thumb"+(src===activeImage?" active":"")} onClick={()=>setActiveImage(src)}>
                    <ProductImage src={src} alt={`${product.name} ${i+1}`} className="kh-gallery-thumb-img"/>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <span className="kh-prod-code">{product.code}</span>
            <h1 style={{fontSize:"1.6rem", margin:"6px 0"}}>{product.name}</h1>
            {reviews.length>0 && (
              <div className="kh-stars-row">
                <StarsRow rating={avgRating} size={14}/>
                <span className="kh-muted" style={{fontSize:".8rem"}}>({reviews.length} تقييم)</span>
              </div>
            )}
            <div className="kh-detail-price-row">
              <span className="kh-price" style={{fontSize:"1.6rem"}}>{egp(product.price)} <small>ج.م</small></span>
              {disc>0 && <span className="kh-price-old">{egp(product.original_price)} ج.م</span>}
              {disc>0 && <span className="kh-tag kh-tag-copper" style={{position:"static"}}>خصم {disc}%</span>}
            </div>
            <span className={"kh-avail "+(available?"ok":"out")}>
              {available ? <><Check size={14}/> متوفر في المخزون{lowStock ? ` — متبقي ${stock} فقط` : ""}</> : "نفد من المخزون"}
            </span>
            {product.offer_expiry && <div style={{marginTop:6}}><Countdown expiry={product.offer_expiry}/></div>}
            <p className="kh-detail-desc">{product.description}</p>
            {product.specs && (
              <ul className="kh-specs">{product.specs.split("\n").filter(Boolean).map((s,i)=><li key={i}><Check size={14}/> {s}</li>)}</ul>
            )}
            <div className="kh-qty-row">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus size={14}/></button>
              <span>{qty}</span>
              <button onClick={()=>setQty(q=>Math.min(stock||99, q+1))}><Plus size={14}/></button>
            </div>
            <div className="kh-detail-actions">
              <button className="kh-btn kh-btn-primary" onClick={addToCart} disabled={!available}><ShoppingCart size={16}/> أضف للسلة</button>
              <button className="kh-btn kh-btn-sage" onClick={orderNow}>اطلب عبر واتساب</button>
              <button className={"kh-btn kh-btn-ghost-icon"+(inWishlist?" active":"")} onClick={toggleWishlist} aria-label="مفضلة">
                <Heart size={17} fill={inWishlist?"currentColor":"none"}/>
              </button>
              <button className="kh-btn kh-btn-ghost-icon" onClick={shareProduct} aria-label="مشاركة">
                <Share2 size={17}/>
              </button>
            </div>
          </div>
        </div>

        {related.length>0 && (
          <div className="kh-reviews-section" style={{maxWidth:900, margin:"24px auto 0"}}>
            <h3 style={{fontSize:"1.05rem", marginBottom:14}}>منتجات مشابهة</h3>
            <div className="kh-related-grid">
              {related.map(r=>(
                <Link key={r.id} href={`/product/${r.id}`} className="kh-related-card">
                  <ProductImage src={r.image} alt={r.name} className="kh-related-img"/>
                  <span className="kh-related-name">{r.name}</span>
                  <span className="kh-related-price">{egp(r.price)} ج.م</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="kh-reviews-section" style={{maxWidth:900, margin:"24px auto 0"}}>
          <h3 style={{fontSize:"1.05rem", marginBottom:14}}>آراء العملاء</h3>
          {reviews.length===0 && <p className="kh-muted" style={{marginBottom:14}}>لسه مفيش تقييمات على المنتج ده، كن أول من يقيّمه.</p>}
          {reviews.length>0 && (
            <div className="kh-review-list">
              {reviews.map(r=>(
                <div key={r.id} className="kh-review-item">
                  <div className="kh-stars-row">
                    <StarsRow rating={r.rating} size={13}/>
                    <strong style={{fontSize:".85rem"}}>{r.name}</strong>
                  </div>
                  {r.comment && <p style={{fontSize:".85rem", color:"var(--ink-soft)", margin:"4px 0 0"}}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
          {reviewSubmitted ? (
            <p className="kh-avail ok" style={{marginTop:14}}><Check size={14}/> شكراً لتقييمك، هيظهر بعد المراجعة.</p>
          ) : (
            <form className="kh-form" onSubmit={submitReview} style={{marginTop:16}}>
              <div className="kh-form-grid">
                <label>اسمك<input value={reviewForm.name} onChange={e=>setReviewForm({...reviewForm,name:e.target.value})} required/></label>
                <label>تقييمك
                  <select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:Number(e.target.value)})}>
                    {[5,4,3,2,1].map(n=><option key={n} value={n}>{"⭐".repeat(n)}</option>)}
                  </select>
                </label>
              </div>
              <label>تعليقك (اختياري)<textarea rows={2} value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})}/></label>
              <button className="kh-btn kh-btn-sage" type="submit">إرسال التقييم</button>
            </form>
          )}
        </div>
      </div>

      <footer className="kh-footer">
        <div className="kh-wrap kh-footer-inner">
          <Link href="/">← الرجوع للمتجر</Link>
        </div>
      </footer>

      {accountPromptOpen && (
        <AccountPromptModal onClose={()=>setAccountPromptOpen(false)} onConfirm={confirmPhone} />
      )}
    </div>
  );
}
