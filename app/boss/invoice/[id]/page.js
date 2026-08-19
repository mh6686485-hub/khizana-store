"use client";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import Link from "next/link";

function egp(n){ return Number(n||0).toLocaleString("ar-EG"); }

export default function InvoicePage({ params }){
  const [order,setOrder] = useState(null);
  const [settings,setSettings] = useState(null);
  const [error,setError] = useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const [oRes, sRes] = await Promise.all([
          fetch(`/api/orders/${params.id}`),
          fetch("/api/settings"),
        ]);
        if(oRes.status===401){ setError("محتاج تسجّل دخول من لوحة التحكم الأول."); return; }
        if(!oRes.ok){ setError("الطلب غير موجود."); return; }
        setOrder(await oRes.json());
        setSettings(await sRes.json());
      }catch(e){ setError("حدث خطأ أثناء التحميل."); }
    })();
  },[params.id]);

  if(error){
    return (
      <div className="kh-root kh-loading" style={{flexDirection:"column", gap:14}}>
        <p>{error}</p>
        <Link href="/boss" className="kh-btn kh-btn-primary">لوحة التحكم</Link>
      </div>
    );
  }
  if(!order || !settings) return <div className="kh-root kh-loading">جارِ التحميل...</div>;

  return (
    <div className="kh-invoice-page">
      <div className="kh-invoice-actions no-print">
        <button className="kh-btn kh-btn-primary" onClick={()=>window.print()}><Printer size={16}/> طباعة</button>
      </div>

      <div className="kh-invoice-sheet">
        <div className="kh-invoice-header">
          <div>
            <h1>{settings.store_name}</h1>
            <p>فاتورة طلب</p>
          </div>
          <div className="kh-invoice-meta">
            <div><strong>رقم الطلب:</strong> {order.order_number}</div>
            <div><strong>التاريخ:</strong> {new Date(order.created_at).toLocaleDateString("ar-EG")}</div>
            <div><strong>الحالة:</strong> {order.status}</div>
          </div>
        </div>

        <div className="kh-invoice-customer">
          <div><strong>العميل:</strong> {order.customer?.name}</div>
          <div><strong>الهاتف:</strong> {order.customer?.phone}{order.phone2 ? ` / ${order.phone2}` : ""}</div>
          <div><strong>العنوان:</strong> {order.governorate}{order.city ? " — "+order.city : ""}{order.area ? " — "+order.area : ""} — {order.customer?.address}{order.landmark ? ` (${order.landmark})` : ""}</div>
        </div>

        <table className="kh-invoice-table">
          <thead>
            <tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            {(order.items||[]).map((it,i)=>(
              <tr key={i}>
                <td>{it.name}</td>
                <td>{it.qty}</td>
                <td>{egp(it.price)} ج.م</td>
                <td>{egp(it.price*it.qty)} ج.م</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="kh-invoice-totals">
          <div><span>الإجمالي الفرعي</span><span>{egp(order.subtotal)} ج.م</span></div>
          {Number(order.discount)>0 && <div><span>الخصم</span><span>-{egp(order.discount)} ج.م</span></div>}
          <div><span>الشحن</span><span>{egp(order.shipping_cost)} ج.م</span></div>
          <div className="kh-invoice-grand"><span>الإجمالي</span><span>{egp(order.total)} ج.م</span></div>
        </div>

        <div className="kh-invoice-footer">
          <p>طريقة الدفع: الدفع عند الاستلام</p>
          <p>شكرًا لتعاملك مع {settings.store_name} 🌿</p>
        </div>
      </div>
    </div>
  );
}
