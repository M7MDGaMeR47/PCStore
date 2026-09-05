import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper functions for reading & writing JSON data files
const DATA_DIR = path.join(__dirname, "data");

function readJsonFile(filename, defaultVal = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), "utf8");
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultVal;
  }
}

function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// --------------------------------------------------------------------------
// API ROUTES
// --------------------------------------------------------------------------

// 1. GET /api/settings
app.get("/api/settings", (req, res) => {
  const settings = readJsonFile("settings.json", {});
  res.json(settings);
});

// 2. PUT /api/settings (Admin)
app.put("/api/settings", (req, res) => {
  const updated = req.body;
  writeJsonFile("settings.json", updated);
  res.json({ success: true, settings: updated });
});

// 3. GET /api/wilayas
app.get("/api/wilayas", (req, res) => {
  const wilayas = readJsonFile("wilayas.json", []);
  res.json(wilayas);
});

// 4. PUT /api/wilayas/:code (Admin)
app.put("/api/wilayas/:code", (req, res) => {
  const { code } = req.params;
  const { deliveryFee, active } = req.body;
  const wilayas = readJsonFile("wilayas.json", []);
  const index = wilayas.findIndex((w) => w.code === code);
  if (index === -1) {
    return res.status(404).json({ error: "الولاية غير موجودة" });
  }
  if (deliveryFee !== undefined) wilayas[index].deliveryFee = Number(deliveryFee);
  if (active !== undefined) wilayas[index].active = Boolean(active);
  writeJsonFile("wilayas.json", wilayas);
  res.json({ success: true, wilaya: wilayas[index] });
});

// 5. GET /api/categories
app.get("/api/categories", (req, res) => {
  const products = readJsonFile("products.json", []);
  const categoryDefs = [
    { id: "PC", name: "أجهزة كمبيوتر", icon: "🖥️", desc: "Gaming & Workstation PCs" },
    { id: "GPU", name: "كروت الشاشة", icon: "⚡", desc: "Graphics Cards Gaming" },
    { id: "CPU", name: "المعالجات", icon: "🧠", desc: "Intel & AMD Ryzen" },
    { id: "RAM", name: "الرامات", icon: "⚡", desc: "DDR4 & DDR5 Gaming RAM" },
    { id: "Controller", name: "أذرع التحكم", icon: "🎮", desc: "Xbox, PS5 & PC" },
    { id: "Laptops", name: "لابتوبات", icon: "💻", desc: "Gaming & Business Laptops" },
    { id: "HDD", name: "أقراص صلبة HDD", icon: "💾", desc: "سعات تخزين إضافية" },
    { id: "SSD", name: "وحدات SSD سريعة", icon: "🚀", desc: "NVMe M.2 & SATA" }
  ];

  const categoriesWithCounts = categoryDefs.map((cat) => {
    const count = products.filter((p) => p.category === cat.id).length;
    return { ...cat, count };
  });

  res.json(categoriesWithCounts);
});

// 6. GET /api/products
app.get("/api/products", (req, res) => {
  let products = readJsonFile("products.json", []);
  const { category, badge, search, minPrice, maxPrice, sort, featured, inStock } = req.query;

  if (category && category !== "all" && category !== "الكل") {
    products = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (badge && badge !== "all" && badge !== "الكل") {
    if (badge === "offer" || badge === "العرض") {
      products = products.filter((p) => p.badge === "العرض" || p.badgeType === "offer");
    } else if (badge === "new" || badge === "جديد") {
      products = products.filter((p) => p.badge === "جديد" || p.badgeType === "new");
    } else if (badge === "used" || badge === "مستعمل") {
      products = products.filter((p) => p.badge === "مستعمل" || p.badgeType === "used");
    }
  }

  if (featured === "true") {
    products = products.filter((p) => p.featured);
  }

  if (inStock === "true") {
    products = products.filter((p) => p.stock > 0);
  }

  if (search) {
    const q = search.trim().toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    products = products.filter((p) => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter((p) => p.price <= Number(maxPrice));
  }

  if (sort) {
    if (sort === "price-low") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      products.sort((a, b) => b.id - a.id);
    }
  }

  res.json(products);
});

// 7. GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const products = readJsonFile("products.json", []);
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "المنتج غير موجود" });
  }
  res.json(product);
});

// 8. POST /api/products (Admin/User)
app.post("/api/products", (req, res) => {
  const products = readJsonFile("products.json", []);
  const newProduct = req.body;

  if (!newProduct.name || !newProduct.price || !newProduct.category) {
    return res.status(400).json({ error: "يرجى ملء جميع الحقول الإلزامية (الاسم، السعر، الفئة)" });
  }

  const isOffer = Boolean(newProduct.isOffer === true || newProduct.isOffer === "true" || newProduct.badge === "العرض");
  const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const product = {
    id: newId,
    name: newProduct.name.trim(),
    category: newProduct.category,
    price: Number(newProduct.price),
    oldPrice: isOffer && newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
    isOffer,
    badge: isOffer ? "العرض" : (newProduct.badge === "مستعمل" ? "مستعمل" : "جديد"),
    badgeType: isOffer ? "offer" : (newProduct.badge === "مستعمل" ? "used" : "new"),
    stock: Number(newProduct.stock ?? 1),
    image: newProduct.image || "image/pc1.jpg",
    gallery: newProduct.gallery && newProduct.gallery.length > 0 ? newProduct.gallery : [newProduct.image || "image/pc1.jpg"],
    audioUrl: newProduct.audioUrl || "",
    description: newProduct.description || "",
    featured: Boolean(newProduct.featured),
    specs: newProduct.specs || {}
  };

  products.unshift(product);
  writeJsonFile("products.json", products);
  res.status(201).json({ success: true, product });
});

// 9. PUT /api/products/:id (Admin/User)
app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const products = readJsonFile("products.json", []);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "المنتج غير موجود" });
  }

  const updated = req.body;
  const isOffer = updated.isOffer !== undefined
    ? Boolean(updated.isOffer === true || updated.isOffer === "true" || updated.badge === "العرض")
    : (products[index].isOffer ?? (products[index].badge === "العرض"));

  products[index] = {
    ...products[index],
    ...updated,
    id,
    price: Number(updated.price !== undefined ? updated.price : products[index].price),
    oldPrice: isOffer ? (updated.oldPrice !== undefined ? (updated.oldPrice ? Number(updated.oldPrice) : null) : products[index].oldPrice) : null,
    isOffer,
    stock: Number(updated.stock !== undefined ? updated.stock : products[index].stock),
    badge: isOffer ? "العرض" : (updated.badge === "مستعمل" ? "مستعمل" : "جديد"),
    badgeType: isOffer ? "offer" : (updated.badge === "مستعمل" ? "used" : "new"),
    audioUrl: updated.audioUrl !== undefined ? updated.audioUrl : (products[index].audioUrl || "")
  };

  writeJsonFile("products.json", products);
  res.json({ success: true, product: products[index] });
});

// 10. DELETE /api/products/:id (Admin)
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  let products = readJsonFile("products.json", []);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "المنتج غير موجود" });
  }
  products = products.filter((p) => p.id !== id);
  writeJsonFile("products.json", products);
  res.json({ success: true, message: "تم حذف المنتج بنجاح" });
});

// 11. POST /api/orders (Client checkout via WhatsApp)
app.post("/api/orders", (req, res) => {
  const { customer, items } = req.body;

  if (!customer || !customer.name || !customer.phone) {
    return res.status(400).json({ error: "يرجى ملء الاسم ورقم الهاتف على الأقل" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "السلة فارغة، يرجى إضافة منتجات أولاً" });
  }

  // Verify stock and price from server DB
  const products = readJsonFile("products.json", []);
  const settings = readJsonFile("settings.json", {});

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = products.find((p) => p.id === Number(item.id));
    if (product) {
      subtotal += product.price * item.quantity;
      verifiedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
      // Optionally decrement stock if stock > 0
      if (product.stock >= item.quantity) {
        product.stock -= item.quantity;
      }
    } else {
      subtotal += (item.price || 0) * (item.quantity || 1);
      verifiedItems.push({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || ""
      });
    }
  }

  // Update products stock in file
  writeJsonFile("products.json", products);

  // Generate unique order code
  const orders = readJsonFile("orders.json", []);
  const nextId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1001;
  const orderCode = `PC-${nextId}`;

  const customerName = (customer.name || "").trim();
  const customerPhone = (customer.phone || "").trim();
  const customerWilaya = (customer.wilaya || customer.wilayaName || customer.wilayaCode || "").trim();
  const customerCommune = (customer.commune || "").trim();
  const customerAddress = (customer.address || "").trim();
  const customerNotes = (customer.notes || customer.message || "").trim();

  // Format currency in Algerian Dinars
  const formatDZ = (n) => Number(n).toLocaleString("fr-DZ") + " دج";

  // Build ultra-clean and organized WhatsApp message for Khalil Tech
  let itemsList = verifiedItems
    .map((item, idx) => {
      const itemTotal = formatDZ(item.price * item.quantity);
      return `${idx + 1}️⃣ *المنتج:* ${item.name}\n   ▫️ *الكمية:* ${item.quantity} قطعة\n   ▫️ *السعر:* ${formatDZ(item.price)}${item.quantity > 1 ? ` (المجموع: ${itemTotal})` : ""}`;
    })
    .join("\n\n");

  const fullAddress = [customerWilaya, customerCommune, customerAddress].filter(Boolean).join(" - ");

  const waMessage = 
`السلام عليكم ورحمة الله وبركاته أخي خليل تك ⚡
لدي طلب شراء جديد من متجركم *PC STORE - KHALIL TECH*:

📋 *قائمة المنتجات المطلوبة:*
───────────────────
${itemsList}

───────────────────
💰 *المجموع الإجمالي للطلبية:* *${formatDZ(subtotal)}*
🚚 *طريقة الدفع:* الدفع عند الاستلام يداً بيد
───────────────────

👤 *معلومات الزبون للتوصيل:*
• 👤 *الاسم واللقب:* ${customerName}
• 📞 *رقم الهاتف:* ${customerPhone}
${fullAddress ? `• 📍 *العنوان والولاية:* ${fullAddress}\n` : ""}${customerNotes ? `\n💬 *رسالة واستفسار الزبون:*\n"${customerNotes}"\n` : ""}
───────────────────
📦 *رقم الطلبية بالموقع:* #${orderCode}
⚡ تم إرسال هذا الطلب عبر منصة: *PC STORE - KHALIL TECH*
يرجى تأكيد توفر المنتجات وموعد التوصيل. شكراً لكم!`;

  // Get store owner's WhatsApp number from settings
  let storeWhatsApp = (settings.whatsapp || "213550123456").replace(/\D/g, "");
  if (!storeWhatsApp.startsWith("213") && storeWhatsApp.startsWith("0")) {
    storeWhatsApp = "213" + storeWhatsApp.slice(1);
  }

  const whatsappUrl = `https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(waMessage)}`;

  const newOrder = {
    id: nextId,
    orderCode,
    customer: {
      name: customerName,
      phone: customerPhone,
      wilaya: customerWilaya,
      commune: customerCommune,
      address: customerAddress,
      notes: customerNotes
    },
    items: verifiedItems,
    subtotal,
    total: subtotal,
    paymentMethod: "واتساب / الدفع عند الاستلام",
    status: "طلب عبر واتساب",
    createdAt: new Date().toISOString(),
    whatsappMessage: waMessage
  };

  orders.unshift(newOrder);
  writeJsonFile("orders.json", orders);

  res.status(201).json({
    success: true,
    order: newOrder,
    whatsappUrl,
    whatsappMessage: waMessage,
    message: "تم تجهيز طلبك بنجاح للإرسال عبر واتساب"
  });
});

// 12. GET /api/orders (Admin)
app.get("/api/orders", (req, res) => {
  const orders = readJsonFile("orders.json", []);
  const { status } = req.query;
  if (status && status !== "all" && status !== "الكل") {
    return res.json(orders.filter((o) => o.status === status));
  }
  res.json(orders);
});

// 13. PATCH /api/orders/:id/status (Admin)
app.patch("/api/orders/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body;
  const orders = readJsonFile("orders.json", []);
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "الطلب غير موجود" });
  }

  orders[index].status = status;
  orders[index].statusHistory = orders[index].statusHistory || [];
  orders[index].statusHistory.push({
    status,
    time: new Date().toISOString(),
    note: note || `تم تحديث حالة الطلب إلى: ${status}`
  });

  writeJsonFile("orders.json", orders);
  res.json({ success: true, order: orders[index] });
});

// 15. GET /api/stats (Admin stats dashboard)
app.get("/api/stats", (req, res) => {
  const orders = readJsonFile("orders.json", []);
  const products = readJsonFile("products.json", []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "تم استلام الطلب" || o.status === "قيد التحضير"
  ).length;
  const completedOrders = orders.filter((o) => o.status === "تم التوصيل").length;

  const totalRevenue = orders
    .filter((o) => o.status !== "ملغى")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const lowStockProducts = products.filter((p) => p.stock <= 2 && p.stock > 0);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Today orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(
    (o) => o.createdAt && o.createdAt.startsWith(todayStr)
  );
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "ملغى")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  res.json({
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    todayOrdersCount: todayOrders.length,
    todayRevenue,
    totalProducts: products.length,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockItems: lowStockProducts,
    recentOrders: orders.slice(0, 5)
  });
});

// 16. POST /api/license/verify (Khalil Tech cash license key activation & login)
app.post("/api/license/verify", (req, res) => {
  const { licenseKey, password } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ error: "يرجى إدخال كود التفعيل / الترخيص المدفوع" });
  }

  const cleanKey = licenseKey.trim().toUpperCase();
  const licenses = readJsonFile("licenses.json", []);
  const index = licenses.findIndex((lic) => lic.code.toUpperCase() === cleanKey);

  if (index === -1) {
    return res.status(401).json({
      error: "كود التفعيل غير مسجل في النظام! يرجى التواصل مع مصمم ومسؤول الموقع لدفع الرسوم كاش واستلام الكود."
    });
  }

  const lic = licenses[index];
  if (lic.status === "suspended") {
    return res.status(403).json({
      error: "هذا الترخيص موقوف حالياً من قِبل مصمم الموقع. يرجى مراجعته لتجديد الحساب."
    });
  }

  // Activate if available
  if (lic.status === "available") {
    lic.status = "active";
    lic.activatedAt = new Date().toISOString();
    writeJsonFile("licenses.json", licenses);
  }

  return res.json({
    success: true,
    token: "khalil_tech_license_token_" + Date.now(),
    license: lic,
    user: {
      name: lic.issuedTo || "خليل تك (Khalil Tech)",
      role: "merchant",
      phone: "0550123456",
      licenseCode: lic.code
    },
    message: "تم تفعيل حساب خليل تك بنجاح بالترخيص المدفوع كاش! مرحباً بك في لوحة تحكم متجرك."
  });
});

// 16.1 POST /api/admin/login (Supports both license key and direct credentials)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const rawKey = req.body.licenseKey || req.body.licenseCode;

  // Check if logging in with license key
  if (rawKey) {
    const cleanKey = rawKey.trim().toUpperCase();
    const licenses = readJsonFile("licenses.json", []);
    const lic = licenses.find((l) => l.code.toUpperCase() === cleanKey && l.status !== "suspended");
    if (lic) {
      if (lic.status === "available") {
        lic.status = "active";
        lic.activatedAt = new Date().toISOString();
        writeJsonFile("licenses.json", licenses);
      }
      return res.json({
        success: true,
        token: "khalil_tech_license_token_" + Date.now(),
        license: lic,
        user: { name: lic.issuedTo || "خليل تك", role: "merchant", licenseCode: lic.code, phone: "0550123456" }
      });
    }
  }

  const users = readJsonFile("users.json", []);

  // Check in users.json for admin
  const user = users.find(
    (u) =>
      (u.email === username || u.phone === username || u.name === username || username === "admin" || username === "khalil") &&
      (u.password === password || password === "admin123" || password === "khalil123" || password === "pcstore2026" || password === "khalil2026")
  );

  if (user && user.role === "admin") {
    return res.json({
      success: true,
      token: "pc_admin_secret_token_" + Date.now(),
      user: { id: user.id, name: user.name, role: "merchant", phone: user.phone, email: user.email }
    });
  }

  // Fallback credentials for Khalil Tech
  if (
    (username === "admin" || username === "khalil" || !username) &&
    (password === "admin123" || password === "khalil123" || password === "pcstore2026" || password === "khalil2026")
  ) {
    return res.json({
      success: true,
      token: "pc_admin_secret_token_" + Date.now(),
      user: { id: 1, name: "خليل تك (Khalil Tech)", role: "merchant", phone: "0550123456", email: "khalil@pcstore.dz" }
    });
  }
  res.status(401).json({ error: "اسم المستخدم أو كلمة المرور أو كود الترخيص غير صحيح" });
});

// 16.2 DESIGNER / WEBMASTER MANAGEMENT API
// POST /api/designer/login
app.post("/api/designer/login", (req, res) => {
  const { password } = req.body;
  if (password === "designer2026" || password === "admin123" || password === "designer") {
    return res.json({
      success: true,
      token: "designer_master_key_" + Date.now(),
      role: "designer",
      name: "مسؤول ومصمم الموقع"
    });
  }
  return res.status(401).json({ error: "كلمة مرور مصمم ومسؤول الموقع غير صحيحة" });
});

// GET /api/designer/licenses
app.get("/api/designer/licenses", (req, res) => {
  const licenses = readJsonFile("licenses.json", []);
  res.json(licenses);
});

// POST /api/designer/licenses/generate
app.post("/api/designer/licenses/generate", (req, res) => {
  const { issuedTo, paymentType, notes } = req.body;
  const licenses = readJsonFile("licenses.json", []);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newCode = `KT-CASH-${randomNum}`;

  const newLic = {
    code: newCode,
    issuedTo: (issuedTo || "خليل تك (Khalil Tech)").trim(),
    status: "available",
    paymentType: (paymentType || "Cash (كاش عند الاستلام)").trim(),
    createdAt: new Date().toISOString(),
    activatedAt: null,
    notes: (notes || "كود ترخيص جديد تم توليده من قِبل مصمم الموقع").trim()
  };

  licenses.unshift(newLic);
  writeJsonFile("licenses.json", licenses);
  res.status(201).json({ success: true, license: newLic });
});

// POST /api/designer/licenses/toggle
app.post("/api/designer/licenses/toggle", (req, res) => {
  const { code, status } = req.body;
  const licenses = readJsonFile("licenses.json", []);
  const lic = licenses.find((l) => l.code === code);
  if (!lic) {
    return res.status(404).json({ error: "الترخيص غير موجود" });
  }
  lic.status = status || (lic.status === "active" ? "suspended" : "active");
  writeJsonFile("licenses.json", licenses);
  res.json({ success: true, license: lic });
});

// 17. AUTH & REGISTRATION API (Open to all customers & store users)
// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, phone, email, password, wilaya, address } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: "يرجى ملء الاسم ورقم الهاتف وكلمة المرور" });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: "كلمة المرور يجب أن لا تقل عن 4 خانات" });
  }

  const users = readJsonFile("users.json", []);
  const cleanPhone = phone.trim().replace(/\s+/g, "");

  // Check if phone or email already registered
  const exists = users.find(
    (u) =>
      u.phone.replace(/\s+/g, "") === cleanPhone ||
      (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase())
  );

  if (exists) {
    return res.status(400).json({ error: "رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً! يمكنك تسجيل الدخول مباشرة" });
  }

  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: newId,
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim() : "",
    password: password.trim(),
    role: "customer",
    wilaya: wilaya ? wilaya.trim() : "",
    address: address ? address.trim() : "",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJsonFile("users.json", users);

  const token = `usr_${newUser.id}_${Date.now()}`;
  const safeUser = { ...newUser };
  delete safeUser.password;

  res.status(201).json({
    success: true,
    token,
    user: safeUser,
    message: "تم إنشاء حسابك بنجاح! أهلاً بك في PC STORE"
  });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "يرجى إدخال الهاتف/البريد وكلمة المرور" });
  }

  const users = readJsonFile("users.json", []);
  const cleanLogin = login.trim().replace(/\s+/g, "").toLowerCase();

  const user = users.find(
    (u) =>
      (u.phone.replace(/\s+/g, "") === cleanLogin ||
        (u.email && u.email.toLowerCase() === cleanLogin) ||
        u.name.toLowerCase() === cleanLogin) &&
      u.password === password.trim()
  );

  // Also support default admin credentials
  if (
    !user &&
    (cleanLogin === "admin" || cleanLogin === "khalil") &&
    (password === "admin123" || password === "pcstore2026")
  ) {
    return res.json({
      success: true,
      token: "pc_admin_secret_token_" + Date.now(),
      user: { id: 1, name: "خليل تك - المدير", role: "admin", phone: "0550123456", email: "khalil@pcstore.dz" }
    });
  }

  if (!user) {
    return res.status(401).json({ error: "رقم الهاتف/البريد أو كلمة المرور غير صحيحة" });
  }

  const token = user.role === "admin" ? `pc_admin_secret_token_${Date.now()}` : `usr_${user.id}_${Date.now()}`;
  const safeUser = { ...user };
  delete safeUser.password;

  res.json({
    success: true,
    token,
    user: safeUser,
    message: `مرحباً بعودتك ${safeUser.name}!`
  });
});

// GET /api/auth/me
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim() || req.query.token;

  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  if (token.startsWith("pc_admin_secret_token_")) {
    return res.json({
      success: true,
      user: { id: 1, name: "خليل تك - المدير", role: "admin", phone: "0550123456", email: "khalil@pcstore.dz" }
    });
  }

  const users = readJsonFile("users.json", []);
  const parts = token.split("_");
  const userId = Number(parts[1]);

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "الجلسة منتهية أو المستخدم غير موجود" });
  }

  const safeUser = { ...user };
  delete safeUser.password;
  res.json({ success: true, user: safeUser });
});

// PUT /api/auth/profile
app.put("/api/auth/profile", (req, res) => {
  const { id, name, phone, email, wilaya, address, password } = req.body;
  if (!id) return res.status(400).json({ error: "معرف المستخدم مطلوب" });

  const users = readJsonFile("users.json", []);
  const index = users.findIndex((u) => u.id === Number(id));
  if (index === -1) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  if (name) users[index].name = name.trim();
  if (phone) users[index].phone = phone.trim().replace(/\s+/g, "");
  if (email !== undefined) users[index].email = email.trim();
  if (wilaya !== undefined) users[index].wilaya = wilaya.trim();
  if (address !== undefined) users[index].address = address.trim();
  if (password && password.trim().length >= 4) {
    users[index].password = password.trim();
  }

  writeJsonFile("users.json", users);
  const safeUser = { ...users[index] };
  delete safeUser.password;
  res.json({ success: true, user: safeUser, message: "تم تحديث البيانات بنجاح" });
});

// GET /api/users (Admin only)
app.get("/api/users", (req, res) => {
  const users = readJsonFile("users.json", []);
  const safeUsers = users.map((u) => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json(safeUsers);
});

// Serve static frontend files
app.use(express.static(__dirname));

// HTML Page fallbacks
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PC Store server running on http://0.0.0.0:${PORT}`);
});
