/* ==========================================================================
   PC STORE - KHALIL TECH | PRODUCTS CATALOG PAGE CONTROLLER
   ========================================================================== */

let catalogProducts = [];
let activeCategory = "all";
let activeBadge = "all";
let activeSort = "default";
let searchQuery = "";
let inStockOnly = false;

document.addEventListener("DOMContentLoaded", async () => {
    // Read URL parameters (e.g., from homepage category links)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("category")) {
        activeCategory = urlParams.get("category");
    }
    if (urlParams.has("badge")) {
        activeBadge = urlParams.get("badge");
        const badgeSelect = document.getElementById("badgeFilter");
        if (badgeSelect) badgeSelect.value = activeBadge;
    }
    if (urlParams.has("search")) {
        searchQuery = urlParams.get("search");
        const searchInput = document.getElementById("catalogSearch");
        if (searchInput) searchInput.value = searchQuery;
    }

    // Set active category chip
    updateCategoryChipsUi();

    // Fetch products
    catalogProducts = await apiGetProducts();
    applyCatalogFilters();

    // Attach listeners
    setupEventListeners();
});

function updateCategoryChipsUi() {
    document.querySelectorAll(".chip-btn").forEach(btn => {
        const cat = btn.dataset.category;
        if (cat === activeCategory) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function setupEventListeners() {
    // Chips click
    document.querySelectorAll(".chip-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            activeCategory = btn.dataset.category;
            updateCategoryChipsUi();
            applyCatalogFilters();
        });
    });

    // Search input
    const searchInput = document.getElementById("catalogSearch");
    let debounceTimer;
    searchInput?.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = e.target.value.trim().toLowerCase();
            applyCatalogFilters();
        }, 200);
    });

    // Badge filter
    const badgeFilter = document.getElementById("badgeFilter");
    badgeFilter?.addEventListener("change", (e) => {
        activeBadge = e.target.value;
        applyCatalogFilters();
    });

    // Price Sort
    const priceSort = document.getElementById("priceSort");
    priceSort?.addEventListener("change", (e) => {
        activeSort = e.target.value;
        applyCatalogFilters();
    });

    // In Stock toggle
    const inStockCheck = document.getElementById("inStockOnly");
    inStockCheck?.addEventListener("change", (e) => {
        inStockOnly = e.target.checked;
        applyCatalogFilters();
    });

    // Reset button
    document.getElementById("resetFiltersBtn")?.addEventListener("click", resetAllFilters);
}

function applyCatalogFilters() {
    let filtered = [...catalogProducts];

    // Category filter
    if (activeCategory && activeCategory !== "all") {
        filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Badge filter
    if (activeBadge && activeBadge !== "all") {
        if (activeBadge === "offer") {
            filtered = filtered.filter(p => p.badge === "العرض" || p.badgeType === "offer" || (p.oldPrice && p.oldPrice > p.price));
        } else if (activeBadge === "new") {
            filtered = filtered.filter(p => p.badge === "جديد" || p.badgeType === "new");
        } else if (activeBadge === "used") {
            filtered = filtered.filter(p => p.badge === "مستعمل" || p.badgeType === "used");
        }
    }

    // In Stock filter
    if (inStockOnly) {
        filtered = filtered.filter(p => p.stock > 0);
    }

    // Search Query filter
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchQuery) ||
            p.category.toLowerCase().includes(searchQuery) ||
            (p.description && p.description.toLowerCase().includes(searchQuery))
        );
    }

    // Sorting
    if (activeSort === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (activeSort === "newest") {
        filtered.sort((a, b) => b.id - a.id);
    }

    renderCatalogResults(filtered);
}

function renderCatalogResults(items) {
    const grid = document.getElementById("catalogProductsGrid");
    const emptyState = document.getElementById("catalogEmptyState");
    const countEl = document.getElementById("resultsCount");
    const resetBtn = document.getElementById("resetFiltersBtn");

    if (countEl) countEl.textContent = items.length;

    // Show reset button if any filter is active
    const isFiltered = activeCategory !== "all" || activeBadge !== "all" || searchQuery !== "" || inStockOnly || activeSort !== "default";
    if (resetBtn) resetBtn.style.display = isFiltered ? "inline-block" : "none";

    if (items.length === 0) {
        if (grid) grid.innerHTML = "";
        if (emptyState) {
            emptyState.style.display = "block";
            if (catalogProducts.length === 0) {
                emptyState.innerHTML = `
                    <div class="icon" style="font-size:44px; margin-bottom:12px;">🖥️</div>
                    <h3 style="color:#fff; font-size:18px; margin-bottom:8px;">المتجر مخصص لـ Khalil Tech - بانتظار إضافة المنتجات</h3>
                    <p style="color:var(--text-muted); font-size:14px; max-width:500px; margin:0 auto 16px; line-height:1.6;">
                        تم إفراغ المعروضات السابقة بناءً على توجيهات المالك. بإمكان الزبائن التواصل مباشرة عبر واتساب لطلب أجهزة كمبيوتر أو كروت شاشة خاصة.
                    </p>
                    <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                        <a href="https://wa.me/213550123456?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D8%AE%D9%84%D9%8A%D9%84%20%D8%AA%D9%83%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%82%D8%B7%D8%B9%D8%A9" target="_blank" class="btn btn-primary" style="background:#22c55e; border-color:#22c55e; font-size:14px; padding:8px 18px;">
                            📲 مراسلة خليل تك في واتساب
                        </a>
                        <a href="admin.html" class="btn btn-secondary" style="font-size:14px; padding:8px 18px;">
                            ⚡ دخول خليل تك لإضافة منتج
                        </a>
                    </div>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="icon">🔎</div>
                    <h3>لم نجد أي منتج يطابق خيارات البحث</h3>
                    <p>جرب كتابة مصطلح آخر، أو إزالة بعض الفلاتر المحددة.</p>
                    <button class="btn btn-secondary" onclick="resetAllFilters()">عرض كل المنتجات</button>
                `;
            }
        }
    } else {
        if (emptyState) emptyState.style.display = "none";
        if (grid) {
            grid.innerHTML = items.map(p => createProductCardHtml(p)).join("");
        }
    }
}

function resetAllFilters() {
    activeCategory = "all";
    activeBadge = "all";
    activeSort = "default";
    searchQuery = "";
    inStockOnly = false;

    const searchInput = document.getElementById("catalogSearch");
    if (searchInput) searchInput.value = "";
    const badgeSelect = document.getElementById("badgeFilter");
    if (badgeSelect) badgeSelect.value = "all";
    const sortSelect = document.getElementById("priceSort");
    if (sortSelect) sortSelect.value = "default";
    const stockCheck = document.getElementById("inStockOnly");
    if (stockCheck) stockCheck.checked = false;

    updateCategoryChipsUi();
    applyCatalogFilters();
}
