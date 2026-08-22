"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, ImageOff, Star, SlidersHorizontal, ArrowRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { getTranslator } from "../../../lib/i18n";

const SUBCATEGORIES = {
  "أدوات الشرب": ["الكل","أكواب","أطقم أكواب","أطقم شربات","ترامس","دوارق","زجاجات","كاسات","مجات","فناجين قهوة وشاي"],
  "أدوات المائدة": ["الكل","أطباق","أطقم سفرة","أطقم شاي وقهوة","أطقم عشاء","أطقم معالق","بولات","صواني تقديم"],
  "أدوات المطبخ": ["الكل","أطقم توزيع","برطمانات وأطقم توابل","رقايع المطبخ","سكاكين","علب تخزين وحفظ طعام","لانش بوكس"],
  "مستلزمات المنزل": ["الكل","اكسسوارات","أدوات ومستلزمات تنظيف","سبت غسيل","سلة المهملات","منظمات المنزل"],
  "أجهزة كهربائية": ["الكل","أجهزة مطبخ","أجهزة منزلية خفيفة"],
  "أدوات الطهي": ["الكل","أطقم حلل","جريل","صواني فرن","طاسات","طواجن وصواني حرارية","كنك القهوة واللبانات","حلة"],
};

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }
function discountPercent(price, original){
  if(!original || original<=price) return 0;
  return Math.round(((original-price)/original)*100);
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

export default function CategoryPageClient({ categoryName }){
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSubcat, setActiveSubcat] = useState("الكل");
  const [sortBy, setSortBy] = useState("newest");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [phone, setPhone] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("ar");
  const t = getTranslator(lang);
  const cur = lang==="ar" ? "ج.م" : "EGP";
  const subcats = SUBCATEGORIES[categoryName] || ["الكل"];

  useEffect(()=>{
    const savedTheme = localStorage.getItem("kh_theme");
    if(savedTheme==="dark"){ setTheme("dark"); document.documentElement.setAttribute("data-theme","dark"); }
    const savedLang = localStorage.getItem("kh_lang");
    if(savedLang==="en") setLang("en");
    const savedPhone = localStorage.getItem("kh_phone");
    if(savedPhone) setPhone(savedPhone);
    try{
      const savedCart = localStorage.getItem("kh_cart");
      if(savedCart){ const p=JSON.parse(savedCart); if(Array.isArray(p)) setCart(p); }
    }catch(e){}
  },[]);

  useEffect(()=>{
    if(!phone) return;
    fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}`)
      .then(r=>r.json()).then(ids=>setWishlist(Array.isArray(ids)?ids:[]))
      .catch(()=>{});
  },[phone]);

  useEffect(()=>{
    Promise.all([fetch("/api/products"), fetch("/api/reviews/summary")])
      .then(([pRes, rRes])=>Promise.all([pRes.json(), rRes.json()]))
      .then(([prods, rats])=>{
        setProducts((prods||[]).filter(p=>p.category===decodeURIComponent(categoryName) && p.status==="available" && Number(p.stock??1)>0));
        setRatings(rats||{});
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[categoryName]);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2600); }

  function addToCart(productId){
    try{
      const raw = localStorage.getItem("kh_cart");
      let c = raw ? JSON.parse(raw) : [];
      const ex = c.find(x=>x.type==="product" && x.id===productId);
      if(ex) ex.qty+=1; else c.push({type:"product",id:productId,qty:1});
      localStorage.setItem("kh_cart", JSON.stringify(c));
      setCart([...c]);
      showToast("تمت الإضافة للسلة ✓");
    }catch(e){}
  }

  function toggleWishlist(productId){
    if(!phone) return;
    const inList = wishlist.includes(productId);
    setWishlist(prev=>inList?prev.filter(id=>id!==productId):[...prev,productId]);
    if(inList) fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}&productId=${productId}`,{method:"DELETE"}).catch(()=>{});
    else fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,productId})}).catch(()=>{});
  }

  function toggleTheme(){
    const next = theme==="dark"?"light":"dark";
    setTheme(next);
    localStorage.setItem("kh_theme",next);
    document.documentElement.setAttribute("data-theme",next);
  }
  function toggleLang(){
    const next = lang==="ar"?"en":"ar";
    setLang(next);
    localStorage.setItem("kh_lang",next);
    document.documentElement.setAttribute("lang",next);
    document.documentElement.setAttribute("dir",next==="ar"?"rtl":"ltr");
  }

  const cartCount = cart.reduce((s,c)=>s+c.qty,0);

  let filtered = activeSubcat==="الكل" ? products : products.filter(p=>p.subcategory===activeSubcat || p.name.includes(activeSubcat));
  if(sortBy==="price_asc") filtered=[...filtered].sort((a,b)=>a.price-b.price);
  else if(sortBy==="price_desc") filtered=[...filtered].sort((a,b)=>b.price-a.price);
  else if(sortBy==="discount") filtered=[...filtered].sort((a,b)=>discountPercent(b.price,b.original_price)-discountPercent(a.price,a.original_price));
  else filtered=[...filtered].sort((a,b)=>b.id-a.id);

  return (
    <div className="kh-root">
      {toast && <div className="kh-toast">{toast}</div>}

      <div className="kh-topbar">
        <div className="kh-topbar-inner">
          <span className="kh-topbar-item">🚚 توصيل لجميع محافظات مصر</span>
          <span className="kh-topbar-item">🛡️ ضمان جودة على جميع المنتجات</span>
        </div>
      </div>

      <header className="kh-header">
        <div className="kh-wrap kh-header-inner">
          <Link href="/" className="kh-logo-wrap">
            <div className="kh-logo-text">
              <h1>خِزانة</h1>
              <div className="kh-logo-tagline">كل أدوات بيتك في مكان واحد</div>
            </div>
          </Link>
          <div style={{display:"flex",alignItems:"center",gap:10,marginRight:"auto"}}>
            <button className="kh-toggle-btn" onClick={toggleTheme} aria-label="theme">
              {theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}
            </button>
            <button className="kh-lang-btn" onClick={toggleLang}>{lang==="ar"?"EN":"AR"}</button>
            <Link href="/" className="kh-action-btn"><ArrowRight size={18}/> الرجوع للمتجر</Link>
            <Link href="/account?tab=wishlist" className="kh-action-btn" style={{position:"relative"}}>
              <Heart size={19}/>
              {wishlist.length>0 && <span className="kh-badge">{wishlist.length}</span>}
            </Link>
            <Link href="/" className="kh-action-btn" style={{position:"relative"}}>
              <ShoppingCart size={19}/>
              {cartCount>0 && <span className="kh-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className="kh-category-hero">
        <div className="kh-wrap">
          <h1>{categoryName}</h1>
          <p>{loading ? "" : `${filtered.length} منتج متاح`}</p>
          {subcats.length > 1 && (
            <div className="kh-subcats">
              {subcats.map(sub=>(
                <button key={sub} className={"kh-subcat-chip"+(activeSubcat===sub?" active":"")} onClick={()=>setActiveSubcat(sub)}>
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="kh-wrap kh-section">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,justifyContent:"flex-end"}}>
          <SlidersHorizontal size={15} style={{color:"var(--ink-soft)"}}/>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid var(--cream-deep)",background:"var(--white)",fontSize:".85rem",color:"var(--ink)"}}>
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
            <option value="discount">الأكثر خصمًا</option>
          </select>
        </div>

        {loading ? (
          <div className="kh-loading">جارٍ التحميل...</div>
        ) : filtered.length===0 ? (
          <div className="kh-empty">لا توجد منتجات في هذا القسم حالياً</div>
        ) : (
          <div className="kh-prod-grid">
            {filtered.map(p=>{
              const disc = discountPercent(p.price, p.original_price);
              const rating = ratings[p.id];
              const inWl = wishlist.includes(p.id);
              return (
                <div key={p.id} className="kh-prod-card">
                  <Link href={`/product/${p.id}`} className="kh-prod-media" style={{display:"block"}}>
                    <ProductImage src={p.image} alt={p.name} className="kh-prod-img"/>
                    {p.is_best_seller && <span className="kh-tag kh-tag-sage">الأكثر مبيعاً</span>}
                    {p.is_new && !p.is_best_seller && <span className="kh-tag kh-tag-brass">جديد</span>}
                    {disc>0 && <span className="kh-tag kh-tag-copper" style={{left:12,right:"auto"}}>خصم {disc}%</span>}
                    <button className={"kh-heart"+(inWl?" active":"")} onClick={e=>{e.preventDefault();e.stopPropagation();toggleWishlist(p.id);}}>
                      <Heart size={16} fill={inWl?"currentColor":"none"}/>
                    </button>
                  </Link>
                  <div className="kh-prod-info">
                    <span className="kh-prod-code">{p.code}</span>
                    <Link href={`/product/${p.id}`}><h4>{p.name}</h4></Link>
                    {rating?.count>0 && (
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                        <StarsRow rating={rating.avg} size={12}/>
                        <span className="kh-muted" style={{fontSize:".72rem"}}>({rating.count})</span>
                      </div>
                    )}
                    <div className="kh-price-row">
                      <div>
                        <div className="kh-price">{egp(p.price)} <small>{cur}</small></div>
                        {disc>0 && <div className="kh-price-old">{egp(p.original_price)} {cur}</div>}
                      </div>
                      <button className="kh-icon-btn kh-icon-btn-fill" onClick={()=>addToCart(p.id)}>
                        <ShoppingCart size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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