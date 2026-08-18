"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, Search, X, Plus, Minus, Trash2, Clock, Check, ImageOff, Lock } from "lucide-react";
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

export default function StorePage(){
  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [coupons,setCoupons] = useState([]);
  const [settings,setSettings] = useState({store_name:"خِزانة", whatsapp:"201000000000"});
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
  const couponDiscount = appliedCoupon ? Math.round(subtotal*appliedCoupon.discount_percent/100) : 0;
  const total = Math.max(0, subtotal-couponDiscount);
  const cartCount = cart.reduce((s,c)=>s+c.qty,0);

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
    if(subtotal < Number(found.min_order)) return setCouponMsg(`الحد الأدنى للطلب ${egp(found.min_order)} ج.م`);
    setAppliedCoupon(found);
    setCouponMsg("تم تطبيق الكوبون بنجاح");
  }

  async function submitOrder(customer){
    const items = cartLines.map(l=>({productId:l.product.id, code:l.product.code, name:l.product.name, price:l.product.price, qty:l.qty}));
    const payload = { items, subtotal, discount:couponDiscount, couponCode: appliedCoupon?appliedCoupon.code:null, total, customer };
    try{
      await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    }catch(e){ console.error(e); }

    const lines = cartLines.map(l=>`• ${l.product.name} × ${l.qty} = ${egp(l.product.price*l.qty)} ج.م`).join("\n");
    const msg = `طلب جديد من ${settings.store_name}\n\n${lines}\n\nالإجمالي الفرعي: ${egp(subtotal)} ج.م` +
      (couponDiscount ? `\nخصم الكوبون (${appliedCoupon.code}): -${egp(couponDiscount)} ج.م` : "") +
      `\nالإجمالي النهائي: ${egp(total)} ج.م\n\nالاسم: ${customer.name}\nالتليفون: ${customer.phone}\nالعنوان: ${customer.address}`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");

    setCart([]); setAppliedCoupon(null); setCouponInput(""); setCheckoutOpen(false); setCartOpen(false);
    showToast("تم إرسال طلبك، هنتواصل معاك على واتساب");
  }

  if(loading) return <div className="kh-root kh-loading">جارِ تحميل {settings.store_name}...</div>;

  return (
    <div className="kh-root">
      {toast && <div className="kh-toast">{toast}</div>}

      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <div className="kh-logo"><span className="kh-dot"/>{settings.store_name}</div>
          <div className="kh-search">
            <Search size={16}/>
            <input placeholder="ابحث عن منتج..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="kh-icon-btn" onClick={()=>setCartOpen(true)} aria-label="السلة">
            <ShoppingCart size={19}/>
            {cartCount>0 && <span className="kh-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <section className="kh-wrap kh-hero">
        <div className="kh-eyebrow">توصيل لجميع محافظات مصر</div>
        <h1>كل حاجة يحتاجها بيتك، مرتّبة في مكان واحد</h1>
        <p className="kh-lead">من المطبخ للتخزين للتنظيف — أدوات منزلك بجودة نضمنها وأسعار تناسب كل بيت.</p>
      </section>

      {offerProducts.length>0 && (
        <section className="kh-wrap kh-section">
          <div className="kh-section-head"><div className="kh-eyebrow">عروض اليوم</div><h2>هتفوتك لو اتأخرت</h2></div>
          <div className="kh-prod-grid">
            {offerProducts.map(p=>(
              <ProductCard key={p.id} product={p} inWishlist={wishlist.includes(p.id)} onToggleWishlist={()=>toggleWishlist(p.id)} onAdd={()=>addToCart(p.id)} onOpen={()=>setSelectedProduct(p)} showOffer/>
            ))}
          </div>
        </section>
      )}

      <section className="kh-wrap kh-section" style={{paddingTop: offerProducts.length?0:undefined}}>
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
          <Link href="/admin" className="kh-admin-link"><Lock size={13}/> لوحة التحكم</Link>
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
          couponInput={couponInput} setCouponInput={setCouponInput} applyCoupon={applyCoupon} couponMsg={couponMsg}
          appliedCoupon={appliedCoupon} updateQty={updateQty} onClose={()=>setCartOpen(false)}
          onCheckout={()=>{ setCartOpen(false); setCheckoutOpen(true); }} />
      )}

      {checkoutOpen && <CheckoutModal onClose={()=>setCheckoutOpen(false)} onSubmit={submitOrder} total={total} />}
    </div>
  );
}

function ProductCard({product,inWishlist,onToggleWishlist,onAdd,onOpen,showOffer}){
  const disc = discountPercent(product.price, product.original_price);
  return (
    <div className="kh-prod-card">
      <div className="kh-prod-media" onClick={onOpen} role="button" tabIndex={0}>
        <ProductImage src={product.image} alt={product.name} className="kh-prod-img"/>
        {product.is_best_seller && <span className="kh-tag kh-tag-sage">الأكثر مبيعاً</span>}
        {product.is_new && !product.is_best_seller && <span className="kh-tag kh-tag-brass">جديد</span>}
        {disc>0 && <span className="kh-tag kh-tag-copper" style={{left:10,right:"auto"}}>خصم {disc}%</span>}
        <button className={"kh-heart"+(inWishlist?" active":"")} onClick={e=>{e.stopPropagation();onToggleWishlist();}} aria-label="مفضلة">
          <Heart size={16} fill={inWishlist?"currentColor":"none"}/>
        </button>
      </div>
      <div className="kh-prod-info">
        <span className="kh-prod-code">{product.code}</span>
        <h4 onClick={onOpen} role="button" tabIndex={0}>{product.name}</h4>
        {showOffer && product.offer_expiry && <Countdown expiry={product.offer_expiry}/>}
        <div className="kh-price-row">
          <div>
            <div className="kh-price">{egp(product.price)} <small>ج.م</small></div>
            {disc>0 && <div className="kh-price-old">{egp(product.original_price)} ج.م</div>}
          </div>
          <button className="kh-icon-btn kh-icon-btn-fill" onClick={onAdd} aria-label="أضف للسلة"><ShoppingCart size={16}/></button>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({product,onClose,onAdd,whatsapp,storeName,inWishlist,toggleWishlist}){
  const [qty,setQty] = useState(1);
  const disc = discountPercent(product.price, product.original_price);
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
              <span className="kh-price" style={{fontSize:"1.5rem"}}>{egp(product.price)} <small>ج.م</small></span>
              {disc>0 && <span className="kh-price-old">{egp(product.original_price)} ج.م</span>}
              {disc>0 && <span className="kh-tag kh-tag-copper" style={{position:"static"}}>خصم {disc}%</span>}
            </div>
            {product.offer_expiry && <Countdown expiry={product.offer_expiry}/>}
            <p className="kh-detail-desc">{product.description}</p>
            {product.specs && (
              <ul className="kh-specs">{product.specs.split("\n").filter(Boolean).map((s,i)=><li key={i}><Check size={14}/> {s}</li>)}</ul>
            )}
            <div className="kh-qty-row">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus size={14}/></button>
              <span>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)}><Plus size={14}/></button>
            </div>
            <div className="kh-detail-actions">
              <button className="kh-btn kh-btn-primary" onClick={()=>onAdd(qty)}>أضف للسلة</button>
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

function CartDrawer({lines,subtotal,couponDiscount,total,couponInput,setCouponInput,applyCoupon,couponMsg,appliedCoupon,updateQty,onClose,onCheckout}){
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
              <div className="kh-cart-total"><span>الإجمالي</span><span>{egp(total)} ج.م</span></div>
            </div>
            <button className="kh-btn kh-btn-primary kh-full" onClick={onCheckout}>إتمام الطلب عبر واتساب</button>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({onClose,onSubmit,total}){
  const [form,setForm] = useState({name:"",phone:"",address:""});
  const canSubmit = form.name.trim() && form.phone.trim() && form.address.trim();
  return (
    <div className="kh-overlay" onClick={onClose}>
      <div className="kh-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <button className="kh-close" onClick={onClose}><X size={18}/></button>
        <h3>بيانات التوصيل</h3>
        <p className="kh-muted">الإجمالي: {egp(total)} ج.م — الدفع عند الاستلام</p>
        <div className="kh-form">
          <label>الاسم الكامل<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>رقم التليفون<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="01xxxxxxxxx"/></label>
          <label>العنوان بالتفصيل<textarea rows={3} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" disabled={!canSubmit} onClick={()=>onSubmit(form)}>إرسال الطلب عبر واتساب</button>
      </div>
    </div>
  );
}
