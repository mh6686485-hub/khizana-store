"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LogOut, Package, LayoutGrid, Ticket, Tag, Settings as SettingsIcon, X, Upload, ImageOff } from "lucide-react";

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function ProductImage({src,alt,className}){
  if(!src) return <div className={className+" kh-img-placeholder"}><ImageOff size={20}/></div>;
  return <img src={src} alt={alt} className={className} style={{objectFit:"cover"}}/>;
}

export default function AdminPage(){
  const [authed,setAuthed] = useState(false);
  const [checking,setChecking] = useState(true);
  const [pw,setPw] = useState("");
  const [error,setError] = useState("");
  const [tab,setTab] = useState("products");
  const [toast,setToast] = useState("");

  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [coupons,setCoupons] = useState([]);
  const [orders,setOrders] = useState([]);
  const [settings,setSettings] = useState({store_name:"",whatsapp:"",admin_password:""});

  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing] = useState(null);
  const [newCategoryName,setNewCategoryName] = useState("");
  const [couponForm,setCouponForm] = useState({code:"",discountPercent:10,minOrder:0,expiry:"",active:true});

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2600); }

  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch("/api/admin-auth");
        const j = await res.json();
        setAuthed(j.authed);
        if(j.authed) loadAll();
      }catch(e){}
      setChecking(false);
    })();
  },[]);

  async function loadAll(){
    const [p,c,cp,o,s] = await Promise.all([
      fetch("/api/products").then(r=>r.json()),
      fetch("/api/categories").then(r=>r.json()),
      fetch("/api/coupons").then(r=>r.json()),
      fetch("/api/orders").then(r=>r.json()),
      fetch("/api/settings").then(r=>r.json()),
    ]);
    setProducts(p); setCategories(c); setCoupons(cp); setOrders(o); setSettings(s);
  }

  async function login(e){
    e.preventDefault();
    const res = await fetch("/api/admin-auth", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password:pw}) });
    if(res.ok){ setAuthed(true); loadAll(); } else { setError("كلمة المرور غير صحيحة"); }
  }
  async function logout(){
    await fetch("/api/admin-auth", { method:"DELETE" });
    setAuthed(false);
  }

  function openNewProduct(){
    setEditing({ id:null, code:"", name:"", category: categories[0]?.name || "", price:"", originalPrice:"", description:"", specs:"", image:"", status:"available", isNew:false, isBestSeller:false, offerExpiry:"" });
    setShowForm(true);
  }
  function openEditProduct(p){
    setEditing({
      id:p.id, code:p.code, name:p.name, category:p.category, price:p.price, originalPrice:p.original_price,
      description:p.description, specs:p.specs, image:p.image, status:p.status, isNew:p.is_new, isBestSeller:p.is_best_seller,
      offerExpiry: p.offer_expiry ? String(p.offer_expiry).slice(0,16) : "",
    });
    setShowForm(true);
  }
  async function saveProduct(){
    if(!editing.code.trim() || !editing.name.trim() || !editing.price){ showToast("أكمل الكود والاسم والسعر"); return; }
    const method = editing.id ? "PUT" : "POST";
    const url = editing.id ? `/api/products/${editing.id}` : "/api/products";
    const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(editing) });
    if(res.ok){ await loadAll(); setShowForm(false); setEditing(null); showToast("تم حفظ المنتج"); }
    else showToast("حدث خطأ أثناء الحفظ");
  }
  async function deleteProduct(id){
    await fetch(`/api/products/${id}`, { method:"DELETE" });
    await loadAll(); showToast("تم حذف المنتج");
  }

  async function addCategory(){
    const name = newCategoryName.trim();
    if(!name) return;
    await fetch("/api/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name}) });
    setNewCategoryName(""); await loadAll();
  }
  async function deleteCategory(id){ await fetch(`/api/categories/${id}`, {method:"DELETE"}); await loadAll(); }

  async function addCoupon(){
    if(!couponForm.code.trim()){ showToast("أدخل كود الكوبون"); return; }
    await fetch("/api/coupons", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(couponForm) });
    setCouponForm({code:"",discountPercent:10,minOrder:0,expiry:"",active:true});
    await loadAll(); showToast("تم إضافة الكوبون");
  }
  async function toggleCouponActive(c){
    await fetch(`/api/coupons/${c.code}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:!c.active}) });
    await loadAll();
  }
  async function deleteCoupon(code){ await fetch(`/api/coupons/${code}`, {method:"DELETE"}); await loadAll(); }

  async function saveSettings(){
    await fetch("/api/settings", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({storeName:settings.store_name, whatsapp:settings.whatsapp, adminPassword:settings.admin_password}) });
    showToast("تم حفظ الإعدادات");
  }

  if(checking) return <div className="kh-root kh-loading">جارِ التحقق...</div>;

  if(!authed){
    return (
      <div className="kh-root">
        <div className="kh-admin-login">
          <form className="kh-modal" onSubmit={login} style={{maxWidth:360}}>
            <div className="kh-logo" style={{marginBottom:18}}><span className="kh-dot"/>خِزانة ADMIN</div>
            <label>كلمة المرور<input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoFocus/></label>
            {error && <div className="kh-coupon-msg">{error}</div>}
            <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:14}} type="submit">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    {id:"products",label:"المنتجات",icon:Package},
    {id:"categories",label:"الأقسام",icon:LayoutGrid},
    {id:"coupons",label:"الكوبونات",icon:Ticket},
    {id:"orders",label:"الطلبات",icon:Tag},
    {id:"settings",label:"الإعدادات",icon:SettingsIcon},
  ];

  return (
    <div className="kh-root">
      {toast && <div className="kh-toast">{toast}</div>}
      <div className="kh-admin">
        <aside className="kh-admin-sidebar">
          <div className="kh-logo" style={{marginBottom:28}}><span className="kh-dot"/>خِزانة</div>
          <nav>
            {tabs.map(t=>(
              <button key={t.id} className={"kh-admin-nav-item"+(tab===t.id?" active":"")} onClick={()=>setTab(t.id)}>
                <t.icon size={16}/> {t.label}
              </button>
            ))}
          </nav>
          <button className="kh-admin-nav-item exit" onClick={logout}><LogOut size={16}/> خروج</button>
        </aside>
        <main className="kh-admin-main">
          <div className="kh-admin-topbar"><h2>{tabs.find(t=>t.id===tab)?.label}</h2></div>

          {tab==="products" && (
            <div>
              <button className="kh-btn kh-btn-primary" onClick={openNewProduct} style={{marginBottom:18}}><Plus size={15}/> إضافة منتج</button>
              <div className="kh-table-wrap">
                <table className="kh-table">
                  <thead><tr><th>الصورة</th><th>الكود</th><th>الاسم</th><th>القسم</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id}>
                        <td><ProductImage src={p.image} alt={p.name} className="kh-table-img"/></td>
                        <td>{p.code}</td><td>{p.name}</td><td>{p.category}</td>
                        <td>{egp(p.price)} ج.م</td>
                        <td><span className={"kh-status"+(p.status==="available"?" ok":"")}>{p.status==="available"?"متاح":"غير متاح"}</span></td>
                        <td className="kh-table-actions">
                          <button onClick={()=>openEditProduct(p)}><Pencil size={15}/></button>
                          <button onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="categories" && (
            <div>
              <div className="kh-coupon-row" style={{maxWidth:380,marginBottom:22}}>
                <input placeholder="اسم القسم الجديد" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)}/>
                <button onClick={addCategory}>إضافة</button>
              </div>
              <div className="kh-cat-list">
                {categories.map(c=>(
                  <div key={c.id} className="kh-cat-item"><span>{c.name}</span><button onClick={()=>deleteCategory(c.id)}><Trash2 size={15}/></button></div>
                ))}
              </div>
            </div>
          )}

          {tab==="coupons" && (
            <div>
              <div className="kh-form kh-form-grid" style={{maxWidth:640,marginBottom:26}}>
                <label>الكود<input value={couponForm.code} onChange={e=>setCouponForm({...couponForm,code:e.target.value})} placeholder="KH15"/></label>
                <label>نسبة الخصم %<input type="number" value={couponForm.discountPercent} onChange={e=>setCouponForm({...couponForm,discountPercent:e.target.value})}/></label>
                <label>الحد الأدنى للطلب<input type="number" value={couponForm.minOrder} onChange={e=>setCouponForm({...couponForm,minOrder:e.target.value})}/></label>
                <label>تاريخ الانتهاء<input type="date" value={couponForm.expiry} onChange={e=>setCouponForm({...couponForm,expiry:e.target.value})}/></label>
                <button className="kh-btn kh-btn-primary kh-span-2" onClick={addCoupon}><Plus size={15}/> إضافة كوبون</button>
              </div>
              <div className="kh-table-wrap">
                <table className="kh-table">
                  <thead><tr><th>الكود</th><th>الخصم</th><th>الحد الأدنى</th><th>الانتهاء</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {coupons.map(c=>(
                      <tr key={c.code}>
                        <td>{c.code}</td><td>{c.discount_percent}%</td><td>{egp(c.min_order)} ج.م</td>
                        <td>{c.expiry ? String(c.expiry).slice(0,10) : "—"}</td>
                        <td><button className={"kh-status"+(c.active?" ok":"")} onClick={()=>toggleCouponActive(c)}>{c.active?"مفعّل":"متوقف"}</button></td>
                        <td className="kh-table-actions"><button onClick={()=>deleteCoupon(c.code)}><Trash2 size={15}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="orders" && (
            orders.length===0 ? <div className="kh-empty">لسه معملتش أي طلبات.</div> : (
              <div className="kh-orders">
                {orders.map(o=>(
                  <div key={o.id} className="kh-order-card">
                    <div className="kh-order-head"><strong>{o.id}</strong><span>{new Date(o.created_at).toLocaleString("ar-EG")}</span><span className="kh-status ok">{o.status}</span></div>
                    <div className="kh-order-customer">{o.customer?.name} — {o.customer?.phone} — {o.customer?.address}</div>
                    <ul>{(o.items||[]).map((it,i)=><li key={i}>{it.name} × {it.qty} — {egp(it.price*it.qty)} ج.م</li>)}</ul>
                    <div className="kh-order-total">الإجمالي: {egp(o.total)} ج.م {o.coupon_code && `(كوبون ${o.coupon_code})`}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab==="settings" && (
            <div className="kh-form" style={{maxWidth:420}}>
              <label>اسم المتجر<input value={settings.store_name||""} onChange={e=>setSettings({...settings,store_name:e.target.value})}/></label>
              <label>رقم واتساب (بالصيغة الدولية بدون +)<input value={settings.whatsapp||""} onChange={e=>setSettings({...settings,whatsapp:e.target.value})} placeholder="201000000000"/></label>
              <label>كلمة مرور لوحة التحكم<input value={settings.admin_password||""} onChange={e=>setSettings({...settings,admin_password:e.target.value})}/></label>
              <button className="kh-btn kh-btn-primary" onClick={saveSettings}>حفظ الإعدادات</button>
            </div>
          )}
        </main>
      </div>

      {showForm && editing && (
        <ProductFormModal product={editing} setProduct={setEditing} categories={categories}
          onCancel={()=>{setShowForm(false);setEditing(null);}} onSave={saveProduct}/>
      )}
    </div>
  );
}

function ProductFormModal({product,setProduct,categories,onCancel,onSave}){
  const [imgMode,setImgMode] = useState(product.image && product.image.startsWith("data:") ? "upload" : "url");
  async function handleFile(e){
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 700*1024) alert("يفضّل استخدام صورة أصغر من 700 كيلوبايت");
    const b64 = await fileToBase64(file);
    setProduct({...product, image:b64});
  }
  return (
    <div className="kh-overlay" onClick={onCancel}>
      <div className="kh-modal kh-product-form" onClick={e=>e.stopPropagation()}>
        <button className="kh-close" onClick={onCancel}><X size={18}/></button>
        <h3>{product.id ? "تعديل منتج" : "إضافة منتج"}</h3>
        <div className="kh-form kh-form-grid">
          <label>كود المنتج<input value={product.code} onChange={e=>setProduct({...product,code:e.target.value})} placeholder="KH-KIT-002"/></label>
          <label>اسم المنتج<input value={product.name} onChange={e=>setProduct({...product,name:e.target.value})}/></label>
          <label>القسم
            <select value={product.category} onChange={e=>setProduct({...product,category:e.target.value})}>
              {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label>حالة المنتج
            <select value={product.status} onChange={e=>setProduct({...product,status:e.target.value})}>
              <option value="available">متاح</option><option value="unavailable">غير متاح</option>
            </select>
          </label>
          <label>السعر<input type="number" value={product.price} onChange={e=>setProduct({...product,price:e.target.value})}/></label>
          <label>السعر قبل الخصم<input type="number" value={product.originalPrice} onChange={e=>setProduct({...product,originalPrice:e.target.value})}/></label>
          <label className="kh-span-2">وصف المنتج<textarea rows={2} value={product.description} onChange={e=>setProduct({...product,description:e.target.value})}/></label>
          <label className="kh-span-2">المواصفات (سطر لكل مواصفة)<textarea rows={3} value={product.specs} onChange={e=>setProduct({...product,specs:e.target.value})}/></label>
          <div className="kh-span-2">
            <div className="kh-img-toggle">
              <button type="button" className={imgMode==="url"?"active":""} onClick={()=>setImgMode("url")}>رابط صورة</button>
              <button type="button" className={imgMode==="upload"?"active":""} onClick={()=>setImgMode("upload")}>رفع صورة</button>
            </div>
            {imgMode==="url" ? (
              <input placeholder="https://..." value={product.image && product.image.startsWith("data:") ? "" : product.image} onChange={e=>setProduct({...product,image:e.target.value})}/>
            ) : (
              <label className="kh-upload"><Upload size={16}/> اختر صورة<input type="file" accept="image/*" onChange={handleFile} hidden/></label>
            )}
            {product.image && <img src={product.image} alt="معاينة" className="kh-img-preview"/>}
          </div>
          <label>عرض ينتهي في (اختياري)<input type="datetime-local" value={product.offerExpiry} onChange={e=>setProduct({...product,offerExpiry:e.target.value})}/></label>
          <div className="kh-checkboxes">
            <label><input type="checkbox" checked={product.isNew} onChange={e=>setProduct({...product,isNew:e.target.checked})}/> منتج جديد</label>
            <label><input type="checkbox" checked={product.isBestSeller} onChange={e=>setProduct({...product,isBestSeller:e.target.checked})}/> الأكثر مبيعاً</label>
          </div>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:16}} onClick={onSave}>💾 حفظ المنتج</button>
      </div>
    </div>
  );
}
