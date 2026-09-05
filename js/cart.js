/* ==========================================================================
   PC STORE - KHALIL TECH | GLOBAL CART, MINI-CART & UI CONTROLLER
   ========================================================================== */

const CART_STORAGE_KEY = "pc_store_cart";

// Retrieve cart from localStorage
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

// Save cart to localStorage and trigger UI updates
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadges();
    renderMiniCart();
    // Dispatch custom event for pages like cart.html
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { cart } }));
}

// Update navbar cart badges
function updateCartBadges() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? "flex" : "none";
    });
}

// Format Algerian Dinar currency
function formatDinar(num) {
    return Number(num || 0).toLocaleString("fr-DZ") + " DA";
}

// Show animated toast notification
function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : "⚠️";
    toast.innerHTML = `<span style="font-size:18px">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Add product to cart with stock validation
function addToCart(product, quantity = 1, silent = false) {
    if (!product || !product.id) return;
    
    // Check if out of stock
    if (product.stock !== undefined && product.stock <= 0) {
        showToast("عذراً، هذا المنتج غير متوفر في المخزون حالياً", "error");
        return;
    }

    let cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    const maxStock = product.stock || 99;

    if (existing) {
        if (existing.quantity + quantity > maxStock) {
            showToast(`أقصى كمية متاحة في المخزون هي ${maxStock} قطع`, "error");
            return;
        }
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image || "image/pc1.jpg",
            category: product.category,
            stock: product.stock,
            quantity: Math.min(quantity, maxStock)
        });
    }

    saveCart(cart);
    
    if (!silent) {
        showToast(`تمت إضافة "${product.name}" إلى السلة`);
        openMiniCart();
    }
}

// Update quantity of an item
function updateCartItemQty(productId, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
        showToast("تم حذف المنتج من السلة");
    } else if (item.stock && item.quantity > item.stock) {
        item.quantity = item.stock;
        showToast(`أقصى كمية متوفرة هي ${item.stock}`, "error");
    }

    saveCart(cart);
}

// Remove item completely
function removeCartItem(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart);
    showToast("تم حذف المنتج من السلة");
}

// Calculate subtotal
function getCartSubtotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// ==========================================================================
// MINI-CART DRAWER CONTROLLER
// ==========================================================================
function setupMiniCart() {
    if (document.getElementById("miniCartDrawer")) return;

    const drawerHtml = `
        <div class="drawer-backdrop" id="drawerBackdrop"></div>
        <aside class="mini-cart-drawer" id="miniCartDrawer">
            <div class="drawer-header">
                <h3><span>🛒</span> سلة مشترياتك</h3>
                <button class="drawer-close" id="closeDrawerBtn">✕</button>
            </div>
            <div class="drawer-body" id="miniCartItems">
                <!-- Mini Cart Items loaded here -->
            </div>
            <div class="drawer-footer" id="miniCartFooter">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:800; font-size:16px;">
                    <span>المجموع الفرعي:</span>
                    <span id="miniCartSubtotal" style="color:var(--primary-light);">0 DA</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <a href="cart.html" class="btn btn-secondary btn-sm" style="font-size:13px;">عرض السلة</a>
                    <a href="checkout.html" class="btn btn-primary btn-sm" style="font-size:13px;">إتمام الطلب</a>
                </div>
            </div>
        </aside>
    `;

    document.body.insertAdjacentHTML("beforeend", drawerHtml);

    document.getElementById("closeDrawerBtn")?.addEventListener("click", closeMiniCart);
    document.getElementById("drawerBackdrop")?.addEventListener("click", closeMiniCart);
}

function openMiniCart() {
    setupMiniCart();
    renderMiniCart();
    document.getElementById("miniCartDrawer")?.classList.add("active");
    document.getElementById("drawerBackdrop")?.classList.add("active");
}

function closeMiniCart() {
    document.getElementById("miniCartDrawer")?.classList.remove("active");
    document.getElementById("drawerBackdrop")?.classList.remove("active");
}

function renderMiniCart() {
    const container = document.getElementById("miniCartItems");
    const subtotalEl = document.getElementById("miniCartSubtotal");
    const footerEl = document.getElementById("miniCartFooter");
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 10px; color:var(--text-muted);">
                <div style="font-size:42px; margin-bottom:10px;">🛒</div>
                <p style="font-weight:700; margin-bottom:6px;">سلتك فارغة حالياً</p>
                <p style="font-size:13px; color:var(--text-dim); margin-bottom:18px;">تصفح أفضل عروض أجهزة الـ Gaming والقطع</p>
                <a href="products.html" class="btn btn-secondary btn-sm" onclick="closeMiniCart()">تصفح المنتجات</a>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = "0 DA";
        if (footerEl) footerEl.style.display = "none";
        return;
    }

    if (footerEl) footerEl.style.display = "block";

    container.innerHTML = cart.map(item => `
        <div style="display:flex; align-items:center; gap:12px; background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
            <img src="${item.image}" alt="${item.name}" style="width:55px; height:55px; object-fit:contain; background:#080a0f; border-radius:6px; padding:4px;">
            <div style="flex-grow:1; min-width:0;">
                <h5 style="font-size:13px; font-weight:700; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</h5>
                <div style="color:var(--primary-light); font-size:13px; font-weight:800;">${formatDinar(item.price)}</div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                    <button onclick="updateCartItemQty(${item.id}, -1)" style="width:24px; height:24px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:4px; font-size:12px; display:flex; align-items:center; justify-content:center;">-</button>
                    <span style="font-size:13px; font-weight:700;">${item.quantity}</span>
                    <button onclick="updateCartItemQty(${item.id}, 1)" style="width:24px; height:24px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:4px; font-size:12px; display:flex; align-items:center; justify-content:center;">+</button>
                </div>
            </div>
            <button onclick="removeCartItem(${item.id})" style="color:var(--text-dim); padding:6px; font-size:14px;" title="حذف">🗑️</button>
        </div>
    `).join("");

    if (subtotalEl) {
        subtotalEl.textContent = formatDinar(getCartSubtotal());
    }
}

// ==========================================================================
// SEARCH MODAL & QUICK COMMAND PALETTE
// ==========================================================================
let allCachedProducts = [];

async function loadProductsCache() {
    if (allCachedProducts.length > 0) return allCachedProducts;
    try {
        const res = await fetch("/api/products");
        if (res.ok) {
            allCachedProducts = await res.json();
        }
    } catch (e) {
        console.error("Failed to load products for search", e);
    }
    return allCachedProducts;
}

function setupSearchModal() {
    if (document.getElementById("searchModal")) return;

    const modalHtml = `
        <div class="search-modal" id="searchModal">
            <div class="search-modal-box">
                <div class="search-modal-header">
                    <span style="font-size:18px;">🔍</span>
                    <input type="text" id="modalSearchInput" placeholder="ابحث عن كرت شاشة، معالج، كمبيوتر، رام..." autocomplete="off">
                    <button id="closeSearchModal" style="color:var(--text-dim); font-size:18px; padding:4px;">✕</button>
                </div>
                <div class="search-modal-results" id="searchModalResults">
                    <div style="text-align:center; padding:30px; color:var(--text-dim); font-size:14px;">
                        اكتب اسم المنتج أو القطعة للبحث الفوري...
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("searchModal");
    const input = document.getElementById("modalSearchInput");
    const results = document.getElementById("searchModalResults");

    document.getElementById("closeSearchModal")?.addEventListener("click", () => modal.classList.remove("active"));
    
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
    });

    input?.addEventListener("input", async (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            results.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim); font-size:14px;">اكتب اسم المنتج للبحث الفوري...</div>`;
            return;
        }

        const products = await loadProductsCache();
        const matches = products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
            results.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim); font-size:14px;">لم يتم العثور على أي منتج يطابق "${query}"</div>`;
            return;
        }

        results.innerHTML = matches.slice(0, 6).map(p => `
            <a href="product.html?id=${p.id}" class="search-result-item" onclick="document.getElementById('searchModal').classList.remove('active')">
                <img src="${p.image}" alt="${p.name}">
                <div style="flex-grow:1;">
                    <div style="font-size:14px; font-weight:800; color:#fff;">${p.name}</div>
                    <div style="font-size:12px; color:var(--text-dim);">${p.category} | ${p.badge}</div>
                </div>
                <div style="font-weight:900; color:var(--primary-light); font-size:15px;">
                    ${formatDinar(p.price)}
                </div>
            </a>
        `).join("");
    });
}

function openSearchModal() {
    setupSearchModal();
    const modal = document.getElementById("searchModal");
    modal?.classList.add("active");
    setTimeout(() => document.getElementById("modalSearchInput")?.focus(), 50);
}

// ==========================================================================
// MOBILE MENU CONTROLLER
// ==========================================================================
function setupMobileMenu() {
    const hamburger = document.querySelector(".hamburger-btn");
    if (!hamburger) return;

    let mobileNav = document.getElementById("mobileNavDrawer");
    if (!mobileNav) {
        mobileNav = document.createElement("div");
        mobileNav.id = "mobileNavDrawer";
        mobileNav.style.cssText = `
            position: fixed; top: 76px; left: 0; right: 0; bottom: 0;
            background: rgba(10, 13, 20, 0.98); backdrop-filter: blur(12px);
            z-index: 1999; padding: 25px; display: none; flex-direction: column;
            gap: 15px; border-bottom: 1px solid var(--border-color);
        `;
        mobileNav.innerHTML = `
            <a href="index.html" style="font-size:18px; font-weight:800; padding:12px 0; border-bottom:1px solid var(--border-color);">🏠 الرئيسية</a>
            <a href="products.html" style="font-size:18px; font-weight:800; padding:12px 0; border-bottom:1px solid var(--border-color);">🖥️ تصفح كل المنتجات</a>
            <a href="products.html?badge=offer" style="font-size:18px; font-weight:800; color:#f87171; padding:12px 0; border-bottom:1px solid var(--border-color);">🔥 عروض اليوم والتخفيضات</a>
            <a href="account.html" style="font-size:18px; font-weight:800; padding:12px 0; border-bottom:1px solid var(--border-color);">👤 حسابي الشخصي</a>
            <a href="cart.html" style="font-size:18px; font-weight:800; padding:12px 0; border-bottom:1px solid var(--border-color);">🛒 سلة المشتريات</a>
            <a href="https://wa.me/213550123456" target="_blank" style="font-size:16px; font-weight:800; color:#34d399; padding:12px 0; border-bottom:1px solid var(--border-color);">💬 تواصل معنا عبر واتساب</a>
            <a href="admin.html" style="font-size:15px; font-weight:700; color:var(--text-dim); padding:12px 0;">⚙️ لوحة تحكم المتجر (Admin)</a>
        `;
        document.body.appendChild(mobileNav);
    }

    hamburger.addEventListener("click", () => {
        const isOpen = mobileNav.style.display === "flex";
        mobileNav.style.display = isOpen ? "none" : "flex";
        hamburger.textContent = isOpen ? "☰" : "✕";
    });
}

// Global initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    setupMiniCart();
    setupSearchModal();
    setupMobileMenu();
    updateCartBadges();

    // Attach cart open button
    document.querySelectorAll(".cart-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            // If on cart.html or checkout.html, let link work normally, otherwise open mini drawer
            const page = window.location.pathname;
            if (!page.includes("cart.html") && !page.includes("checkout.html")) {
                e.preventDefault();
                openMiniCart();
            }
        });
    });

    // Attach search open button
    document.querySelectorAll(".search-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openSearchModal();
        });
    });

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            openSearchModal();
        }
    });
});
