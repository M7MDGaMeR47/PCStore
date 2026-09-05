/* ==========================================================================
   PC STORE - KHALIL TECH | PRODUCTS & API CLIENT
   ========================================================================== */

const API_BASE = "/api";

// Empty fallback products - products are entered dynamically by Khalil Tech
const fallbackProducts = [];

// Provide global variable
let products = [];

// Fetch products from REST API
async function apiGetProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
        const res = await fetch(`${API_BASE}/products${query ? "?" + query : ""}`);
        if (res.ok) {
            const data = await res.json();
            products = data;
            return data;
        }
    } catch (err) {
        console.warn("API fetch products failed:", err);
    }
    return products;
}

// Fetch single product
async function apiGetProduct(id) {
    try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("API fetch product failed, using local lookup:", err);
    }
    return products.find(p => p.id === Number(id)) || null;
}

// Fetch categories
async function apiGetCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("API fetch categories failed:", err);
    }
    return [
        { id: "PC", name: "أجهزة كمبيوتر", icon: "🖥️", count: 2 },
        { id: "GPU", name: "كروت الشاشة", icon: "⚡", count: 2 },
        { id: "CPU", name: "المعالجات", icon: "🧠", count: 1 },
        { id: "RAM", name: "الرامات", icon: "⚡", count: 1 },
        { id: "Controller", name: "أذرع التحكم", icon: "🎮", count: 1 },
        { id: "Laptops", name: "لابتوبات", icon: "💻", count: 1 },
        { id: "HDD", name: "أقراص HDD", icon: "💾", count: 1 },
        { id: "SSD", name: "وحدات SSD", icon: "🚀", count: 1 }
    ];
}

// Fetch Wilayas and delivery rates
async function apiGetWilayas() {
    try {
        const res = await fetch(`${API_BASE}/wilayas`);
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("API fetch wilayas failed:", err);
    }
    return [];
}

// Place Order
async function apiPlaceOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "فشل في تسجيل الطلب");
    }
    return data;
}

// Track Order
async function apiTrackOrder(orderCode, phone = "") {
    const query = new URLSearchParams({ orderCode, phone }).toString();
    const res = await fetch(`${API_BASE}/orders/track?${query}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "لم يتم العثور على الطلب");
    }
    return data;
}

// Render reusable Product Card HTML
function createProductCardHtml(product) {
    // Determine badge styling & text
    let badgeClass = "badge-new";
    let badgeText = product.badge || "جديد";
    if (product.badge === "مستعمل" || product.badgeType === "used") {
        badgeClass = "badge-used";
    } else if (product.badge === "العرض" || product.badgeType === "offer") {
        badgeClass = "badge-offer";
    } else if (product.stock === 0) {
        badgeClass = "badge-out";
        badgeText = "غير متوفر";
    }

    // Calculate discount if old price exists
    let discountHtml = "";
    if (product.oldPrice && product.oldPrice > product.price) {
        const percent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        discountHtml = `<span class="discount-pill">-${percent}%</span>`;
    }

    // Stock tag
    let stockTagHtml = "";
    if (product.stock <= 0) {
        stockTagHtml = `<span class="stock-indicator out-of-stock"><span class="stock-dot"></span> نفذ من المخزون</span>`;
    } else if (product.stock <= 2) {
        stockTagHtml = `<span class="stock-indicator low-stock"><span class="stock-dot"></span> متبقي ${product.stock} فقط</span>`;
    } else {
        stockTagHtml = `<span class="stock-indicator in-stock"><span class="stock-dot"></span> متوفر في المحل</span>`;
    }

    const disabledAttr = product.stock <= 0 ? "disabled" : "";

    return `
        <article class="product-card" onclick="if(!event.target.closest('.add-cart-btn')) window.location.href='product.html?id=${product.id}'">
            <div class="product-image-wrap">
                <span class="product-badge-overlay badge ${badgeClass}">${badgeText}</span>
                ${discountHtml ? `<div class="product-discount-overlay">${discountHtml}</div>` : ""}
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-body">
                <span class="product-category-name">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description || ""}</p>
                <div class="product-pricing">
                    <span class="price-current">${formatDinar(product.price)}</span>
                    ${product.oldPrice ? `<span class="price-old">${formatDinar(product.oldPrice)}</span>` : ""}
                </div>
                <div class="product-card-footer">
                    ${stockTagHtml}
                    <button class="add-cart-btn" ${disabledAttr} title="أضف إلى السلة" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        🛒
                    </button>
                </div>
            </div>
        </article>
    `;
}
