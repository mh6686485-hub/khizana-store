"use client";
import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Plus, Pencil, Trash2, LogOut, Package, LayoutGrid, Ticket, Tag, Settings as SettingsIcon, X, Upload, ImageOff, LayoutDashboard, Star, Bell, ShoppingBag, DollarSign, Users, Gift, MessageCircle, Package2, Printer, Download, FileText } from "lucide-react";

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

const ORDER_STATUSES = ["جديد", "تم التأكيد", "قيد التجهيز", "تم الشحن", "خرج للتوصيل", "تم التسليم", "تم الإلغاء"];

export default function AdminPage(){
  const [authed,setAuthed] = useState(false);
  const [checking,setChecking] = useState(true);
  const [pw,setPw] = useState("");
  const [error,setError] = useState("");
  const [tab,setTab] = useState("dashboard");
  const [toast,setToast] = useState("");

  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [coupons,setCoupons] = useState([]);
  const [orders,setOrders] = useState([]);
  const [reviews,setReviews] = useState([]);
  const [report,setReport] = useState(null);
  const [bundles,setBundles] = useState([]);
  const [customers,setCustomers] = useState([]);
  const [settings,setSettings] = useState({store_name:"",whatsapp:"",admin_password:"",shipping_cost:60,points_per_egp:0.1,point_value:1,free_shipping_min:0,min_order_amount:0,about_us:"",return_policy:""});

  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing] = useState(null);
  const [newCategoryName,setNewCategoryName] = useState("");
  const [couponForm,setCouponForm] = useState({code:"",discountPercent:10,minOrder:0,expiry:"",active:true,discountType:"percent",maxUses:""});
  const [showBundleForm,setShowBundleForm] = useState(false);
  const [bundleForm,setBundleForm] = useState({id:null,name:"",description:"",image:"",price:"",active:true,items:[]});

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

  const lastNewOrdersRef = useRef(null);
  useEffect(()=>{
    if(!authed) return;
    if(typeof Notification !== "undefined" && Notification.permission === "default"){
      Notification.requestPermission().catch(()=>{});
    }
    const interval = setInterval(async ()=>{
      try{
        const res = await fetch("/api/orders/new-count");
        const data = await res.json();
        const count = data.count || 0;
        if(lastNewOrdersRef.current !== null && count > lastNewOrdersRef.current){
          playNewOrderSound();
          showToast("🔔 وصل طلب جديد!");
          if(typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden){
            new Notification("طلب جديد في خِزانة", { body: "افتح لوحة التحكم لمراجعته" });
          }
          loadAll();
        }
        lastNewOrdersRef.current = count;
      }catch(e){}
    }, 20000);
    return ()=>clearInterval(interval);
  },[authed]);

  function playNewOrderSound(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      [880,1080].forEach((freq,i)=>{
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + i*0.18);
        osc.stop(ctx.currentTime + i*0.18 + 0.16);
      });
    }catch(e){}
  }

  function downloadBackup(){
    const backup = { exportedAt: new Date().toISOString(), products, categories, coupons, orders, reviews, bundles, settings };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `نسخة-احتياطية-خزانة-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function loadAll(){
    const [p,c,cp,o,s,rv,rp,bd,cu] = await Promise.all([
      fetch("/api/products").then(r=>r.json()),
      fetch("/api/categories").then(r=>r.json()),
      fetch("/api/coupons").then(r=>r.json()),
      fetch("/api/orders").then(r=>r.json()),
      fetch("/api/settings").then(r=>r.json()),
      fetch("/api/reviews").then(r=>r.json()),
      fetch("/api/reports").then(r=>r.json()),
      fetch("/api/bundles").then(r=>r.json()),
      fetch("/api/customers").then(r=>r.json()),
    ]);
    setProducts(p); setCategories(c); setCoupons(cp); setOrders(o); setSettings(s);
    setReviews(Array.isArray(rv) ? rv : []);
    setReport(rp);
    setBundles(Array.isArray(bd) ? bd : []);
    setCustomers(Array.isArray(cu) ? cu : []);
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
    setEditing({ id:null, code:"", name:"", category: categories[0]?.name || "", price:"", originalPrice:"", description:"", specs:"", image:"", status:"available", isNew:false, isBestSeller:false, offerExpiry:"", stock:20, minStock:5, images:[] });
    setShowForm(true);
  }
  function openEditProduct(p){
    setEditing({
      id:p.id, code:p.code, name:p.name, category:p.category, price:p.price, originalPrice:p.original_price,
      description:p.description, specs:p.specs, image:p.image, status:p.status, isNew:p.is_new, isBestSeller:p.is_best_seller,
      offerExpiry: p.offer_expiry ? String(p.offer_expiry).slice(0,16) : "",
      stock: p.stock ?? 20, minStock: p.min_stock ?? 5, images: Array.isArray(p.images) ? p.images : [],
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
    setCouponForm({code:"",discountPercent:10,minOrder:0,expiry:"",active:true,discountType:"percent",maxUses:""});
    await loadAll(); showToast("تم إضافة الكوبون");
  }
  async function toggleCouponActive(c){
    await fetch(`/api/coupons/${c.code}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:!c.active}) });
    await loadAll();
  }
  async function deleteCoupon(code){ await fetch(`/api/coupons/${code}`, {method:"DELETE"}); await loadAll(); }

  async function setReviewApproval(id, approved){
    await fetch(`/api/reviews/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({approved}) });
    await loadAll();
  }
  async function deleteReview(id){
    await fetch(`/api/reviews/${id}`, { method:"DELETE" });
    await loadAll();
  }

  async function updateOrderStatus(id, status){
    await fetch(`/api/orders/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
    await loadAll();
    showToast("تم تحديث حالة الطلب");
  }

  const [selectedOrderIds,setSelectedOrderIds] = useState([]);
  const [bulkStatus,setBulkStatus] = useState(ORDER_STATUSES[0]);
  function toggleOrderSelected(id){
    setSelectedOrderIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  }
  async function applyBulkStatus(){
    if(selectedOrderIds.length===0) return;
    await Promise.all(selectedOrderIds.map(id=>
      fetch(`/api/orders/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:bulkStatus}) })
    ));
    setSelectedOrderIds([]);
    await loadAll();
    showToast("تم تحديث حالة الطلبات المحددة");
  }

  function downloadCsv(filename, rows){
    const csv = rows.map(row=>row.map(cell=>{
      const s = String(cell ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function exportProductsCsv(){
    const rows = [["الكود","الاسم","القسم","السعر","المخزون","الحالة"]];
    products.forEach(p=>rows.push([p.code,p.name,p.category,p.price,p.stock,p.status==="available"?"متاح":"غير متاح"]));
    downloadCsv("منتجات-خزانة.csv", rows);
  }
  function exportOrdersCsv(){
    const rows = [["رقم الطلب","التاريخ","العميل","الهاتف","الإجمالي","الحالة"]];
    orders.forEach(o=>rows.push([o.order_number||o.id, new Date(o.created_at).toLocaleDateString("ar-EG"), o.customer?.name, o.customer?.phone, o.total, o.status]));
    downloadCsv("طلبات-خزانة.csv", rows);
  }

  const [importing,setImporting] = useState(false);
  const [importResult,setImportResult] = useState(null);
  async function handleImportFile(e){
    const file = e.target.files[0];
    if(!file) return;
    setImporting(true);
    setImportResult(null);
    try{
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type:"array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval:"" });

      const mapped = rows.map(r=>({
        code: String(r["الكود"] || "").trim(),
        name: String(r["الاسم"] || "").trim(),
        category: String(r["القسم"] || "").trim(),
        price: r["السعر"],
        originalPrice: r["السعر قبل الخصم"],
        description: String(r["الوصف"] || ""),
        specs: String(r["المواصفات"] || ""),
        image: String(r["رابط الصورة"] || ""),
        status: String(r["الحالة"] || "متاح"),
        stock: r["الكمية بالمخزون"],
        minStock: r["حد التنبيه بالنقص"],
        isNew: String(r["منتج جديد"] || "لا"),
        isBestSeller: String(r["الأكثر مبيعاً"] || "لا"),
      })).filter(r=>r.code && r.name);

      const res = await fetch("/api/products/import", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ products: mapped }),
      });
      const data = await res.json();
      setImportResult(data);
      await loadAll();
      showToast("تم الاستيراد بنجاح");
    }catch(err){
      showToast("تعذر قراءة الملف، تأكد إنه بنفس شكل القالب");
    }
    setImporting(false);
    e.target.value = "";
  }

  async function saveSettings(){
    await fetch("/api/settings", {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        storeName:settings.store_name, whatsapp:settings.whatsapp,
        adminPassword:settings.admin_password, shippingCost:settings.shipping_cost,
        pointsPerEgp:settings.points_per_egp, pointValue:settings.point_value, freeShippingMin:settings.free_shipping_min,
        minOrderAmount:settings.min_order_amount, aboutUs:settings.about_us, returnPolicy:settings.return_policy,
      }),
    });
    showToast("تم حفظ الإعدادات");
  }

  function openNewBundle(){
    setBundleForm({id:null,name:"",description:"",image:"",price:"",active:true,items:[]});
    setShowBundleForm(true);
  }
  function openEditBundle(b){
    setBundleForm({
      id:b.id, name:b.name, description:b.description||"", image:b.image||"",
      price:b.price, active:b.active,
      items:(b.items||[]).map(it=>({productId:it.product_id, qty:it.qty})),
    });
    setShowBundleForm(true);
  }
  async function saveBundle(){
    if(!bundleForm.name.trim() || bundleForm.items.length===0){ showToast("أدخل اسم الباقة واختر منتج واحد على الأقل"); return; }
    const method = bundleForm.id ? "PUT" : "POST";
    const url = bundleForm.id ? `/api/bundles/${bundleForm.id}` : "/api/bundles";
    await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(bundleForm) });
    setShowBundleForm(false);
    await loadAll();
    showToast("تم حفظ الباقة");
  }
  async function deleteBundle(id){
    await fetch(`/api/bundles/${id}`, { method:"DELETE" });
    await loadAll();
  }
  function toggleBundleItem(productId){
    setBundleForm(prev=>{
      const exists = prev.items.find(it=>it.productId===productId);
      if(exists) return {...prev, items:prev.items.filter(it=>it.productId!==productId)};
      return {...prev, items:[...prev.items, {productId, qty:1}]};
    });
  }
  function setBundleItemQty(productId, qty){
    setBundleForm(prev=>({...prev, items:prev.items.map(it=>it.productId===productId?{...it,qty:Math.max(1,Number(qty)||1)}:it)}));
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
    {id:"dashboard",label:"لوحة المعلومات",icon:LayoutDashboard},
    {id:"products",label:"المنتجات",icon:Package},
    {id:"bundles",label:"الباقات",icon:Gift},
    {id:"categories",label:"الأقسام",icon:LayoutGrid},
    {id:"coupons",label:"الكوبونات",icon:Ticket},
    {id:"orders",label:"الطلبات",icon:Tag},
    {id:"reviews",label:"التقييمات",icon:Star},
    {id:"customers",label:"متابعة العملاء",icon:Users},
    {id:"pages",label:"صفحات الموقع",icon:FileText},
    {id:"settings",label:"الإعدادات",icon:SettingsIcon},
  ];
  const newOrdersCount = orders.filter(o=>o.status==="جديد").length;

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
                {t.id==="orders" && newOrdersCount>0 && <span className="kh-nav-badge">{newOrdersCount}</span>}
                {t.id==="reviews" && report?.pendingReviews>0 && <span className="kh-nav-badge">{report.pendingReviews}</span>}
              </button>
            ))}
          </nav>
          <button className="kh-admin-nav-item exit" onClick={logout}><LogOut size={16}/> خروج</button>
        </aside>
        <main className="kh-admin-main">
          <div className="kh-admin-topbar">
            <h2>{tabs.find(t=>t.id===tab)?.label}</h2>
            {newOrdersCount>0 && (
              <button className="kh-admin-bell" onClick={()=>setTab("orders")}>
                <Bell size={16}/> {newOrdersCount} طلب جديد
              </button>
            )}
          </div>

          {tab==="dashboard" && (
            <div>
              {!report ? <p className="kh-muted">جارِ تحميل الإحصائيات...</p> : (
                <>
                  <div className="kh-stat-grid">
                    <div className="kh-stat-card">
                      <Tag size={18} color="var(--olive)"/>
                      <div><strong>{report.totalOrders}</strong><span>الطلبات</span></div>
                    </div>
                    <div className="kh-stat-card">
                      <DollarSign size={18} color="var(--olive)"/>
                      <div><strong>{egp(report.totalRevenue)} ج.م</strong><span>المبيعات</span></div>
                    </div>
                    <div className="kh-stat-card">
                      <ShoppingBag size={18} color="var(--olive)"/>
                      <div><strong>{report.totalProducts}</strong><span>المنتجات</span></div>
                    </div>
                    <div className="kh-stat-card">
                      <Users size={18} color="var(--olive)"/>
                      <div><strong>{report.totalCustomers}</strong><span>العملاء</span></div>
                    </div>
                  </div>

                  <div style={{marginTop:24}}>
                    <h3 style={{fontSize:"1rem", marginBottom:4}}>المبيعات آخر 7 أيام</h3>
                    <div className="kh-bar-chart">
                      {report.dailyRevenue?.map(d=>{
                        const max = Math.max(...report.dailyRevenue.map(x=>x.total), 1);
                        return (
                          <div key={d.date} className="kh-bar-chart-col">
                            <span style={{fontSize:".68rem", color:"var(--ink-soft)"}}>{d.total>0 ? egp(d.total) : ""}</span>
                            <div className="kh-bar-chart-bar" style={{height:`${Math.max(4,(d.total/max)*90)}px`}}/>
                            <span className="kh-bar-chart-label">{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginTop:24}}>
                    <div>
                      <h3 style={{fontSize:"1rem", marginBottom:12}}>آخر الطلبات</h3>
                      <div className="kh-table-wrap">
                        <table className="kh-table">
                          <thead><tr><th>الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                          <tbody>
                            {report.recentOrders.map(o=>(
                              <tr key={o.id}>
                                <td>{o.order_number}</td>
                                <td>{o.customer?.name}</td>
                                <td>{egp(o.total)} ج.م</td>
                                <td><span className={"kh-status"+(o.status==="تم التسليم"?" ok":"")}>{o.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 style={{fontSize:"1rem", marginBottom:12}}>الأكثر مبيعاً</h3>
                      <div className="kh-cat-list">
                        {report.topProducts.length===0 && <p className="kh-muted">لسه مفيش بيانات كفاية.</p>}
                        {report.topProducts.map((p,i)=>(
                          <div key={i} className="kh-cat-item"><span>{i+1}. {p.name}</span><strong>{p.qty}</strong></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab==="products" && (
            <div>
              <div style={{display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"center"}}>
                <button className="kh-btn kh-btn-primary" onClick={openNewProduct}><Plus size={15}/> إضافة منتج</button>
                <button className="kh-btn kh-btn-ghost" onClick={exportProductsCsv}><Upload size={15} style={{transform:"rotate(180deg)"}}/> تصدير Excel</button>
                <label className="kh-btn kh-btn-sage" style={{cursor:"pointer"}}>
                  <Upload size={15}/> استيراد من إكسل
                  <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleImportFile}/>
                </label>
                {importing && <span className="kh-muted">جارِ الاستيراد...</span>}
              </div>
              {importResult && (
                <div className={"kh-coupon-msg"+((importResult.errors?.length||0)===0?" ok":"")} style={{marginBottom:16}}>
                  تم استيراد {importResult.added} منتج جديد، وتحديث {importResult.updated} منتج موجود.
                  {importResult.errors?.length>0 && ` (${importResult.errors.length} صف فيه مشكلة)`}
                </div>
              )}
              <div className="kh-table-wrap">
                <table className="kh-table">
                  <thead><tr><th>الصورة</th><th>الكود</th><th>الاسم</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {products.map(p=>{
                      const stock = p.stock ?? 20;
                      const minStock = p.min_stock ?? 5;
                      const stockLabel = stock<=0 ? "نفد" : stock<=minStock ? `منخفض (${stock})` : stock;
                      const stockClass = stock<=0 ? "" : stock<=minStock ? "" : " ok";
                      return (
                        <tr key={p.id}>
                          <td><ProductImage src={p.image} alt={p.name} className="kh-table-img"/></td>
                          <td>{p.code}</td><td>{p.name}</td><td>{p.category}</td>
                          <td>{egp(p.price)} ج.م</td>
                          <td><span className={"kh-status"+stockClass}>{stockLabel}</span></td>
                          <td><span className={"kh-status"+(p.status==="available"?" ok":"")}>{p.status==="available"?"متاح":"غير متاح"}</span></td>
                          <td className="kh-table-actions">
                            <button onClick={()=>openEditProduct(p)}><Pencil size={15}/></button>
                            <button onClick={()=>deleteProduct(p.id)}><Trash2 size={15}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab==="bundles" && (
            <div>
              <button className="kh-btn kh-btn-primary" onClick={openNewBundle} style={{marginBottom:18}}><Plus size={15}/> إضافة باقة</button>
              {bundles.length===0 ? <div className="kh-empty">لسه معملتش أي باقات.</div> : (
                <div className="kh-table-wrap">
                  <table className="kh-table">
                    <thead><tr><th>الاسم</th><th>المنتجات</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>
                      {bundles.map(b=>(
                        <tr key={b.id}>
                          <td>{b.name}</td>
                          <td>{(b.items||[]).map(it=>it.name).join("، ")}</td>
                          <td>{egp(b.price)} ج.م</td>
                          <td><span className={"kh-status"+(b.active?" ok":"")}>{b.active?"مفعّلة":"متوقفة"}</span></td>
                          <td className="kh-table-actions">
                            <button onClick={()=>openEditBundle(b)}><Pencil size={15}/></button>
                            <button onClick={()=>deleteBundle(b.id)}><Trash2 size={15}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <label>نوع الخصم
                  <select value={couponForm.discountType} onChange={e=>setCouponForm({...couponForm,discountType:e.target.value})}>
                    <option value="percent">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </label>
                <label>{couponForm.discountType==="fixed" ? "قيمة الخصم (ج.م)" : "نسبة الخصم %"}<input type="number" value={couponForm.discountPercent} onChange={e=>setCouponForm({...couponForm,discountPercent:e.target.value})}/></label>
                <label>الحد الأدنى للطلب<input type="number" value={couponForm.minOrder} onChange={e=>setCouponForm({...couponForm,minOrder:e.target.value})}/></label>
                <label>تاريخ الانتهاء<input type="date" value={couponForm.expiry} onChange={e=>setCouponForm({...couponForm,expiry:e.target.value})}/></label>
                <label>الحد الأقصى للاستخدام (اختياري)<input type="number" value={couponForm.maxUses} onChange={e=>setCouponForm({...couponForm,maxUses:e.target.value})} placeholder="بدون حد"/></label>
                <button className="kh-btn kh-btn-primary kh-span-2" onClick={addCoupon}><Plus size={15}/> إضافة كوبون</button>
              </div>
              <div className="kh-table-wrap">
                <table className="kh-table">
                  <thead><tr><th>الكود</th><th>الخصم</th><th>الحد الأدنى</th><th>الاستخدام</th><th>الانتهاء</th><th>الحالة</th><th></th></tr></thead>
                  <tbody>
                    {coupons.map(c=>(
                      <tr key={c.code}>
                        <td>{c.code}</td>
                        <td>{c.discount_type==="fixed" ? `${egp(c.discount_percent)} ج.م` : `${c.discount_percent}%`}</td>
                        <td>{egp(c.min_order)} ج.م</td>
                        <td>{c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
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
            <div>
              <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap"}}>
                <button className="kh-btn kh-btn-ghost" onClick={exportOrdersCsv}><Upload size={15} style={{transform:"rotate(180deg)"}}/> تصدير Excel</button>
                {selectedOrderIds.length>0 && (
                  <>
                    <span className="kh-muted">{selectedOrderIds.length} طلب محدد</span>
                    <select value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}
                      style={{padding:"7px 12px", borderRadius:8, border:"1px solid rgba(53,67,49,.2)", fontSize:".82rem"}}>
                      {ORDER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="kh-btn kh-btn-primary" style={{padding:"8px 16px", fontSize:".8rem"}} onClick={applyBulkStatus}>تحديث المحدد</button>
                  </>
                )}
              </div>
              {orders.length===0 ? <div className="kh-empty">لسه معملتش أي طلبات.</div> : (
                <div className="kh-orders">
                  {orders.map(o=>(
                    <div key={o.id} className="kh-order-card">
                      <div className="kh-order-head">
                        <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={()=>toggleOrderSelected(o.id)} style={{width:"auto"}}/>
                        <strong>{o.order_number || o.id}</strong>
                        <span>{new Date(o.created_at).toLocaleString("ar-EG")}</span>
                        <select
                          value={o.status}
                          onChange={e=>updateOrderStatus(o.id, e.target.value)}
                          style={{marginRight:"auto", padding:"5px 10px", borderRadius:999, border:"1px solid rgba(53,67,49,.2)", fontSize:".8rem", fontWeight:700, background:"var(--white)"}}
                        >
                          {ORDER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <a href={`/boss/invoice/${o.id}`} target="_blank" rel="noopener"
                          style={{background:"var(--cream-deep)", width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center"}}
                          aria-label="طباعة الفاتورة">
                          <Printer size={15}/>
                        </a>
                      </div>
                      <div className="kh-order-customer">
                        {o.customer?.name} — {o.customer?.phone}{o.phone2 ? ` / ${o.phone2}` : ""}
                      </div>
                      <div className="kh-order-customer">
                        {o.governorate}{o.city ? " — "+o.city : ""}{o.area ? " — "+o.area : ""} — {o.customer?.address}
                        {o.landmark && ` (${o.landmark})`}
                      </div>
                      <ul>{(o.items||[]).map((it,i)=><li key={i}>{it.name} × {it.qty} — {egp(it.price*it.qty)} ج.م</li>)}</ul>
                      <div className="kh-order-total">
                        الإجمالي: {egp(o.total)} ج.م (شحن {egp(o.shipping_cost)} ج.م) {o.coupon_code && `(كوبون ${o.coupon_code})`} — الدفع عند الاستلام
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab==="reviews" && (
            reviews.length===0 ? <div className="kh-empty">لسه مفيش تقييمات.</div> : (
              <div className="kh-orders">
                {reviews.map(r=>(
                  <div key={r.id} className="kh-order-card">
                    <div className="kh-order-head">
                      <strong>{r.product_name || `منتج #${r.product_id}`}</strong>
                      <span>{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                      <span className={"kh-status"+(r.approved?" ok":"")}>{r.approved ? "منشور" : "بانتظار المراجعة"}</span>
                    </div>
                    <div className="kh-order-customer">
                      {"⭐".repeat(r.rating)} — {r.name}
                    </div>
                    {r.comment && <p style={{fontSize:".85rem", color:"var(--ink-soft)", margin:"6px 0"}}>{r.comment}</p>}
                    <div style={{display:"flex", gap:8, marginTop:10}}>
                      {!r.approved && <button className="kh-btn kh-btn-primary" style={{padding:"7px 16px", fontSize:".8rem"}} onClick={()=>setReviewApproval(r.id,true)}>نشر</button>}
                      {r.approved && <button className="kh-btn kh-btn-ghost" style={{padding:"7px 16px", fontSize:".8rem"}} onClick={()=>setReviewApproval(r.id,false)}>إخفاء</button>}
                      <button className="kh-btn kh-btn-ghost" style={{padding:"7px 16px", fontSize:".8rem", color:"var(--terracotta-deep)"}} onClick={()=>deleteReview(r.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab==="customers" && (
            customers.length===0 ? <div className="kh-empty">لسه مفيش عملاء.</div> : (
              <div>
                <p className="kh-muted" style={{marginBottom:16}}>مرتّبين من الأقدم طلبًا — دول أنسب عملاء تتواصل معاهم دلوقتي.</p>
                <div className="kh-table-wrap">
                  <table className="kh-table">
                    <thead><tr><th>العميل</th><th>الهاتف</th><th>عدد الطلبات</th><th>إجمالي الإنفاق</th><th>آخر طلب</th><th></th></tr></thead>
                    <tbody>
                      {customers.map(c=>{
                        const days = Math.floor((Date.now()-new Date(c.last_order_at).getTime())/86400000);
                        return (
                          <tr key={c.phone}>
                            <td>{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{c.order_count}</td>
                            <td>{egp(c.total_spent)} ج.م</td>
                            <td>{days===0?"النهاردة":`من ${days} يوم`}</td>
                            <td className="kh-table-actions">
                              <a href={`https://wa.me/2${c.phone}`} target="_blank" rel="noopener" style={{background:"var(--cream-deep)", width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center"}}>
                                <MessageCircle size={15}/>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {tab==="pages" && (
            <div className="kh-form" style={{maxWidth:560}}>
              <p className="kh-muted">النصوص دي بتظهر للعملاء في صفحتي "من نحن" و"سياسة الاستبدال" أسفل الموقع.</p>
              <label>نبذة عن المتجر (من نحن)<textarea rows={6} value={settings.about_us||""} onChange={e=>setSettings({...settings,about_us:e.target.value})} placeholder="اكتب هنا نبذة عن متجرك، رسالتك، وليه العميل يختارك..."/></label>
              <label>سياسة الاستبدال والإرجاع<textarea rows={6} value={settings.return_policy||""} onChange={e=>setSettings({...settings,return_policy:e.target.value})} placeholder="اكتب هنا شروط الاستبدال، المدة المسموحة، حالة المنتج المطلوبة..."/></label>
              <button className="kh-btn kh-btn-primary" onClick={saveSettings}>حفظ الصفحات</button>
            </div>
          )}

          {tab==="settings" && (
            <div className="kh-form" style={{maxWidth:420}}>
              <label>اسم المتجر<input value={settings.store_name||""} onChange={e=>setSettings({...settings,store_name:e.target.value})}/></label>
              <label>رقم واتساب (بالصيغة الدولية بدون +)<input value={settings.whatsapp||""} onChange={e=>setSettings({...settings,whatsapp:e.target.value})} placeholder="201000000000"/></label>
              <label>تكلفة الشحن (ج.م)<input type="number" value={settings.shipping_cost ?? 60} onChange={e=>setSettings({...settings,shipping_cost:e.target.value})}/></label>
              <label>شحن مجاني فوق (ج.م) — اتركها صفر لإلغاء الميزة<input type="number" value={settings.free_shipping_min ?? 0} onChange={e=>setSettings({...settings,free_shipping_min:e.target.value})}/></label>
              <label>الحد الأدنى لقيمة الطلب (ج.م) — اتركها صفر لإلغاء الميزة<input type="number" value={settings.min_order_amount ?? 0} onChange={e=>setSettings({...settings,min_order_amount:e.target.value})}/></label>
              <label>كلمة مرور لوحة التحكم<input value={settings.admin_password||""} onChange={e=>setSettings({...settings,admin_password:e.target.value})}/></label>
              <div className="kh-span-2" style={{borderTop:"1px solid rgba(53,67,49,.1)", paddingTop:14, marginTop:4}}>
                <strong style={{fontSize:".9rem"}}>نقاط الولاء</strong>
              </div>
              <label>نقطة لكل كام جنيه؟<input type="number" value={settings.points_per_egp ? Math.round(1/settings.points_per_egp) : 10} onChange={e=>setSettings({...settings,points_per_egp: 1/(Number(e.target.value)||10)})} placeholder="10"/></label>
              <label>قيمة النقطة الواحدة عند الاستخدام (ج.م)<input type="number" value={settings.point_value ?? 1} onChange={e=>setSettings({...settings,point_value:e.target.value})}/></label>
              <button className="kh-btn kh-btn-primary" onClick={saveSettings}>حفظ الإعدادات</button>
              <div className="kh-span-2" style={{borderTop:"1px solid rgba(53,67,49,.1)", paddingTop:14, marginTop:4}}>
                <strong style={{fontSize:".9rem"}}>نسخة احتياطية</strong>
                <p className="kh-muted" style={{marginTop:6, marginBottom:10}}>تنزيل كل بيانات المتجر (منتجات، طلبات، عملاء...) كملف واحد.</p>
                <button className="kh-btn kh-btn-ghost" onClick={downloadBackup}><Download size={15}/> تنزيل نسخة احتياطية الآن</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showBundleForm && (
        <BundleFormModal bundle={bundleForm} setBundle={setBundleForm} products={products}
          onCancel={()=>setShowBundleForm(false)} onSave={saveBundle}
          toggleItem={toggleBundleItem} setItemQty={setBundleItemQty}/>
      )}

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
          <label>الكمية بالمخزون<input type="number" value={product.stock} onChange={e=>setProduct({...product,stock:e.target.value})}/></label>
          <label>حد التنبيه بالنقص<input type="number" value={product.minStock} onChange={e=>setProduct({...product,minStock:e.target.value})}/></label>
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

          <div className="kh-span-2">
            <strong style={{fontSize:".85rem", color:"var(--ink-soft)"}}>صور إضافية (اختياري)</strong>
            <div style={{display:"flex", flexWrap:"wrap", gap:10, marginTop:8}}>
              {(product.images||[]).map((img,i)=>(
                <div key={i} style={{position:"relative"}}>
                  <img src={img} alt={`صورة ${i+1}`} className="kh-img-preview" style={{margin:0}}/>
                  <button type="button" onClick={()=>setProduct({...product, images: product.images.filter((_,idx)=>idx!==i)})}
                    style={{position:"absolute", top:-6, left:-6, width:22, height:22, borderRadius:"50%", background:"var(--terracotta)", color:"#fff", border:"none", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
            <div style={{display:"flex", gap:8, marginTop:10}}>
              <label className="kh-upload" style={{margin:0}}>
                <Upload size={16}/> إضافة صورة
                <input type="file" accept="image/*" hidden onChange={async e=>{
                  const file = e.target.files[0];
                  if(!file) return;
                  const b64 = await fileToBase64(file);
                  setProduct({...product, images:[...(product.images||[]), b64]});
                  e.target.value = "";
                }}/>
              </label>
              <AddImageUrlField onAdd={url=>setProduct({...product, images:[...(product.images||[]), url]})}/>
            </div>
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

function BundleFormModal({bundle,setBundle,products,onCancel,onSave,toggleItem,setItemQty}){
  const [imgMode,setImgMode] = useState(bundle.image && bundle.image.startsWith("data:") ? "upload" : "url");
  async function handleFile(e){
    const file = e.target.files[0];
    if(!file) return;
    const b64 = await fileToBase64(file);
    setBundle({...bundle, image:b64});
  }
  const compTotal = bundle.items.reduce((s,it)=>{
    const p = products.find(pp=>pp.id===it.productId);
    return s + (p ? Number(p.price)*it.qty : 0);
  },0);
  return (
    <div className="kh-overlay" onClick={onCancel}>
      <div className="kh-modal kh-product-form" onClick={e=>e.stopPropagation()}>
        <button className="kh-close" onClick={onCancel}><X size={18}/></button>
        <h3>{bundle.id ? "تعديل باقة" : "إضافة باقة"}</h3>
        <div className="kh-form">
          <label>اسم الباقة<input value={bundle.name} onChange={e=>setBundle({...bundle,name:e.target.value})}/></label>
          <label>وصف الباقة (اختياري)<textarea rows={2} value={bundle.description} onChange={e=>setBundle({...bundle,description:e.target.value})}/></label>

          <div>
            <div className="kh-img-toggle">
              <button type="button" className={imgMode==="url"?"active":""} onClick={()=>setImgMode("url")}>رابط صورة</button>
              <button type="button" className={imgMode==="upload"?"active":""} onClick={()=>setImgMode("upload")}>رفع صورة</button>
            </div>
            {imgMode==="url" ? (
              <input placeholder="https://... (اختياري، هيستخدم صورة أول منتج لو فاضي)" value={bundle.image && bundle.image.startsWith("data:") ? "" : bundle.image} onChange={e=>setBundle({...bundle,image:e.target.value})}/>
            ) : (
              <label className="kh-upload"><Upload size={16}/> اختر صورة<input type="file" accept="image/*" onChange={handleFile} hidden/></label>
            )}
            {bundle.image && <img src={bundle.image} alt="معاينة" className="kh-img-preview"/>}
          </div>

          <label>سعر الباقة (ج.م)<input type="number" value={bundle.price} onChange={e=>setBundle({...bundle,price:e.target.value})}/></label>
          {compTotal>0 && <p className="kh-muted">مجموع أسعار المنتجات منفردة: {egp(compTotal)} ج.م</p>}

          <label><input type="checkbox" checked={bundle.active} onChange={e=>setBundle({...bundle,active:e.target.checked})} style={{width:"auto"}}/> الباقة مفعّلة</label>

          <div>
            <strong style={{fontSize:".85rem", color:"var(--ink-soft)"}}>اختر منتجات الباقة</strong>
            <div className="kh-cat-list" style={{marginTop:8, maxHeight:220, overflow:"auto"}}>
              {products.map(p=>{
                const item = bundle.items.find(it=>it.productId===p.id);
                return (
                  <div key={p.id} className="kh-cat-item">
                    <label style={{display:"flex", alignItems:"center", gap:8, flex:1, cursor:"pointer"}}>
                      <input type="checkbox" checked={!!item} onChange={()=>toggleItem(p.id)} style={{width:"auto"}}/>
                      {p.name} <span className="kh-muted">({egp(p.price)} ج.م)</span>
                    </label>
                    {item && (
                      <input type="number" min="1" value={item.qty} onChange={e=>setItemQty(p.id, e.target.value)}
                        style={{width:60, padding:"4px 6px", borderRadius:6, border:"1px solid rgba(53,67,49,.2)"}}/>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button className="kh-btn kh-btn-primary kh-full" style={{marginTop:16}} onClick={onSave}>💾 حفظ الباقة</button>
      </div>
    </div>
  );
}

function AddImageUrlField({onAdd}){
  const [value,setValue] = useState("");
  return (
    <div style={{display:"flex", gap:6}}>
      <input placeholder="رابط صورة" value={value} onChange={e=>setValue(e.target.value)}
        style={{padding:"9px 12px", borderRadius:10, border:"1px solid rgba(53,67,49,.16)", fontSize:".85rem"}}/>
      <button type="button" className="kh-btn kh-btn-ghost" style={{padding:"9px 14px", fontSize:".8rem"}}
        onClick={()=>{ if(value.trim()){ onAdd(value.trim()); setValue(""); } }}>إضافة</button>
    </div>
  );
}
