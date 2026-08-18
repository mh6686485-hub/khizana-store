"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, Search, X, Plus, Minus, Trash2, Clock, Check, ImageOff, Lock, Truck, ShieldCheck, Headphones, Wallet, Leaf } from "lucide-react";
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

const NAV_CATS_EXTRA = ["عروض خِزانة"];

export default function StorePage(){
  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [coupons,setCoupons] = useState([]);
  const [settings,setSettings] = useState({store_name:"خِزانة", whatsapp:"201000000000", shipping_cost:60});
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [activeCategory,setActiveCategory] = useState("الكل");
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

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2600); }

  useEffect(()=>{
    (async()=>{
      try{
        const [pRes,cRes,cpRes,sRes] = await Promise.all([
          fetch("/api/products"), fetch("/api/categories"), fetch("/api/coupons"), fetch("/api/settings"),
        ]);
        setProducts(await pRes.json());
        setCategories(await cRes.json());
        setCoupons(await cpRes.json());
        setSettings(await sRes.json());
      }catch(e){ console.error(e); }
      setLoading(false);
    })();
  },[]);

  const offerProducts = products.filter(p=>p.offer_expiry && remainingTime(p.offer_expiry));
  const filteredProducts = products.filter(p=>{
    const matchCat = activeCategory==="الكل" || p.category===activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const cartLines = cart.map(c=>{
    const p = products.find(pp=>pp.id===c.productId);
    return p ? {...c, product:p} : null;
  }).filter(Boolean);
  const subtotal = cartLines.reduce((s,l)=>s+Number(l.product.price)*l.qty,0);
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.discount_type === "fixed"
        ? Math.min(Number(appliedCoupon.discount_percent), subtotal)
        : Math.round(subtotal*appliedCoupon.discount_percent/100))
    : 0;
  const total = Math.max(0, subtotal-couponDiscount);
  const cartCount = cart.reduce((s,c)=>s+c.qty,0);
  const wishlistCount = wishlist.length;

  function addToCart(productId, qty=1){
    setCart(prev=>{
      const existing = prev.find(c=>c.productId===productId);
      if(existing) return prev.map(c=>c.productId===productId?{...c,qty:c.qty+qty}:c);
      return [...prev,{productId,qty}];
    });
    showToast("تمت الإضافة للسلة");
  }
  function updateQty(productId, qty){
    if(qty<=0){ setCart(prev=>prev.filter(c=>c.productId!==productId)); return; }
    setCart(prev=>prev.map(c=>c.productId===productId?{...c,qty}:c));
  }
  function toggleWishlist(productId){
    setWishlist(prev=>prev.includes(productId)?prev.filter(id=>id!==productId):[...prev,productId]);
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
    const items = cartLines.map(l=>({productId:l.product.id, code:l.product.code, name:l.product.name, price:l.product.price, qty:l.qty}));
    const customer = { name:form.name, phone:form.phone, phone2:form.phone2, address:form.address };
    const payload = {
      items, subtotal, discount:couponDiscount, couponCode: appliedCoupon?appliedCoupon.code:null, total, customer,
      governorate: form.governorate, city: form.city, area: form.area, landmark: form.landmark,
    };
    try{
      const res = await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const order = await res.json();
      setCart([]); setAppliedCoupon(null); setCouponInput(""); setCheckoutOpen(false); setCartOpen(false);
      setSuccessOrder(order);
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
            <Link href="/admin" className="kh-action-btn">
              <Lock size={19}/> الإدارة
            </Link>
            <button className="kh-action-btn" onClick={()=>{}} aria-label="المفضلة">
              <span style={{position:"relative"}}>
                <Heart size={19}/>
                {wishlistCount>0 && <span className="kh-badge">{wishlistCount}</span>}
              </span>
              المفضلة
            </button>
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
              <ProductCard key={p.id} product={p} inWishlist={wishlist.includes(p.id)} onToggleWishlist={()=>toggleWishlist(p.id)} onAdd={()=>addToCart(p.id)} onOpen={()=>setSelectedProduct(p)} showOffer/>
            ))}
          </div>
        </section>
      )}

      <section id="products-section" className="kh-wrap kh-section">
        <div className="kh-section-head">
          <h2><Leaf size={20} style={{verticalAlign:"-3px", color:"var(--olive)"}}/> الأكثر مبيعاً</h2>
        </div>
        <div className="kh-chips">
          <button className={"kh-chip"+(activeCategory==="الكل"?" active":"")} onClick={()=>setActiveCategory("الكل")}>الكل</button>
          {categories.map(c=>(
            <button key={c.id} className={"kh-chip"+(activeCategory===c.name?" active":"")} onClick={()=>setActiveCategory(c.name)}>{c.name}</button>
          ))}
        </div>
        {filteredProducts.length===0 ? (
          <div className="kh-empty">مفيش منتجات مطابقة للبحث حالياً.</div>
        ) : (
          <div className="kh-prod-grid" style={{marginTop:26}}>
            {filteredProducts.map(p=>(
              <ProductCard key={p.id} product={p} inWishlist={wishlist.includes(p.id)} onToggleWishlist={()=>toggleWishlist(p.id)} onAdd={()=>addToCart(p.id)} onOpen={()=>setSelectedProduct(p)}/>
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
          onAdd={(qty)=>{ addToCart(selectedProduct.id, qty); setSelectedProduct(null); }}
          whatsapp={settings.whatsapp} storeName={settings.store_name}
          inWishlist={wishlist.includes(selectedProduct.id)} toggleWishlist={()=>toggleWishlist(selectedProduct.id)} />
      )}

      {cartOpen && (
        <CartDrawer lines={cartLines} subtotal={subtotal} couponDiscount={couponDiscount} total={total}
          shippingCost={settings.shipping_cost}
          couponInput={couponInput} setCouponInput={setCouponInput} applyCoupon={applyCoupon} couponMsg={couponMsg}
          appliedCoupon={appliedCoupon} updateQty={updateQty} onClose={()=>setCartOpen(false)}
          onCheckout={()=>{ setCartOpen(false); setCheckoutOpen(true); }} />
      )}

      {checkoutOpen && (
        <CheckoutModal onClose={()=>setCheckoutOpen(false)} onSubmit={submitOrder}
          total={total} shippingCost={settings.shipping_cost} />
      )}

      {successOrder && (
        <OrderSuccessModal order={successOrder} storeName={settings.store_name}
          onClose={()=>setSuccessOrder(null)} onWhatsapp={()=>sendOrderOnWhatsapp(successOrder)} />
      )}
    </div>
  );
}

function ProductCard({product,inWishlist,onToggleWishlist,onAdd,onOpen,showOffer}){
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

function ProductDetail({product,onClose,onAdd,whatsapp,storeName,inWishlist,toggleWishlist}){
  const [qty,setQty] = useState(1);
  const disc = discountPercent(product.price, product.original_price);
  const stock = Number(product.stock ?? 20);
  const available = product.status === "available" && stock > 0;
  const lowStock = available && stock <= Number(product.min_stock ?? 5);
  function orderNow(){
    const msg = `مرحباً، حابب أطلب:\n${product.name} (${product.code}) × ${qty}\nالسعر: ${egp(product.price*qty)} ج.م\nمن ${storeName}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal kh-detail" onClick={e=>e.stopPropagation()}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <div className="kh-detail-grid">
          <ProductImage src={product.image} alt={product.name} className="kh-detail-img"/>
          <div>
            <span className="kh-prod-code">{product.code}</span>
            <h2>{product.name}</h2>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({lines,subtotal,couponDiscount,total,shippingCost,couponInput,setCouponInput,applyCoupon,couponMsg,appliedCoupon,updateQty,onClose,onCheckout}){
  const grandTotal = total + Number(shippingCost || 0);
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-drawer" onClick={e=>e.stopPropagation()}>
        <div className="kh-drawer-head"><h3>سلة المشتريات</h3><button onClick={onClose}><X size={18}/></button></div>
        {lines.length===0 ? <div className="kh-empty">السلة فارغة حالياً.</div> : (
          <div className="kh-cart-lines">
            {lines.map(l=>(
              <div key={l.productId} className="kh-cart-line">
                <ProductImage src={l.product.image} alt={l.product.name} className="kh-cart-img"/>
                <div className="kh-cart-line-info">
                  <h5>{l.product.name}</h5>
                  <span>{egp(l.product.price)} ج.م</span>
                  <div className="kh-qty-row small">
                    <button onClick={()=>updateQty(l.productId,l.qty-1)}><Minus size={12}/></button>
                    <span>{l.qty}</span>
                    <button onClick={()=>updateQty(l.productId,l.qty+1)}><Plus size={12}/></button>
                  </div>
                </div>
                <button className="kh-trash" onClick={()=>updateQty(l.productId,0)}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}
        {lines.length>0 && (
          <>
            <div className="kh-coupon-row">
              <input placeholder="كود الخصم" value={couponInput} onChange={e=>setCouponInput(e.target.value)}/>
              <button onClick={applyCoupon}>تطبيق</button>
            </div>
            {couponMsg && <div className={"kh-coupon-msg"+(appliedCoupon?" ok":"")}>{couponMsg}</div>}
            <div className="kh-cart-summary">
              <div><span>الإجمالي الفرعي</span><span>{egp(subtotal)} ج.م</span></div>
              {couponDiscount>0 && <div><span>خصم الكوبون</span><span>-{egp(couponDiscount)} ج.م</span></div>}
              <div><span>الشحن</span><span>{egp(shippingCost)} ج.م</span></div>
              <div className="kh-cart-total"><span>الإجمالي</span><span>{egp(grandTotal)} ج.م</span></div>
            </div>
            <button className="kh-btn kh-btn-primary kh-full" onClick={onCheckout}>إتمام الطلب</button>
          </>
        )}
      </div>
    </div>
  );
}

const EGYPT_GOVERNORATES = [
  "القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","المنوفية",
  "البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء",
  "بني سويف","الفيوم","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر",
  "الوادي الجديد","مطروح",
];

function CheckoutModal({onClose,onSubmit,total,shippingCost}){
  const [form,setForm] = useState({name:"",phone:"",phone2:"",governorate:"",city:"",area:"",address:"",landmark:""});
  const [submitting,setSubmitting] = useState(false);
  const canSubmit = form.name.trim() && form.phone.trim() && form.governorate && form.city.trim() && form.address.trim();
  const grandTotal = total + Number(shippingCost || 0);

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
          المنتجات: {egp(total)} ج.م + شحن {egp(shippingCost)} ج.م = <strong>{egp(grandTotal)} ج.م</strong> — الدفع عند الاستلام
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
        <p className="kh-muted" style={{marginBottom:22}}>شكرًا لطلبك من {storeName} ❤️<br/>سيتم مراجعة طلبك والتواصل معك لتأكيده.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Link href={`/track?order=${encodeURIComponent(order.order_number)}`} className="kh-btn kh-btn-primary kh-full">تتبع الطلب</Link>
          <button className="kh-btn kh-btn-sage kh-full" onClick={onWhatsapp}>التواصل عبر واتساب</button>
        </div>
      </div>
    </div>
  );
}
