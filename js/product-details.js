/* ==========================================================================
   PC STORE - KHALIL TECH | PRODUCT DETAILS CONTROLLER
   ========================================================================== */

let currentProduct = null;
let selectedQuantity = 1;

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        showProductNotFound();
        return;
    }

    try {
        currentProduct = await apiGetProduct(productId);
        if (!currentProduct) {
            showProductNotFound();
            return;
        }

        renderProductDetails(currentProduct);
        loadRelatedProducts(currentProduct);
    } catch (err) {
        console.error("Error loading product details:", err);
        showProductNotFound();
    }
});

function showProductNotFound() {
    const container = document.getElementById("productDetailsContainer");
    if (container) {
        container.innerHTML = `
            <div class="no-products-state">
                <div class="icon">⚠️</div>
                <h3>المنتج المطلوب غير متوفر أو تم حذفه</h3>
                <p>تأكد من الرابط أو تصفح الكتالوج لاكتشاف بدائل ممتازة.</p>
                <a href="products.html" class="btn btn-primary">العودة للمنتجات</a>
            </div>
        `;
    }
}

function renderProductDetails(p) {
    // Update Document Title & Breadcrumbs
    document.title = `${p.name} | PC STORE`;
    const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = p.name;

    // Badges
    let badgeClass = "badge-new";
    let badgeText = p.badge || "جديد";
    if (p.badge === "مستعمل" || p.badgeType === "used") {
        badgeClass = "badge-used";
    } else if (p.badge === "العرض" || p.badgeType === "offer") {
        badgeClass = "badge-offer";
    } else if (p.stock === 0) {
        badgeClass = "badge-out";
        badgeText = "غير متوفر";
    }

    // Discount percentage
    let discountHtml = "";
    if (p.oldPrice && p.oldPrice > p.price) {
        const percent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        discountHtml = `<span class="discount-pill" style="font-size:13px; padding:4px 9px;">توفير ${percent}%</span>`;
    }

    // Stock tag
    let stockHtml = "";
    const isOutOfStock = p.stock <= 0;
    if (isOutOfStock) {
        stockHtml = `<span class="stock-indicator out-of-stock" style="font-size:14px;"><span class="stock-dot"></span> ❌ نفذ من المخزون حالياً</span>`;
    } else if (p.stock <= 2) {
        stockHtml = `<span class="stock-indicator low-stock" style="font-size:14px;"><span class="stock-dot"></span> ⚠️ كمية محدودة جداً (متبقي ${p.stock} فقط)</span>`;
    } else {
        stockHtml = `<span class="stock-indicator in-stock" style="font-size:14px;"><span class="stock-dot"></span> ✓ متوفر في المحل وجاهز للشحن الفوري (${p.stock} قطع)</span>`;
    }

    // Images gallery
    const images = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];

    // Specifications matrix
    let specsHtml = "";
    if (p.specs && Object.keys(p.specs).length > 0) {
        specsHtml = `
            <div style="margin-top: 25px;">
                <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #ffffff;">📋 المواصفات والخصائص التقنية:</h3>
                <table class="specs-table">
                    <tbody>
                        ${Object.entries(p.specs).map(([key, val]) => `
                            <tr>
                                <td>${key}</td>
                                <td>${val}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    const container = document.getElementById("productDetailsContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="product-details-grid">
            <!-- Left: Gallery -->
            <div class="gallery-container">
                <div class="gallery-main">
                    <img id="mainGalleryImg" src="${images[0]}" alt="${p.name}">
                </div>
                ${images.length > 1 ? `
                    <div class="gallery-thumbnails">
                        ${images.map((img, idx) => `
                            <button class="thumbnail-btn ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
                                <img src="${img}" alt="Thumbnail ${idx + 1}">
                            </button>
                        `).join("")}
                    </div>
                ` : ""}
            </div>

            <!-- Right: Product Information -->
            <div class="product-details-info">
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <span class="badge ${badgeClass}" style="font-size:13px; padding:6px 14px;">${badgeText}</span>
                    <span style="color:var(--primary-light); font-weight:700; font-size:13px; text-transform:uppercase;">${p.category}</span>
                </div>

                <h1>${p.name}</h1>

                <!-- Price Box -->
                <div class="price-box">
                    <span class="price-current">${formatDinar(p.price)}</span>
                    ${p.oldPrice ? `<span class="price-old" style="font-size:17px;">${formatDinar(p.oldPrice)}</span>` : ""}
                    ${discountHtml}
                </div>

                <!-- Stock status -->
                <div>
                    ${stockHtml}
                </div>

                <!-- Description -->
                <p style="color:var(--text-muted); font-size:15px; line-height:1.8;">
                    ${p.description || "قطعة هاردوير أصلية مجربة ومفحوصة، مخصصة لتقديم أعلى أداء واستقرار للألعاب والتطبيقات الهندسية."}
                </p>

                <!-- Voice Note / Audio explanation if available -->
                ${p.audioUrl ? `
                    <div class="product-audio-box" style="background:linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(15, 23, 42, 0.95)); border:1px solid rgba(59, 130, 246, 0.4); border-radius:var(--radius-sm); padding:16px; margin:16px 0;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                            <div style="width:36px; height:36px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; font-size:18px;">🎙️</div>
                            <div>
                                <strong style="color:#93c5fd; font-size:14px; display:block;">شرح صوتي ومواصفات من صاحب المتجر</strong>
                                <span style="color:var(--text-dim); font-size:12px;">استمع لتفاصيل الفحص والحرارة والأداء بصوت البائع</span>
                            </div>
                        </div>
                        <audio controls src="${p.audioUrl}" style="width:100%; height:38px; outline:none; filter:contrast(1.2);"></audio>
                    </div>
                ` : ""}

                <!-- Actions: Quantity + Add To Cart + Quick Buy -->
                <div class="product-details-actions">
                    <div class="qty-stepper">
                        <button onclick="changeDetailQty(-1)" ${isOutOfStock ? "disabled" : ""}>-</button>
                        <span id="detailQtyVal">1</span>
                        <button onclick="changeDetailQty(1)" ${isOutOfStock ? "disabled" : ""}>+</button>
                    </div>

                    <button class="btn btn-primary" style="flex:1;" onclick="handleAddToCartClick()" ${isOutOfStock ? "disabled" : ""}>
                        🛒 أضف إلى السلة
                    </button>

                    <button class="btn btn-success" style="flex:1; background:#22c55e; border-color:#22c55e;" onclick="handleQuickBuyClick()" ${isOutOfStock ? "disabled" : ""}>
                        📲 اطلب عبر واتساب
                    </button>
                </div>

                <!-- Direct WhatsApp Inquiry Button -->
                <a href="https://wa.me/213550123456?text=${encodeURIComponent('السلام عليكم ورحمة الله، أنا مهتم بالمنتج: ' + p.name + ' (السعر: ' + Number(p.price).toLocaleString('fr-DZ') + ' دج). هل لا زال متوفراً في المحل؟')}" target="_blank" class="btn btn-outline" style="width:100%; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:8px; border-color:rgba(34, 197, 94, 0.4); color:#4ade80;">
                    💬 محادثة فورية في واتساب حول هذه القطعة
                </a>

                <!-- Trust Guarantee Box -->
                <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:16px; margin-top:15px; display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; text-align:center;">
                    <div>
                        <div style="font-size:20px; margin-bottom:4px;">🛡️</div>
                        <strong style="font-size:12px; display:block;">ضمان وتجربة</strong>
                        <span style="font-size:11px; color:var(--text-dim);">حق الفحص قبل الدفع</span>
                    </div>
                    <div>
                        <div style="font-size:20px; margin-bottom:4px;">🚚</div>
                        <strong style="font-size:12px; display:block;">شحن 58 ولاية</strong>
                        <span style="font-size:11px; color:var(--text-dim);">توصيل حتى باب المنزل</span>
                    </div>
                    <div>
                        <div style="font-size:20px; margin-bottom:4px;">💵</div>
                        <strong style="font-size:12px; display:block;">الدفع عند الاستلام</strong>
                        <span style="font-size:11px; color:var(--text-dim);">بدون دفع مسبق</span>
                    </div>
                </div>

                <!-- Specifications Table -->
                ${specsHtml}
            </div>
        </div>
    `;
}

// Switch gallery image
window.switchGalleryImage = function(src, btnEl) {
    const mainImg = document.getElementById("mainGalleryImg");
    if (mainImg) mainImg.src = src;

    document.querySelectorAll(".thumbnail-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
};

// Quantity stepper
window.changeDetailQty = function(delta) {
    if (!currentProduct) return;
    const max = currentProduct.stock || 1;
    selectedQuantity = Math.max(1, Math.min(max, selectedQuantity + delta));
    const qtyVal = document.getElementById("detailQtyVal");
    if (qtyVal) qtyVal.textContent = selectedQuantity;
};

// Handle Add to Cart
window.handleAddToCartClick = function() {
    if (!currentProduct) return;
    addToCart(currentProduct, selectedQuantity);
};

// Handle Quick Buy: Adds to cart & redirects directly to checkout
window.handleQuickBuyClick = function() {
    if (!currentProduct) return;
    addToCart(currentProduct, selectedQuantity, true);
    window.location.href = "checkout.html";
};

// Load related products
async function loadRelatedProducts(p) {
    const grid = document.getElementById("relatedProductsGrid");
    if (!grid) return;

    try {
        const allProducts = await apiGetProducts();
        const related = allProducts
            .filter(item => item.id !== p.id && (item.category === p.category || item.featured))
            .slice(0, 4);

        if (related.length === 0) {
            grid.parentElement.style.display = "none";
            return;
        }

        grid.innerHTML = related.map(item => createProductCardHtml(item)).join("");
    } catch (e) {
        console.error("Error loading related products", e);
    }
}
