import { Pool } from "pg";

let pool = null;
let ready = null;

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL_UNPOOLED;
    if (!connectionString) {
      throw new Error("NO_DATABASE_URL");
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function init(p) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      price NUMERIC NOT NULL DEFAULT 0,
      original_price NUMERIC,
      description TEXT DEFAULT '',
      specs TEXT DEFAULT '',
      image TEXT DEFAULT '',
      status TEXT DEFAULT 'available',
      is_new BOOLEAN DEFAULT false,
      is_best_seller BOOLEAN DEFAULT false,
      offer_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_percent NUMERIC DEFAULT 0,
      min_order NUMERIC DEFAULT 0,
      expiry DATE,
      active BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      items JSONB,
      subtotal NUMERIC,
      discount NUMERIC,
      coupon_code TEXT,
      total NUMERIC,
      customer JSONB,
      status TEXT DEFAULT 'جديد'
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      store_name TEXT DEFAULT 'خِزانة',
      whatsapp TEXT DEFAULT '201000000000',
      admin_password TEXT DEFAULT 'khizana2026'
    );
  `);

  // Idempotent migrations for the order-tracking system (safe to run every boot).
  await p.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no SERIAL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS landmark TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone2 TEXT DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 60;
  `);

  // Idempotent migrations for inventory + advanced coupons (Phase 2).
  await p.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 20;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
    ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent';
    ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER;
    ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
  `);

  const { rows: cnt } = await p.query("SELECT COUNT(*)::int AS c FROM products");
  if (cnt[0].c === 0) {
    const categories = [
      "المطبخ",
      "التخزين والتنظيم",
      "أدوات التنظيف",
      "الأجهزة المنزلية الصغيرة",
      "الإضاءة",
      "الديكور المنزلي",
    ];
    for (const name of categories) {
      await p.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
    }
    const products = [
      ["KH-KIT-001", "طقم حلل جرانيت 8 قطع", "المطبخ", 1450, 1650, "طقم حلل جرانيت عالي الجودة، سطح غير لاصق.", "8 قطع\nجرانيت\nمناسب للاستخدام اليومي", true, false],
      ["KH-STO-001", "صناديق تخزين شفافة (3 مقاسات)", "التخزين والتنظيم", 380, 380, "صناديق بلاستيك شفاف بأغطية محكمة.", "3 مقاسات\nبلاستيك شفاف", false, false],
      ["KH-APP-001", "غلاية كهربائية استانلس 1.7 لتر", "الأجهزة المنزلية الصغيرة", 590, 590, "غلاية استانلس ستيل بقدرة 2200 وات.", "1.7 لتر\nاستانلس ستيل", false, true],
      ["KH-CLN-001", "سيت أدوات تنظيف منزلي (5 قطع)", "أدوات التنظيف", 265, 265, "مجموعة متكاملة من أدوات التنظيف الأساسية.", "5 قطع", false, false],
      ["KH-LIT-001", "لمبة LED دافئة قابلة للتعتيم", "الإضاءة", 145, 210, "إضاءة دافئة موفرة للطاقة.", "9 وات\nضوء دافئ 3000K", false, false],
      ["KH-DEC-001", "مزهرية سيراميك بيج", "الديكور المنزلي", 220, 220, "مزهرية سيراميك بتشطيب مطفي.", "سيراميك\nارتفاع 24 سم", false, true],
    ];
    for (const pr of products) {
      await p.query(
        `INSERT INTO products (code,name,category,price,original_price,description,specs,is_best_seller,is_new)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (code) DO NOTHING`,
        [pr[0], pr[1], pr[2], pr[3], pr[4], pr[5], pr[6], pr[7], pr[8]]
      );
    }
    await p.query(
      "INSERT INTO coupons (code, discount_percent, min_order, expiry, active) VALUES ('KH15',15,500,'2026-12-31',true) ON CONFLICT DO NOTHING"
    );
    await p.query(
      "INSERT INTO settings (id, store_name, whatsapp, admin_password) VALUES (1,'خِزانة','201000000000','khizana2026') ON CONFLICT (id) DO NOTHING"
    );
  }
}

export async function db() {
  const p = getPool();
  if (!ready) {
    ready = init(p).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return p;
}
