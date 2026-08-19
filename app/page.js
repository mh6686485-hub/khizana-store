"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, Search, X, Plus, Minus, Trash2, Clock, Check, ImageOff, Lock, Truck, ShieldCheck, Headphones, Wallet, Leaf, Star, User, SlidersHorizontal, Package2, Gift, Share2 } from "lucide-react";
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

/* Decorative hero illustration — inline SVG so no external image/hosting is needed. */
function HeroIllustration(){
  return (
    <svg viewBox="0 0 400 320" width="100%" height="100%" role="img" aria-label="أدوات منزلية على رف">
      <rect x="0" y="0" width="400" height="320" fill="var(--white)"/>
      <rect x="30" y="230" width="340" height="8" rx="4" fill="var(--cream-deep)"/>
      <rect x="60" y="238" width="8" height="46" fill="var(--cream-deep)"/>
      <rect x="332" y="238" width="8" height="46" fill="var(--cream-deep)"/>
      <g>
        <rect x="70" y="150" width="70" height="80" rx="10" fill="var(--olive)"/>
        <rect x="70" y="150" width="70" height="16" rx="8" fill="var(--olive-deep)"/>
        <circle cx="105" cy="140" r="10" fill="var(--olive-deep)"/>
      </g>
      <g>
        <rect x="155" y="120" width="60" height="110" rx="14" fill="var(--white)" stroke="var(--cream-deep)" strokeWidth="3"/>
        <rect x="155" y="120" width="60" height="18" rx="9" fill="var(--terracotta)"/>
        <circle cx="175" cy="170" r="5" fill="var(--cream-deep)"/>
        <circle cx="195" cy="185" r="5" fill="var(--cream-deep)"/>
        <circle cx="180" cy="200" r="5" fill="var(--cream-deep)"/>
      </g>
      <g>
        <ellipse cx="260" cy="215" rx="45" ry="15" fill="var(--olive-deep)"/>
        <rect x="215" y="170" width="90" height="50" rx="18" fill="var(--olive)"/>
        <rect x="205" y="185" width="14" height="10" rx="5" fill="var(--olive)"/>
        <rect x="301" y="185" width="14" height="10" rx="5" fill="var(--olive)"/>
      </g>
      <g>
        <rect x="325" y="165" width="34" height="65" rx="8" fill="var(--white)" stroke="var(--cream-deep)" strokeWidth="3"/>
        <path d="M330 165 Q342 140 354 165" fill="none" stroke="var(--olive)" strokeWidth="4" strokeLinecap="round"/>
      </g>
      <g>
        <circle cx="345" cy="120" r="22" fill="var(--cream-deep)"/>
        <path d="M345 132c-10 0-16-8-16-16 8 0 16 6 16 16Zm0 0c10 0 16-8 16-16-8 0-16 6-16 16Z" fill="var(--olive)"/>
        <rect x="343" y="130" width="4" height="18" fill="var(--olive)"/>
      </g>
    </svg>
  );
}

const EGYPT_GOVERNORATES = [
  "القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","المنوفية",
  "البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء",
  "بني سويف","الفيوم","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر",
  "الوادي الجديد","مطروح",
];

export default function StorePage(){
  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [coupons,setCoupons] = useState([]);
  const [bundles,setBundles] = useState([]);
  const [ratings,setRatings] = useState({});
  const [settings,setSettings] = useState({store_name:"خِزانة", whatsapp:"201000000000", shipping_cost:60});
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [activeCategory,setActiveCategory] = useState("الكل");
  const [sortBy,setSortBy] = useState("newest");
  const [priceMin,setPriceMin] = useState("");
  const [priceMax,setPriceMax] = useState("");
  const [onlyDiscounted,setOnlyDiscounted] = useState(false);
  const [minRating,setMinRating] = useState(0);
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [cart,setCart] = useState([]);
  const [wishlist,setWishlist] = useState([]);
  const [cartOpen,setCartOpen] = useState(false);
  const [checkoutOpen,setCheckoutOpen] = useState(false);
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [couponInput,setCouponInput] = useState("");
  const [appliedCoupon,setAppliedCoupon] = useState(null);
  const [couponMsg,setCouponMsg] = useState("");
  const [toast,setToast] = useState("");
  const [successOrder,setSuccessOrder] = useState(null);
  const [phone,setPhone] = useState(null);
  const [accountPromptOpen,setAccountPromptOpen] = useState(false);
  const [pendingWishlistProduct,setPendingWishlistProduct] = useState(null);
  const [myPoints,setMyPoints] = useState(null);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2600); }

  useEffect(()=>{
    const saved = typeof window !== "undefined" ? localStorage.getItem("kh_phone") : null;
    if(saved) setPhone(saved);
    try{
      const savedCart = localStorage.getItem("kh_cart");
      if(savedCart){
        const parsed = JSON.parse(savedCart);
        if(Array.isArray(parsed)) setCart(parsed);
      }
    }catch(e){}
  },[]);

  useEffect(()=>{
    try{ localStorage.setItem("kh_cart", JSON.stringify(cart)); }catch(e){}
  },[cart]);

  useEffect(()=>{
    if(!phone) return;
    fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}`)
      .then(r=>r.json()).then(ids=>setWishlist(Array.isArray(ids)?ids:[]))
      .catch(()=>{});
    fetch(`/api/points?phone=${encodeURIComponent(phone)}`)
      .then(r=>r.json()).then(d=>setMyPoints(d)).catch(()=>{});
  },[phone]);

  useEffect(()=>{
    (async()=>{
      try{
        const [pRes,cRes,cpRes,sRes,bRes,rRes] = await Promise.all([
          fetch("/api/products"), fetch("/api/categories"), fetch("/api/coupons"), fetch("/api/settings"),
          fetch("/api/bundles"), fetch("/api/reviews/summary"),
        ]);
        const productsData = await pRes.json();
        setProducts(productsData);
        setCategories(await cRes.json());
        setCoupons(await cpRes.json());
        setSettings(await sRes.json());
        setBundles(await bRes.json());
        setRatings(await rRes.json());

        const sharedId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("product") : null;
        if(sharedId){
          const found = productsData.find(p=>String(p.id)===String(sharedId));
          if(found) setSelectedProduct(found);
        }
      }catch(e){ console.error(e); }
      setLoading(false);
    })();
  },[]);

  const visibleProducts = products.filter(p=>p.status==="available" && Number(p.stock ?? 1) > 0);

  function applyFiltersSort(list){
    let out = list.filter(p=>{
      if(priceMin && Number(p.price) < Number(priceMin)) return false;
      if(priceMax && Number(p.price) > Number(priceMax)) return false;
      if(onlyDiscounted && discountPercent(p.price, p.original_price) <= 0) return false;
      if(minRating > 0){
        const r = ratings[p.id];
        if(!r || r.avg < minRating) return false;
      }
      return true;
    });
    if(sortBy==="price_asc") out = [...out].sort((a,b)=>a.price-b.price);
    else if(sortBy==="price_desc") out = [...out].sort((a,b)=>b.price-a.price);
    else if(sortBy==="discount") out = [...out].sort((a,b)=>discountPercent(b.price,b.original_price)-discountPercent(a.price,a.original_price));
    else out = [...out].sort((a,b)=>b.id-a.id);
    return out;
  }

  const offerProducts = visibleProducts.filter(p=>p.offer_expiry && remainingTime(p.offer_expiry));
  const filteredProducts = applyFiltersSort(visibleProducts.filter(p=>{
    const matchCat = activeCategory==="الكل" || p.category===activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    return matchCat && matchSearch;
  }));

  const cartLines = cart.map(c=>{
    if(c.type==="bundle"){
      const bd = bundles.find(b=>b.id===c.id);
      return bd ? { ...c, name:bd.name, image:bd.image, price:Number(bd.price), product:null } : null;
    }
    const pr = products.find(pp=>pp.id===c.id);
    return pr ? { ...c, name:pr.name, image:pr.image, price:Number(pr.price), product:pr } : null;
  }).filter(Boolean);

  const subtotal = cartLines.reduce((s,l)=>s+l.price*l.qty,0);
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.discount_type === "fixed"
        ? Math.min(Number(appliedCoupon.discount_percent), subtotal)
        : Math.round(subtotal*appliedCoupon.discount_percent/100))
    : 0;
  const total = Math.max(0, subtotal-couponDiscount);
  const cartCount = cart.reduce((s,c)=>s+c.qty,0);
  const wishlistCount = wishlist.length;

  function addToCart(type, id, qty=1){
    setCart(prev=>{
      const existing = prev.find(c=>c.type===type && c.id===id);
      if(existing) return prev.map(c=>(c.type===type && c.id===id)?{...c,qty:c.qty+qty}:c);
      return [...prev,{type,id,qty}];
    });
    showToast("تمت الإضافة للسلة");
  }
  function updateQty(type, id, qty){
    if(qty<=0){ setCart(prev=>prev.filter(c=>!(c.type===type && c.id===id))); return; }
    setCart(prev=>prev.map(c=>(c.type===type && c.id===id)?{...c,qty}:c));
  }
  function toggleWishlist(productId){
    if(!phone){
      setPendingWishlistProduct(productId);
      setAccountPromptOpen(true);
      return;
    }
    const inList = wishlist.includes(productId);
    setWishlist(prev=>inList?prev.filter(id=>id!==productId):[...prev,productId]);
    if(inList){
      fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}&productId=${productId}`, {method:"DELETE"}).catch(()=>{});
    }else{
      fetch("/api/wishlist", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone,productId})}).catch(()=>{});
    }
  }
  function confirmPhone(value){
    localStorage.setItem("kh_phone", value);
    setPhone(value);
    setAccountPromptOpen(false);
    if(pendingWishlistProduct){
      const pid = pendingWishlistProduct;
      setPendingWishlistProduct(null);
      setWishlist(prev=>prev.includes(pid)?prev:[...prev,pid]);
      fetch("/api/wishlist", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({phone:value,productId:pid})}).catch(()=>{});
    }
  }
  function applyCoupon(){
    const code = couponInput.trim().toUpperCase();
    const found = coupons.find(c=>c.code.toUpperCase()===code);
    if(!found) return setCouponMsg("الكود غير صحيح");
    if(!found.active) return setCouponMsg("الكود غير مفعّل");
    if(found.expiry && new Date(found.expiry)<new Date()) return setCouponMsg("الكود منتهي الصلاحية");
    if(found.max_uses && Number(found.used_count) >= Number(found.max_uses)) return setCouponMsg("انتهت الكمية المتاحة لهذا الكوبون");
    if(subtotal < Number(found.min_order)) return setCouponMsg(`الحد الأدنى للطلب ${egp(found.min_order)} ج.م`);
    setAppliedCoupon(found);
    setCouponMsg("تم تطبيق الكوبون بنجاح");
  }

  async function submitOrder(form){
    const items = cartLines.map(l=>(
      l.type==="bundle"
        ? { type:"bundle", bundleId:l.id, name:l.name, price:l.price, qty:l.qty }
        : { type:"product", productId:l.id, code:l.product?.code, name:l.name, price:l.price, qty:l.qty }
    ));
    const customer = { name:form.name, phone:form.phone, phone2:form.phone2, address:form.address };
    const payload = {
      items, subtotal, discount:couponDiscount, couponCode: appliedCoupon?appliedCoupon.code:null, total, customer,
      governorate: form.governorate, city: form.city, area: form.area, landmark: form.landmark,
      usePoints: form.usePoints,
    };
    try{
      const res = await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const order = await res.json();
      setCart([]); setAppliedCoupon(null); setCouponInput(""); setCheckoutOpen(false); setCartOpen(false);
      setSuccessOrder(order);
      if(phone) fetch(`/api/points?phone=${encodeURIComponent(phone)}`).then(r=>r.json()).then(d=>setMyPoints(d)).catch(()=>{});
    }catch(e){
      console.error(e);
      showToast("حدث خطأ أثناء إرسال الطلب، حاول تاني");
    }
  }

  function sendOrderOnWhatsapp(order){
    const items = order.items || [];
    const lines = items.map(it=>`• ${it.name} × ${it.qty} = ${egp(it.price*it.qty)} ج.م`).join("\n");
    const msg = `طلب رقم ${order.order_number} من ${settings.store_name}\n\n${lines}\n\nالإجمالي: ${egp(order.total)} ج.م`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  function goCategory(name){
    setActiveCategory(name);
    document.getElementById("products-section")?.scrollIntoView({behavior:"smooth"});
  }
  function goHome(){
    setActiveCategory("الكل");
    window.scrollTo({top:0, behavior:"smooth"});
  }
  function goOffers(){
    const el = document.getElementById("offers-section") || document.getElementById("products-section");
    el?.scrollIntoView({behavior:"smooth"});
  }

  if(loading) return <div className="kh-root kh-loading">جارِ تحميل {settings.store_name}...</div>;

  return (
    <div className="kh-root">
      {toast && <div className="kh-toast">{toast}</div>}

      <div className="kh-topbar">
        <div className="kh-topbar-inner">
          <span className="kh-topbar-item"><Truck size={14}/> توصيل لجميع محافظات مصر</span>
          <span className="kh-topbar-item"><ShieldCheck size={14}/> ضمان جودة على جميع المنتجات</span>
        </div>
      </div>

      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <div className="kh-logo-wrap">
            <div className="kh-logo-text">
              <h1>خِزانة</h1>
              <div className="kh-logo-tagline">كل أدوات بيتك في مكان واحد</div>
            </div>
          </div>
          <div className="kh-search">
            <Search size={16}/>
            <input placeholder="ابحث عن منتج..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="kh-header-actions">
            <Link href="/account" className="kh-action-btn">
              <span style={{position:"relative"}}><User size={19}/></span>
              حسابي
            </Link>
            <Link href="/account?tab=wishlist" className="kh-action-btn">
              <span style={{position:"relative"}}>
                <Heart size={19}/>
                {wishlistCount>0 && <span className="kh-badge">{wishlistCount}</span>}
              </span>
              المفضلة
            </Link>
            <button className="kh-action-btn" onClick={()=>setCartOpen(true)} aria-label="السلة">
              <span style={{position:"relative"}}>
                <ShoppingCart size={19}/>
                {cartCount>0 && <span className="kh-badge">{cartCount}</span>}
              </span>
              السلة
            </button>
          </div>
        </div>
      </header>

      <nav className="kh-catnav">
        <div className="kh-catnav-inner">
          <button className={"kh-catnav-item"+(activeCategory==="الكل"?" active":"")} onClick={goHome}>الرئيسية</button>
          {categories.map(c=>(
            <button key={c.id} className={"kh-catnav-item"+(activeCategory===c.name?" active":"")} onClick={()=>goCategory(c.name)}>{c.name}</button>
          ))}
          <button className="kh-catnav-item" onClick={goOffers}>عروض خِزانة</button>
        </div>
      </nav>

      <section className="kh-hero-section">
        <div className="kh-wrap kh-hero">
          <div>
            <div className="kh-eyebrow">توصيل لجميع محافظات مصر</div>
            <h1>كل حاجة يحتاجها بيتك، <span className="accent">مرتّبة</span> في مكان واحد</h1>
            <p className="kh-lead">من المطبخ للتخزين والتنظيم — أدوات منزلك بجودة تضمنها وأسعار تناسب كل بيت.</p>
            <div className="kh-hero-actions">
              <button className="kh-btn kh-btn-primary" onClick={()=>document.getElementById("products-section")?.scrollIntoView({behavior:"smooth"})}>
                <ShoppingCart size={16}/> تسوق الآن
              </button>
              <button className="kh-btn kh-btn-outline-terracotta" onClick={goOffers}>عروض خِزانة</button>
            </div>
          </div>
          <div className="kh-hero-visual"><HeroIllustration/></div>
        </div>
      </section>

      <section className="kh-benefits">
        <div className="kh-wrap kh-benefits-grid">
          <div className="kh-benefit">
            <div className="kh-benefit-icon"><Truck size={20}/></div>
            <div><h5>توصيل سريع</h5><p>في جميع المحافظات</p></div>
          </div>
          <div className="kh-benefit">
            <div className="kh-benefit-icon"><Headphones size={20}/></div>
            <div><h5>خدمة عملاء مميزة</h5><p>نحن هنا لمساعدتك</p></div>
          </div>
          <div className="kh-benefit">
            <div className="kh-benefit-icon"><ShieldCheck size={20}/></div>
            <div><h5>ضمان جودة</h5><p>على جميع المنتجات</p></div>
          </div>
          <div className="kh-benefit">
            <div className="kh-benefit-icon"><Wallet size={20}/></div>
            <div><h5>الدفع عند الاستلام</h5><p>ادفع عند استلام طلبك</p></div>
          </div>
        </div>
      </section>

      {offerProducts.length>0 && (
        <section id="offers-section" className="kh-wrap kh-section">
          <div className="kh-section-head"><h2>عروض خِزانة — هتفوتك لو اتأخرت</h2></div>
          <div className="kh-prod-grid">
            {offerProducts.map(p=>(
              <ProductCard key={p.id} product={p} rating={ratings[p.id]} inWishlist={wishlist.includes(p.id)} onToggleWishlist={()=>toggleWishlist(p.id)} onAdd={()=>addToCart("product",p.id)} onOpen={()=>setSelectedProduct(p)} showOffer/>
            ))}
          </div>
        </section>
      )}

      {bundles.length>0 && (
        <section className="kh-wrap kh-section" style={{paddingTop:0}}>
          <div className="kh-section-head"><h2><Gift size={19} style={{verticalAlign:"-3px", color:"var(--terracotta)"}}/> باقات موفرة</h2></div>
          <div className="kh-prod-grid">
            {bundles.map(bd=>{
              const compTotal = (bd.items||[]).reduce((s,it)=>s+Number(it.price||0)*it.qty,0);
              const savings = Math.max(0, compTotal - Number(bd.price));
              return (
                <div key={bd.id} className="kh-prod-card">
                  <div className="kh-prod-media">
                    <ProductImage src={bd.image || (bd.items?.[0]?.image)} alt={bd.name} className="kh-prod-img"/>
                    {savings>0 && <span className="kh-tag kh-tag-copper">وفّر {egp(savings)} ج.م</span>}
                  </div>
                  <div className="kh-prod-info">
                    <span className="kh-prod-code"><Package2 size={12} style={{verticalAlign:"-2px"}}/> باقة</span>
                    <h4>{bd.name}</h4>
                    <p className="kh-muted" style={{fontSize:".78rem", marginBottom:8}}>
                      تشمل: {(bd.items||[]).map(it=>it.name).join("، ")}
                    </p>
                    <div className="kh-price-row">
                      <div>
                        <div className="kh-price">{egp(bd.price)} <small>ج.م</small></div>
                        {compTotal>bd.price && <div className="kh-price-old">{egp(compTotal)} ج.م</div>}
                      </div>
                      <button className="kh-icon-btn kh-icon-btn-fill" onClick={()=>addToCart("bundle",bd.id)} aria-label="أضف الباقة للسلة"><ShoppingCart size={16}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section id="products-section" className="kh-wrap kh-section">
        <div className="kh-section-head">
          <h2><Leaf size={20} style={{verticalAlign:"-3px", color:"var(--olive)"}}/> الأكثر مبيعاً</h2>
          <button className="kh-btn kh-btn-ghost" style={{padding:"9px 16px", fontSize:".82rem"}} onClick={()=>setFiltersOpen(v=>!v)}>
            <SlidersHorizontal size={14}/> فلاتر وترتيب
          </button>
        </div>

        {filtersOpen && (
          <div className="kh-filters-bar">
            <label>ترتيب حسب
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="discount">الأكثر خصمًا</option>
              </select>
            </label>
            <label>من (ج.م)<input type="number" value={priceMin} onChange={e=>setPriceMin(e.target.value)} placeholder="0"/></label>
            <label>إلى (ج.م)<input type="number" value={priceMax} onChange={e=>setPriceMax(e.target.value)} placeholder="بدون حد"/></label>
            <label>التقييم
              <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))}>
                <option value={0}>الكل</option>
                <option value={3}>3 نجوم فأكثر</option>
                <option value={4}>4 نجوم فأكثر</option>
                <option value={5}>5 نجوم فقط</option>
              </select>
            </label>
            <label className="kh-filter-checkbox">
              <input type="checkbox" checked={onlyDiscounted} onChange={e=>setOnlyDiscounted(e.target.checked)}/>
              عليها خصم فقط
            </label>
          </div>
        )}

        <div className="kh-chips">
          <button className={"kh-chip"+(activeCategory==="الكل"?" active":"")} onClick={()=>setActiveCategory("الكل")}>الكل</button>
          {categories.map(c=>(
            <button key={c.id} className={"kh-chip"+(activeCategory===c.name?" active":"")} onClick={()=>setActiveCategory(c.name)}>{c.name}</button>
          ))}
        </div>
        {filteredProducts.length===0 ? (
          <div className="kh-empty">مفيش منتجات مطابقة لهذا البحث/الفلاتر حالياً.</div>
        ) : (
          <div className="kh-prod-grid" style={{marginTop:26}}>
            {filteredProducts.map(p=>(
              <ProductCard key={p.id} product={p} rating={ratings[p.id]} inWishlist={wishlist.includes(p.id)} onToggleWishlist={()=>toggleWishlist(p.id)} onAdd={()=>addToCart("product",p.id)} onOpen={()=>setSelectedProduct(p)}/>
            ))}
          </div>
        )}
      </section>

      <footer className="kh-footer">
        <div className="kh-wrap kh-footer-inner">
          <span>© 2026 {settings.store_name}. جميع الحقوق محفوظة.</span>
          <div style={{display:"flex", gap:18}}>
            <Link href="/track" className="kh-admin-link">تتبع طلبك</Link>
            <Link href="/admin" className="kh-admin-link"><Lock size={13}/> لوحة التحكم</Link>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={()=>setSelectedProduct(null)}
          onAdd={(qty)=>{ addToCart("product",selectedProduct.id,qty); setSelectedProduct(null); }}
          whatsapp={settings.whatsapp} storeName={settings.store_name}
          inWishlist={wishlist.includes(selectedProduct.id)} toggleWishlist={()=>toggleWishlist(selectedProduct.id)}
          allProducts={visibleProducts} onOpenRelated={(p)=>setSelectedProduct(p)} />
      )}

      {cartOpen && (
        <CartDrawer lines={cartLines} subtotal={subtotal} couponDiscount={couponDiscount} total={total}
          shippingCost={settings.shipping_cost} freeShippingMin={settings.free_shipping_min}
          couponInput={couponInput} setCouponInput={setCouponInput} applyCoupon={applyCoupon} couponMsg={couponMsg}
          appliedCoupon={appliedCoupon} updateQty={updateQty} onClose={()=>setCartOpen(false)}
          onCheckout={()=>{ setCartOpen(false); setCheckoutOpen(true); }} />
      )}

      {checkoutOpen && (
        <CheckoutModal onClose={()=>setCheckoutOpen(false)} onSubmit={submitOrder}
          total={total} shippingCost={settings.shipping_cost} freeShippingMin={settings.free_shipping_min}
          savedPhone={phone} myPoints={myPoints} />
      )}

      {successOrder && (
        <OrderSuccessModal order={successOrder} storeName={settings.store_name}
          onClose={()=>setSuccessOrder(null)} onWhatsapp={()=>sendOrderOnWhatsapp(successOrder)} />
      )}

      {accountPromptOpen && (
        <AccountPromptModal onClose={()=>{setAccountPromptOpen(false); setPendingWishlistProduct(null);}} onConfirm={confirmPhone} />
      )}

      {cartCount>0 && !cartOpen && (
        <button className="kh-fab-cart" onClick={()=>setCartOpen(true)} aria-label="السلة">
          <ShoppingCart size={22}/>
          <span className="kh-fab-badge">{cartCount}</span>
        </button>
      )}
    </div>
  );
}

function AccountPromptModal({onClose,onConfirm}){
  const [value,setValue] = useState("");
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:380, textAlign:"center"}}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <div style={{width:56,height:56,borderRadius:"50%",background:"var(--cream-deep)",display:"flex",alignItems:"center",justifyContent:"center",margin:"6px auto 16px",color:"var(--olive-deep)"}}>
          <User size={26}/>
        </div>
        <h3 style={{marginBottom:8}}>حسابي في خِزانة</h3>
        <p className="kh-muted" style={{marginBottom:18}}>أدخل رقم موبايلك عشان نحفظلك المفضلة ونعرض طلباتك</p>
        <div className="kh-form">
          <input value={value} onChange={e=>setValue(e.target.value)} placeholder="01xxxxxxxxx"/>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:14}}
          disabled={value.trim().length<8} onClick={()=>onConfirm(value.trim())}>دخول</button>
      </div>
    </div>
  );
}

function ProductCard({product,rating,inWishlist,onToggleWishlist,onAdd,onOpen,showOffer}){
  const disc = discountPercent(product.price, product.original_price);
  const stock = Number(product.stock ?? 20);
  const available = product.status === "available" && stock > 0;
  const lowStock = available && stock <= Number(product.min_stock ?? 5);
  return (
    <div className={"kh-prod-card"+(available?"":" unavailable")}>
      <div className="kh-prod-media" onClick={onOpen} role="button" tabIndex={0}>
        <ProductImage src={product.image} alt={product.name} className="kh-prod-img"/>
        {product.is_best_seller && <span className="kh-tag kh-tag-sage">الأكثر مبيعاً</span>}
        {product.is_new && !product.is_best_seller && <span className="kh-tag kh-tag-brass">جديد</span>}
        {disc>0 && <span className="kh-tag kh-tag-copper" style={{left:12,right:"auto"}}>خصم {disc}%</span>}
        <button className={"kh-heart"+(inWishlist?" active":"")} onClick={e=>{e.stopPropagation();onToggleWishlist();}} aria-label="مفضلة">
          <Heart size={16} fill={inWishlist?"currentColor":"none"}/>
        </button>
      </div>
      <div className="kh-prod-info">
        <span className="kh-prod-code">{product.code}</span>
        <h4 onClick={onOpen} role="button" tabIndex={0}>{product.name}</h4>
        {rating?.count>0 && (
          <div style={{display:"flex", alignItems:"center", gap:5, marginBottom:6}}>
            <StarsRow rating={rating.avg} size={12}/>
            <span className="kh-muted" style={{fontSize:".72rem"}}>({rating.count})</span>
          </div>
        )}
        {showOffer && product.offer_expiry && <Countdown expiry={product.offer_expiry}/>}
        {!available && <div className="kh-avail out" style={{marginBottom:4}}>نفد من المخزون</div>}
        {lowStock && <div className="kh-avail out" style={{marginBottom:4}}>متبقي {stock} فقط</div>}
        <div className="kh-price-row">
          <div>
            <div className="kh-price">{egp(product.price)} <small>ج.م</small></div>
            {disc>0 && <div className="kh-price-old">{egp(product.original_price)} ج.م</div>}
          </div>
          <button className="kh-icon-btn kh-icon-btn-fill" onClick={onAdd} aria-label="أضف للسلة" disabled={!available}><ShoppingCart size={16}/></button>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({product,onClose,onAdd,whatsapp,storeName,inWishlist,toggleWishlist,allProducts,onOpenRelated}){
  const [qty,setQty] = useState(1);
  const [reviews,setReviews] = useState([]);
  const [reviewsLoading,setReviewsLoading] = useState(true);
  const [reviewForm,setReviewForm] = useState({name:"",rating:5,comment:""});
  const [reviewSubmitted,setReviewSubmitted] = useState(false);
  const disc = discountPercent(product.price, product.original_price);
  const stock = Number(product.stock ?? 20);
  const available = product.status === "available" && stock > 0;
  const lowStock = available && stock <= Number(product.min_stock ?? 5);

  const gallery = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
  const [activeImage,setActiveImage] = useState(gallery[0] || "");
  useEffect(()=>{ setActiveImage((product.image ? [product.image] : []).concat(product.images||[]).filter(Boolean)[0] || ""); },[product.id]);

  const related = (allProducts||[]).filter(p=>p.category===product.category && p.id!==product.id).slice(0,4);

  useEffect(()=>{
    setReviewsLoading(true);
    fetch(`/api/reviews?productId=${product.id}`)
      .then(r=>r.json()).then(d=>setReviews(Array.isArray(d)?d:[]))
      .catch(()=>{}).finally(()=>setReviewsLoading(false));
  },[product.id]);

  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) : 0;

  async function submitReview(e){
    e.preventDefault();
    if(!reviewForm.name.trim()) return;
    try{
      await fetch("/api/reviews", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ productId:product.id, name:reviewForm.name, rating:reviewForm.rating, comment:reviewForm.comment }),
      });
      setReviewSubmitted(true);
    }catch(err){ console.error(err); }
  }

  function orderNow(){
    const msg = `مرحباً، حابب أطلب:\n${product.name} (${product.code}) × ${qty}\nالسعر: ${egp(product.price*qty)} ج.م\nمن ${storeName}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  function shareProduct(){
    const link = typeof window !== "undefined" ? `${window.location.origin}/?product=${product.id}` : "";
    const msg = `شوف المنتج ده في ${storeName}:\n${product.name} — ${egp(product.price)} ج.م\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal kh-detail" onClick={e=>e.stopPropagation()}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <div className="kh-detail-grid">
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
            <h2>{product.name}</h2>
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
              <button className="kh-btn kh-btn-primary" onClick={()=>onAdd(qty)} disabled={!available}>أضف للسلة</button>
              <button className="kh-btn kh-btn-sage" onClick={orderNow}>اطلب عبر واتساب</button>
              <button className={"kh-btn kh-btn-ghost-icon"+(inWishlist?" active":"")} onClick={toggleWishlist} aria-label="مفضلة">
                <Heart size={17} fill={inWishlist?"currentColor":"none"}/>
              </button>
              <button className="kh-btn kh-btn-ghost-icon" onClick={shareProduct} aria-label="مشاركة المنتج">
                <Share2 size={17}/>
              </button>
            </div>
          </div>
        </div>

        {related.length>0 && (
          <div className="kh-reviews-section">
            <h3 style={{fontSize:"1.05rem", marginBottom:14}}>منتجات مشابهة</h3>
            <div className="kh-related-grid">
              {related.map(r=>{
                const rDisc = discountPercent(r.price, r.original_price);
                return (
                  <button key={r.id} className="kh-related-card" onClick={()=>onOpenRelated(r)}>
                    <ProductImage src={r.image} alt={r.name} className="kh-related-img"/>
                    <span className="kh-related-name">{r.name}</span>
                    <span className="kh-related-price">{egp(r.price)} ج.م</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="kh-reviews-section">
          <h3 style={{fontSize:"1.05rem", marginBottom:14}}>آراء العملاء</h3>
          {!reviewsLoading && reviews.length===0 && <p className="kh-muted" style={{marginBottom:14}}>لسه مفيش تقييمات على المنتج ده، كن أول من يقيّمه.</p>}
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
    </div>
  );
}

function CartDrawer({lines,subtotal,couponDiscount,total,shippingCost,freeShippingMin,couponInput,setCouponInput,applyCoupon,couponMsg,appliedCoupon,updateQty,onClose,onCheckout}){
  const qualifiesFreeShipping = Number(freeShippingMin) > 0 && total >= Number(freeShippingMin);
  const effectiveShipping = qualifiesFreeShipping ? 0 : Number(shippingCost || 0);
  const grandTotal = total + effectiveShipping;
  const remainingForFreeShipping = Number(freeShippingMin) > 0 ? Math.max(0, Number(freeShippingMin) - total) : 0;
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-drawer" onClick={e=>e.stopPropagation()}>
        <div className="kh-drawer-head"><h3>سلة المشتريات</h3><button onClick={onClose}><X size={18}/></button></div>
        {lines.length===0 ? <div className="kh-empty">السلة فارغة حالياً.</div> : (
          <div className="kh-cart-lines">
            {lines.map(l=>(
              <div key={l.type+"-"+l.id} className="kh-cart-line">
                <ProductImage src={l.image} alt={l.name} className="kh-cart-img"/>
                <div className="kh-cart-line-info">
                  <h5>{l.name}{l.type==="bundle" && <span className="kh-status" style={{marginRight:6, fontSize:".65rem"}}>باقة</span>}</h5>
                  <span>{egp(l.price)} ج.م</span>
                  <div className="kh-qty-row small">
                    <button onClick={()=>updateQty(l.type,l.id,l.qty-1)}><Minus size={12}/></button>
                    <span>{l.qty}</span>
                    <button onClick={()=>updateQty(l.type,l.id,l.qty+1)}><Plus size={12}/></button>
                  </div>
                </div>
                <button className="kh-trash" onClick={()=>updateQty(l.type,l.id,0)}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}
        {lines.length>0 && (
          <>
            {remainingForFreeShipping>0 && (
              <div className="kh-free-shipping-note">
                <Truck size={14}/> ضيف {egp(remainingForFreeShipping)} ج.م كمان واحصل على شحن مجاني!
              </div>
            )}
            {qualifiesFreeShipping && (
              <div className="kh-free-shipping-note ok">
                <Truck size={14}/> مبروك، طلبك مؤهل للشحن المجاني!
              </div>
            )}
            <div className="kh-coupon-row">
              <input placeholder="كود الخصم" value={couponInput} onChange={e=>setCouponInput(e.target.value)}/>
              <button onClick={applyCoupon}>تطبيق</button>
            </div>
            {couponMsg && <div className={"kh-coupon-msg"+(appliedCoupon?" ok":"")}>{couponMsg}</div>}
            <div className="kh-cart-summary">
              <div><span>الإجمالي الفرعي</span><span>{egp(subtotal)} ج.م</span></div>
              {couponDiscount>0 && <div><span>خصم الكوبون</span><span>-{egp(couponDiscount)} ج.م</span></div>}
              <div><span>الشحن</span><span>{qualifiesFreeShipping ? "مجاني" : `${egp(effectiveShipping)} ج.م`}</span></div>
              <div className="kh-cart-total"><span>الإجمالي</span><span>{egp(grandTotal)} ج.م</span></div>
            </div>
            <button className="kh-btn kh-btn-primary kh-full" onClick={onCheckout}>إتمام الطلب</button>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({onClose,onSubmit,total,shippingCost,freeShippingMin,savedPhone,myPoints}){
  const [form,setForm] = useState({name:"",phone:savedPhone||"",phone2:"",governorate:"",city:"",area:"",address:"",landmark:"",usePoints:false});
  const [submitting,setSubmitting] = useState(false);
  const canSubmit = form.name.trim() && form.phone.trim() && form.governorate && form.city.trim() && form.address.trim();
  const pointsValue = myPoints?.pointValue || 1;
  const pointsAvailable = myPoints?.points || 0;
  const pointsDiscount = form.usePoints ? Math.min(total, pointsAvailable*pointsValue) : 0;
  const qualifiesFreeShipping = Number(freeShippingMin) > 0 && total >= Number(freeShippingMin);
  const effectiveShipping = qualifiesFreeShipping ? 0 : Number(shippingCost || 0);
  const grandTotal = Math.max(0, total-pointsDiscount) + effectiveShipping;

  async function handleSubmit(){
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <h3>بيانات التوصيل</h3>
        <p className="kh-muted">
          المنتجات: {egp(total)} ج.م + شحن {qualifiesFreeShipping ? "مجاني" : `${egp(effectiveShipping)} ج.م`}
          {pointsDiscount>0 && <> - نقاط {egp(pointsDiscount)} ج.م</>}
          {" "}= <strong>{egp(grandTotal)} ج.م</strong> — الدفع عند الاستلام
        </p>
        <div className="kh-form">
          <div className="kh-form-grid">
            <label>الاسم بالكامل<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <label>رقم الموبايل<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="01xxxxxxxxx"/></label>
          </div>
          <label>رقم موبايل احتياطي (اختياري)<input value={form.phone2} onChange={e=>setForm({...form,phone2:e.target.value})} placeholder="01xxxxxxxxx"/></label>
          <div className="kh-form-grid">
            <label>المحافظة
              <select value={form.governorate} onChange={e=>setForm({...form,governorate:e.target.value})}>
                <option value="">اختر المحافظة</option>
                {EGYPT_GOVERNORATES.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>المدينة / المركز<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
          </div>
          <label>المنطقة (اختياري)<input value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></label>
          <label>العنوان بالتفصيل<textarea rows={3} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
          <label>علامة مميزة (اختياري)<input value={form.landmark} onChange={e=>setForm({...form,landmark:e.target.value})} placeholder="بجوار..."/></label>
          {pointsAvailable>0 && (
            <label className="kh-filter-checkbox">
              <input type="checkbox" checked={form.usePoints} onChange={e=>setForm({...form,usePoints:e.target.checked})}/>
              عندك {pointsAvailable} نقطة (تساوي {egp(pointsAvailable*pointsValue)} ج.م) — استخدمها في الطلب ده؟
            </label>
          )}
          <div className="kh-cat-item" style={{cursor:"default"}}>
            <span>طريقة الدفع</span>
            <strong style={{color:"var(--olive-deep)"}}>الدفع عند الاستلام</strong>
          </div>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:14}} disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "جارِ الإرسال..." : "تأكيد الطلب"}
        </button>
      </div>
    </div>
  );
}

function OrderSuccessModal({order,storeName,onClose,onWhatsapp}){
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440, textAlign:"center"}}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <div style={{width:64,height:64,borderRadius:"50%",background:"var(--cream-deep)",display:"flex",alignItems:"center",justifyContent:"center",margin:"8px auto 18px",color:"var(--olive-deep)"}}>
          <Check size={32}/>
        </div>
        <h2 style={{marginBottom:8}}>تم استلام طلبك بنجاح 🎉</h2>
        <p className="kh-muted" style={{marginBottom:4}}>رقم الطلب</p>
        <div style={{fontSize:"1.6rem",fontWeight:700,color:"var(--olive-deep)",marginBottom:16}}>{order.order_number}</div>
        {Number(order.points_earned)>0 && (
          <p className="kh-avail ok" style={{justifyContent:"center", marginBottom:12}}>كسبت {order.points_earned} نقطة من الطلب ده!</p>
        )}
        <p className="kh-muted" style={{marginBottom:22}}>شكرًا لطلبك من {storeName} ❤️<br/>سيتم مراجعة طلبك والتواصل معك لتأكيده.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Link href={`/track?order=${encodeURIComponent(order.order_number)}`} className="kh-btn kh-btn-primary kh-full">تتبع الطلب</Link>
          <button className="kh-btn kh-btn-sage kh-full" onClick={onWhatsapp}>التواصل عبر واتساب</button>
        </div>
      </div>
    </div>
  );
}
