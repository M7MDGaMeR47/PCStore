/* ==========================================================================
   PC STORE - KHALIL TECH | HOMEPAGE CONTROLLER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    await initCategories();
    await initFeaturedProducts();
    await initOffersProducts();
});

// Render Categories Grid
async function initCategories() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;

    const categories = await apiGetCategories();
    grid.innerHTML = categories.map(cat => `
        <a href="products.html?category=${cat.id}" class="category-card">
            <div class="category-icon">${cat.icon || "🖥️"}</div>
            <h3>${cat.name}</h3>
            <p>${cat.desc || cat.id}</p>
            <span class="category-count">${cat.count || 0} منتجات متوفرة</span>
        </a>
    `).join("");
}

// Render Featured Products
async function initFeaturedProducts() {
    const grid = document.getElementById("featuredProductsGrid");
    if (!grid) return;

    try {
        const productsList = await apiGetProducts();
        
        if (productsList.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 45px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    <div style="font-size: 46px; margin-bottom: 14px;">🖥️</div>
                    <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px;">مرحباً بكم في متجر PC STORE - KHALIL TECH</h3>
                    <p style="color: var(--text-muted); font-size: 15px; max-width: 540px; margin: 0 auto 20px; line-height: 1.6;">
                        المتجر مخصص بالكامل لـ <strong>خليل تك (Khalil Tech)</strong>. جاري إدراج التجميعات والقطع الجديدة مع تسجيل الشرح الصوتي الخاص بكل قطعة.
                        يمكنكم التواصل فوراً مع خليل تك للاستفسار أو طلب تجميعة خاصة.
                    </p>
                    <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
                        <a href="https://wa.me/213550123456?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D8%AE%D9%84%D9%8A%D9%84%20%D8%AA%D9%83%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%AC%D9%85%D9%8A%D8%B9%D8%A9%20%D8%A3%D9%88%20%D9%82%D8%B7%D8%B9%D8%A9" target="_blank" class="btn btn-primary" style="background:#22c55e; border-color:#22c55e; font-size:15px; padding:10px 22px;">
                            📲 تواصل مع خليل تك في واتساب
                        </a>
                        <a href="admin.html" class="btn btn-secondary" style="font-size:15px; padding:10px 22px;">
                            ⚡ دخول خليل تك لإضافة المنتجات
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // Show products that are featured or top 6
        const featured = productsList.filter(p => p.featured).slice(0, 8);
        const displayList = featured.length > 0 ? featured : productsList.slice(0, 8);

        grid.innerHTML = displayList.map(p => createProductCardHtml(p)).join("");
    } catch (err) {
        console.error("Error loading featured products:", err);
    }
}

// Render Offers Section
async function initOffersProducts() {
    const grid = document.getElementById("offersProductsGrid");
    if (!grid) return;

    try {
        const productsList = await apiGetProducts();
        const offers = productsList.filter(p => p.badge === "العرض" || p.badgeType === "offer" || (p.oldPrice && p.oldPrice > p.price)).slice(0, 4);
        
        if (offers.length === 0) {
            const section = document.getElementById("offersSection");
            if (section) section.style.display = "none";
            return;
        }

        grid.innerHTML = offers.map(p => createProductCardHtml(p)).join("");
    } catch (err) {
        console.error("Error loading offers:", err);
    }
}
