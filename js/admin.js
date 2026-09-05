/* ==========================================================================
   PC STORE - KHALIL TECH | ADMIN & CASH LICENSE MANAGEMENT CONTROLLER
   ========================================================================== */

let adminToken = sessionStorage.getItem("pc_admin_token") || null;
let designerToken = sessionStorage.getItem("pc_designer_token") || null;
let currentProductsList = [];

document.addEventListener("DOMContentLoaded", () => {
    checkAdminAuth();
    setupAdminNavigation();
    setupKhalilLicenseForm();
    setupDesignerLoginForm();
    setupGenerateLicenseForm();
    setupProductForm();
    setupSettingsForm();
});

// Check Authentication & Direct to appropriate dashboard
function checkAdminAuth() {
    const loginSection = document.getElementById("adminLoginSection");
    const dashSection = document.getElementById("adminDashboardSection");
    const designerSection = document.getElementById("designerDashboardSection");
    const logoutBtn = document.getElementById("logoutBtn");

    if (designerToken) {
        if (loginSection) loginSection.style.display = "none";
        if (dashSection) dashSection.style.display = "none";
        if (designerSection) designerSection.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "inline-flex";
        loadDesignerLicenses();
    } else if (adminToken) {
        if (loginSection) loginSection.style.display = "none";
        if (dashSection) dashSection.style.display = "block";
        if (designerSection) designerSection.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-flex";
        
        // Populate license info card
        const savedLic = JSON.parse(sessionStorage.getItem("pc_khalil_license") || "null");
        if (savedLic) {
            const ownerEl = document.getElementById("licDisplayOwner");
            const codeEl = document.getElementById("licDisplayCode");
            if (ownerEl) ownerEl.textContent = savedLic.issuedTo || "خليل تك (Khalil Tech)";
            if (codeEl) codeEl.textContent = savedLic.code || "KHALIL-TECH-2026-CASH";
        }
        
        loadDashboardData();
    } else {
        if (loginSection) loginSection.style.display = "block";
        if (dashSection) dashSection.style.display = "none";
        if (designerSection) designerSection.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
    }
}

// Switch Login Tab (Khalil Tech vs Designer)
window.switchLoginTab = function(tab) {
    const khalilWrap = document.getElementById("khalilLoginFormWrap");
    const designerWrap = document.getElementById("designerLoginFormWrap");
    const khalilBtn = document.getElementById("switchKhalilLoginBtn");
    const designerBtn = document.getElementById("switchDesignerLoginBtn");

    if (tab === "khalil") {
        if (khalilWrap) khalilWrap.style.display = "block";
        if (designerWrap) designerWrap.style.display = "none";
        if (khalilBtn) {
            khalilBtn.style.background = "var(--primary)";
            khalilBtn.style.color = "#fff";
        }
        if (designerBtn) {
            designerBtn.style.background = "transparent";
            designerBtn.style.color = "var(--text-dim)";
        }
    } else {
        if (khalilWrap) khalilWrap.style.display = "none";
        if (designerWrap) designerWrap.style.display = "block";
        if (designerBtn) {
            designerBtn.style.background = "#f59e0b";
            designerBtn.style.color = "#000";
        }
        if (khalilBtn) {
            khalilBtn.style.background = "transparent";
            khalilBtn.style.color = "var(--text-dim)";
        }
    }
};

// Setup Khalil Tech License Login
function setupKhalilLicenseForm() {
    const form = document.getElementById("khalilLicenseForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const licenseKey = document.getElementById("khalilLicenseInput").value.trim();
        const password = document.getElementById("khalilPasswordInput")?.value.trim() || "";

        try {
            const res = await fetch("/api/license/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ licenseKey, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                adminToken = data.token;
                sessionStorage.setItem("pc_admin_token", adminToken);
                sessionStorage.setItem("pc_khalil_license", JSON.stringify(data.license));
                checkAdminAuth();
                showToast("أهلاً بك يا خليل تك! تم التحقق من ترخيص الحساب بنجاح.");
            } else {
                alert(data.error || "كود التفعيل غير صحيح");
            }
        } catch (err) {
            alert("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً");
        }
    });

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", () => {
        logoutAdmin();
    });
}

// Setup Designer Master Login
function setupDesignerLoginForm() {
    const form = document.getElementById("designerLoginForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("designerPassInput").value.trim();

        try {
            const res = await fetch("/api/designer/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                designerToken = data.token;
                sessionStorage.setItem("pc_designer_token", designerToken);
                checkAdminAuth();
                showToast("مرحباً بك في لوحة إدارة تراخيص المصمم!");
            } else {
                alert(data.error || "كلمة المرور غير صحيحة");
            }
        } catch (err) {
            alert("تعذر الاتصال بالخادم");
        }
    });
}

// Designer Licenses Management
window.loadDesignerLicenses = async function() {
    const tbody = document.getElementById("designerLicensesTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/designer/licenses");
        if (!res.ok) throw new Error("تعذر جلب التراخيص");
        const licenses = await res.json();

        if (licenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">لا توجد أكواد ترخيص مسجلة</td></tr>`;
            return;
        }

        tbody.innerHTML = licenses.map(l => {
            const isSuspended = l.status === "suspended";
            const isActive = l.status === "active";
            const isAvailable = l.status === "available";

            let statusHtml = "";
            if (isActive) statusHtml = `<span class="badge badge-offer" style="background:#22c55e; color:#052e16;">🟢 مفعل حالياً</span>`;
            else if (isAvailable) statusHtml = `<span class="badge badge-new" style="background:#3b82f6; color:#fff;">🔵 جاهز للتسليم</span>`;
            else statusHtml = `<span class="badge badge-out" style="background:#ef4444; color:#fff;">🔴 موقوف</span>`;

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <code style="background:#0f172a; padding:4px 8px; border-radius:4px; font-weight:800; color:#fbbf24; font-size:14px;">${l.code}</code>
                            <button onclick="copyToClipboard('${l.code}')" class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:11px;" title="نسخ الكود">📋 نسخ</button>
                        </div>
                    </td>
                    <td><strong>${l.issuedTo}</strong></td>
                    <td><span style="color:#22c55e; font-weight:700; font-size:12px;">💵 ${l.paymentType || "Cash"}</span></td>
                    <td>${statusHtml}</td>
                    <td><span style="font-size:12px; color:var(--text-dim);">${new Date(l.createdAt).toLocaleDateString("fr-DZ")}</span></td>
                    <td><span style="font-size:12px; color:var(--text-muted);">${l.notes || "--"}</span></td>
                    <td>
                        <button onclick="toggleLicenseStatus('${l.code}')" class="btn btn-sm ${isSuspended ? 'btn-success' : 'btn-danger'}" style="font-size:11px; padding:4px 8px;">
                            ${isSuspended ? "تفعيل الكود" : "إيقاف مؤقت"}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Error loading licenses", err);
    }
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`تم نسخ الكود: ${text}`);
    }).catch(() => {
        prompt("انسخ الكود التالي:", text);
    });
};

window.toggleLicenseStatus = async function(code) {
    try {
        const res = await fetch("/api/designer/licenses/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });
        if (res.ok) {
            showToast("تم تحديث حالة الكود بنجاح");
            loadDesignerLicenses();
        }
    } catch (e) {
        alert("خطأ في تحديث الترخيص");
    }
};

// Generate License Modal Handlers
window.openGenerateLicenseModal = function() {
    const modal = document.getElementById("generateLicenseModal");
    if (modal) modal.classList.add("active");
};

window.closeGenerateLicenseModal = function() {
    const modal = document.getElementById("generateLicenseModal");
    if (modal) modal.classList.remove("active");
};

function setupGenerateLicenseForm() {
    const form = document.getElementById("generateLicenseForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const issuedTo = document.getElementById("newLicIssuedTo").value.trim();
        const paymentType = document.getElementById("newLicPaymentType").value.trim();
        const notes = document.getElementById("newLicNotes").value.trim();

        try {
            const res = await fetch("/api/designer/licenses/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issuedTo, paymentType, notes })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                closeGenerateLicenseModal();
                loadDesignerLicenses();
                copyToClipboard(data.license.code);
                showToast(`تم توليد كود الترخيص بنجاح: ${data.license.code} وتم نسخه إلى الحافظة!`);
            } else {
                alert("فشل توليد الكود");
            }
        } catch (err) {
            alert("خطأ في الاتصال بالخادم");
        }
    });
}

window.logoutAdmin = function() {
    sessionStorage.removeItem("pc_admin_token");
    sessionStorage.removeItem("pc_designer_token");
    sessionStorage.removeItem("pc_khalil_license");
    adminToken = null;
    designerToken = null;
    checkAdminAuth();
    showToast("تم تسجيل الخروج");
};

// Setup Admin Tab Navigation
function setupAdminNavigation() {
    const tabBtns = document.querySelectorAll(".admin-nav-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const targetId = btn.dataset.tab;
            document.querySelectorAll(".admin-tab-content").forEach(c => {
                c.style.display = c.id === targetId ? "block" : "none";
            });

            if (targetId === "ordersTab") loadAdminOrders();
            if (targetId === "productsTab") loadAdminProducts();
            if (targetId === "usersTab") loadAdminUsers();
            if (targetId === "deliveryTab") loadAdminWilayas();
            if (targetId === "settingsTab") loadAdminSettings();
        });
    });

    // Orders status filter change
    document.getElementById("adminOrderFilter")?.addEventListener("change", (e) => {
        loadAdminOrders(e.target.value);
    });

    // Products search input
    document.getElementById("adminProductSearch")?.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        renderAdminProductsTable(currentProductsList.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
    });

    // Open add product modal
    document.getElementById("openAddProductModalBtn")?.addEventListener("click", () => {
        openProductModal();
    });
}

// Load All Dashboard Data
async function loadDashboardData() {
    await loadAdminStats();
    await loadAdminOrders();
}

// Load Stats
async function loadAdminStats() {
    try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const stats = await res.json();

        const totalOrdersEl = document.getElementById("statTotalOrders");
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;

        const totalProductsEl = document.getElementById("statTotalProducts");
        if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts || 0;

        const pendingOrdersEl = document.getElementById("statPendingOrders");
        if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pendingOrders || 0;

        const totalSalesEl = document.getElementById("statTotalSales");
        if (totalSalesEl) totalSalesEl.textContent = formatDinar(stats.totalRevenue || 0);

        const lowStockEl = document.getElementById("statLowStock");
        if (lowStockEl) lowStockEl.textContent = (stats.lowStockCount || 0) + (stats.outOfStockCount || 0);
    } catch (e) {
        console.error("Failed to load stats", e);
    }
}

// Load Orders
async function loadAdminOrders(status = "all") {
    const tbody = document.getElementById("adminOrdersTableBody");
    if (!tbody) return;

    try {
        const url = `/api/orders${status !== "all" ? "?status=" + encodeURIComponent(status) : ""}`;
        const res = await fetch(url);
        const orders = await res.json();

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-dim);">لا توجد طلبات مسجلة حالياً</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => {
            let statusBadge = "badge-new";
            if (o.status === "تم استلام الطلب") statusBadge = "badge-offer";
            else if (o.status === "قيد التحضير") statusBadge = "badge-used";
            else if (o.status === "خرج للتوصيل") statusBadge = "badge-new";
            else if (o.status === "تم التوصيل") statusBadge = "badge-new";
            else if (o.status === "ملغى") statusBadge = "badge-out";

            const cleanPhone = (o.customer.phone || "").replace(/\s+/g, "").replace(/^0/, "");
            const waText = encodeURIComponent(`السلام عليكم ورحمة الله أخي ${o.customer.name}، معك صاحب متجر PC STORE - KHALIL TECH بخصوص طلبك رقم #${o.orderCode}.`);

            return `
                <tr>
                    <td><strong>#${o.orderCode}</strong><br><span style="font-size:11px; color:var(--text-dim);">${new Date(o.createdAt).toLocaleDateString("fr-DZ")}</span></td>
                    <td><strong>${o.customer.name}</strong></td>
                    <td>
                        <a href="tel:${o.customer.phone}" style="color:var(--primary-light); font-weight:700;">${o.customer.phone}</a>
                    </td>
                    <td>
                        <div style="font-size:13px; font-weight:600;">${o.customer.wilaya || o.customer.wilayaName || o.customer.wilayaCode || ""}</div>
                        <div style="font-size:11px; color:var(--text-dim); max-width:180px;">${o.customer.address || o.customer.commune || ""}</div>
                    </td>
                    <td>
                        <div style="font-size:12px; max-width:200px;">
                            ${(o.items || []).map(i => `${i.quantity}x ${i.name}`).join("<br>")}
                        </div>
                    </td>
                    <td><strong style="color:var(--primary-light);">${formatDinar(o.total)}</strong></td>
                    <td>
                        ${o.customer.notes ? `
                            <div style="font-size:12px; color:#4ade80; background:rgba(34, 197, 94, 0.1); border:1px solid rgba(34, 197, 94, 0.3); padding:4px 8px; border-radius:4px; max-width:180px; word-break:break-word;">
                                💬 "${o.customer.notes}"
                            </div>
                        ` : `<span style="color:var(--text-dim); font-size:12px;">--</span>`}
                    </td>
                    <td><span class="badge ${statusBadge}">${o.status}</span></td>
                    <td>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <a href="https://wa.me/213${cleanPhone}?text=${waText}" target="_blank" class="btn btn-success btn-sm" style="background:#22c55e; border-color:#22c55e; font-size:11px; padding:4px 8px; text-align:center;">
                                📲 محادثة في واتساب
                            </a>
                            <select onchange="updateOrderStatus(${o.id}, this.value)" class="filter-select" style="padding:4px 8px; font-size:11px;">
                                <option value="تم استلام الطلب" ${o.status === "تم استلام الطلب" ? "selected" : ""}>تم استلام الطلب</option>
                                <option value="تم تأكيد الطلب" ${o.status === "تم تأكيد الطلب" ? "selected" : ""}>تم تأكيد الطلب</option>
                                <option value="قيد التحضير" ${o.status === "قيد التحضير" ? "selected" : ""}>قيد التحضير</option>
                                <option value="خرج للتوصيل" ${o.status === "خرج للتوصيل" ? "selected" : ""}>خرج للتوصيل</option>
                                <option value="تم التوصيل" ${o.status === "تم التوصيل" ? "selected" : ""}>تم التوصيل</option>
                                <option value="ملغى" ${o.status === "ملغى" ? "selected" : ""}>ملغى</option>
                            </select>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (e) {
        console.error("Error loading orders", e);
    }
}

// Load Registered Users (Customers)
window.loadAdminUsers = async function() {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("تعذر جلب المستخدمين");
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">لا يوجد مستخدمون مسجلون حالياً</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map((u, idx) => {
            const cleanPhone = (u.phone || "").replace(/\s+/g, "").replace(/^0/, "");
            const waGreeting = encodeURIComponent(`السلام عليكم ${u.name}، مرحباً بك في متجر PC STORE - KHALIL TECH!`);

            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>
                        <strong>${u.name}</strong>
                        ${u.role === "admin" ? `<span class="badge badge-offer" style="margin-right:6px; font-size:10px;">مدير</span>` : ""}
                    </td>
                    <td>
                        <a href="tel:${u.phone}" style="color:var(--primary-light); font-weight:700;">${u.phone || "--"}</a>
                    </td>
                    <td>${u.wilaya || "--"}</td>
                    <td><span style="font-size:12px; color:var(--text-muted);">${u.address || "--"}</span></td>
                    <td><span style="font-size:12px; color:var(--text-dim);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-DZ") : "--"}</span></td>
                    <td>
                        ${cleanPhone ? `
                            <a href="https://wa.me/213${cleanPhone}?text=${waGreeting}" target="_blank" class="btn btn-success btn-sm" style="background:#22c55e; border-color:#22c55e; font-size:12px; padding:5px 10px;">
                                💬 مراسلة واتساب
                            </a>
                        ` : `<span style="color:var(--text-dim);">--</span>`}
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("Error loading users", err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f87171; padding:20px;">خطأ في تحميل المستخدمين</td></tr>`;
    }
};

// Update Order Status
window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast(`تم تحديث الطلب إلى: ${newStatus}`);
            loadAdminStats();
        } else {
            alert("فشل تحديث الحالة");
        }
    } catch (e) {
        alert("خطأ في الاتصال بالخادم");
    }
};

// Load Products
async function loadAdminProducts() {
    try {
        currentProductsList = await apiGetProducts();
        renderAdminProductsTable(currentProductsList);
    } catch (e) {
        console.error("Error loading products", e);
    }
}

function renderAdminProductsTable(products) {
    const tbody = document.getElementById("adminProductsTableBody");
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:50px 20px;">
                    <div style="font-size:48px; margin-bottom:12px;">🖥️</div>
                    <h3 style="color:#fff; font-size:18px; font-weight:800; margin-bottom:6px;">المتجر فارغ وجاهز لعرض منتجاتك يا خليل تك!</h3>
                    <p style="color:var(--text-dim); font-size:14px; max-width:480px; margin:0 auto 20px; line-height:1.6;">
                        تم إفراغ كافة المنتجات السابقة بناءً على طلبك. يمكنك الآن البدء في إضافة أجهزة الكمبيوتر والتجميعات والكروت الخاصة بك مع تسجيل شرح صوتي لكل قطعة ليسمعه زبائنك مباشرة.
                    </p>
                    <button onclick="openProductModal()" class="btn btn-primary" style="font-size:15px; padding:10px 24px;">
                        + أضف أول منتج الآن
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const hasAudio = Boolean(p.audioUrl);
        return `
        <tr>
            <td>
                <img src="${p.image}" alt="${p.name}" style="width:45px; height:45px; object-fit:contain; background:#080a0f; border-radius:6px; padding:2px;">
            </td>
            <td>
                <strong>${p.name}</strong>
                ${p.isOffer ? `<span class="badge badge-offer" style="margin-right:6px; font-size:10px;">🔥 عرض خاص</span>` : ""}
            </td>
            <td><span style="color:var(--primary-light); font-weight:700; font-size:12px;">${p.category}</span></td>
            <td>
                <strong>${formatDinar(p.price)}</strong>
                ${p.oldPrice ? `<div style="font-size:11px; color:var(--text-dim); text-decoration:line-through;">${formatDinar(p.oldPrice)}</div>` : ""}
            </td>
            <td>
                <span class="badge ${p.badge === 'العرض' ? 'badge-offer' : p.badge === 'مستعمل' ? 'badge-used' : 'badge-new'}">
                    ${p.badge}
                </span>
            </td>
            <td>
                ${hasAudio ? `
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="color:#38bdf8; font-size:12px; font-weight:700;">🎙️ متوفر</span>
                        <button onclick="playAdminAudio('${p.audioUrl}')" class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:11px;" title="تشغيل الشرح الصوتي">▶ استماع</button>
                    </div>
                ` : `<span style="color:var(--text-dim); font-size:12px;">بدون صوت</span>`}
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button onclick="quickChangeStock(${p.id}, -1)" style="width:24px; height:24px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:4px;">-</button>
                    <strong style="${p.stock === 0 ? 'color:#ef4444;' : p.stock <= 2 ? 'color:#f59e0b;' : 'color:#10b981;'}">${p.stock}</strong>
                    <button onclick="quickChangeStock(${p.id}, 1)" style="width:24px; height:24px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:4px;">+</button>
                </div>
            </td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button onclick="editProductModal(${p.id})" class="btn btn-secondary btn-sm" title="تعديل">✏️</button>
                    <button onclick="deleteProduct(${p.id})" class="btn btn-danger btn-sm" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>
    `;
    }).join("");
}

window.playAdminAudio = function(audioUrl) {
    if (!audioUrl) return;
    const a = new Audio(audioUrl);
    a.play().catch(() => alert("تعذر تشغيل الملف الصوتي"));
};

// Quick Change Stock
window.quickChangeStock = async function(productId, delta) {
    const product = currentProductsList.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, (product.stock || 0) + delta);
    try {
        const res = await fetch(`/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: newStock })
        });
        if (res.ok) {
            product.stock = newStock;
            renderAdminProductsTable(currentProductsList);
            loadAdminStats();
            showToast(`تم تحديث مخزون "${product.name}" إلى ${newStock}`);
        }
    } catch (e) {
        alert("فشل تحديث المخزون");
    }
};

// Delete Product
window.deleteProduct = async function(productId) {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟")) return;

    try {
        const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
        if (res.ok) {
            currentProductsList = currentProductsList.filter(p => p.id !== productId);
            renderAdminProductsTable(currentProductsList);
            loadAdminStats();
            showToast("تم حذف المنتج بنجاح");
        } else {
            alert("فشل حذف المنتج");
        }
    } catch (e) {
        alert("خطأ في الاتصال بالخادم");
    }
};

// Media and Audio Recording Handlers
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

window.toggleAudioRecording = async function() {
    const recordBtn = document.getElementById("recordAudioBtn");
    const indicator = document.getElementById("recordingIndicator");
    const preview = document.getElementById("modalAudioPreviewPlayer");
    const clearBtn = document.getElementById("clearAudioBtn");
    const audioUrlInput = document.getElementById("modalProductAudioUrl");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    audioUrlInput.value = base64Audio;
                    preview.src = base64Audio;
                    preview.style.display = "block";
                    clearBtn.style.display = "inline-block";
                    showToast("تم تسجيل وحفظ المقطع الصوتي بنجاح 🎙️");
                };
                reader.readAsDataURL(audioBlob);

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            if (recordBtn) {
                recordBtn.textContent = "⏹️ إنهاء وحفظ التسجيل";
                recordBtn.classList.remove("btn-outline");
                recordBtn.classList.add("btn-danger");
            }
            if (indicator) indicator.style.display = "block";
        } catch (err) {
            alert("تعذر الوصول إلى المايكروفون. يرجى التأكد من تفعيل إذن المايكروفون في المتصفح.");
            console.error("Microphone access error:", err);
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        isRecording = false;
        if (recordBtn) {
            recordBtn.textContent = "🔴 تسجيل بالمايك";
            recordBtn.classList.remove("btn-danger");
            recordBtn.classList.add("btn-outline");
        }
        if (indicator) indicator.style.display = "none";
    }
};

window.handleAdminAudioUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
        alert("يرجى اختيار ملف صوتي صحيح");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const audioUrlInput = document.getElementById("modalProductAudioUrl");
        if (audioUrlInput) audioUrlInput.value = dataUrl;

        const preview = document.getElementById("modalAudioPreviewPlayer");
        if (preview) {
            preview.src = dataUrl;
            preview.style.display = "block";
        }
        const clearBtn = document.getElementById("clearAudioBtn");
        if (clearBtn) clearBtn.style.display = "inline-block";
        showToast("تم رفع المقطع الصوتي بنجاح 🎵");
    };
    reader.readAsDataURL(file);
};

window.clearRecordedAudio = function() {
    const audioUrlInput = document.getElementById("modalProductAudioUrl");
    if (audioUrlInput) audioUrlInput.value = "";

    const preview = document.getElementById("modalAudioPreviewPlayer");
    if (preview) {
        preview.pause();
        preview.src = "";
        preview.style.display = "none";
    }
    const clearBtn = document.getElementById("clearAudioBtn");
    if (clearBtn) clearBtn.style.display = "none";
    showToast("تم مسح التسجيل الصوتي");
};

window.handleAdminImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("يرجى اختيار ملف صورة صحيح");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("modalProductImage").value = e.target.result;
        showToast("تم تحديد الصورة بنجاح 🖼️");
    };
    reader.readAsDataURL(file);
};

// Product Modal Controllers
window.openProductModal = function() {
    const titleEl = document.getElementById("productModalTitle");
    if (titleEl) titleEl.textContent = "إضافة منتج جديد";
    const idInput = document.getElementById("modalProductId");
    if (idInput) idInput.value = "";
    document.getElementById("productForm")?.reset();
    const stockInput = document.getElementById("modalProductStock");
    if (stockInput) stockInput.value = "1";
    const imgInput = document.getElementById("modalProductImage");
    if (imgInput) imgInput.value = "image/pc1.jpg";
    const offerCheck = document.getElementById("modalProductIsOffer");
    if (offerCheck) offerCheck.checked = false;
    const audioInput = document.getElementById("modalProductAudioUrl");
    if (audioInput) audioInput.value = "";

    const preview = document.getElementById("modalAudioPreviewPlayer");
    if (preview) {
        preview.pause();
        preview.src = "";
        preview.style.display = "none";
    }
    const clearBtn = document.getElementById("clearAudioBtn");
    if (clearBtn) clearBtn.style.display = "none";

    document.getElementById("productModal")?.classList.add("active");
};

window.closeProductModal = function() {
    if (isRecording && mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        isRecording = false;
    }
    document.getElementById("productModal")?.classList.remove("active");
};

window.editProductModal = function(productId) {
    const p = currentProductsList.find(item => item.id === productId);
    if (!p) return;

    const titleEl = document.getElementById("productModalTitle");
    if (titleEl) titleEl.textContent = "تعديل بيانات المنتج";
    const idInput = document.getElementById("modalProductId");
    if (idInput) idInput.value = p.id;
    const nameInput = document.getElementById("modalProductName");
    if (nameInput) nameInput.value = p.name;
    const catInput = document.getElementById("modalProductCategory");
    if (catInput) catInput.value = p.category;
    const badgeInput = document.getElementById("modalProductBadge");
    if (badgeInput) badgeInput.value = p.badge || "جديد";
    const isOfferInput = document.getElementById("modalProductIsOffer");
    if (isOfferInput) isOfferInput.checked = Boolean(p.isOffer || p.badge === "العرض");
    const priceInput = document.getElementById("modalProductPrice");
    if (priceInput) priceInput.value = p.price;
    const oldPriceInput = document.getElementById("modalProductOldPrice");
    if (oldPriceInput) oldPriceInput.value = p.oldPrice || "";
    const stockInput = document.getElementById("modalProductStock");
    if (stockInput) stockInput.value = p.stock !== undefined ? p.stock : 1;
    const imgInput = document.getElementById("modalProductImage");
    if (imgInput) imgInput.value = p.image || "";
    const descInput = document.getElementById("modalProductDesc");
    if (descInput) descInput.value = p.description || "";
    const audioInput = document.getElementById("modalProductAudioUrl");
    if (audioInput) audioInput.value = p.audioUrl || "";

    const preview = document.getElementById("modalAudioPreviewPlayer");
    const clearBtn = document.getElementById("clearAudioBtn");
    if (p.audioUrl) {
        if (preview) {
            preview.src = p.audioUrl;
            preview.style.display = "block";
        }
        if (clearBtn) clearBtn.style.display = "inline-block";
    } else {
        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }
        if (clearBtn) clearBtn.style.display = "none";
    }

    // Parse specs into lines
    const specsInput = document.getElementById("modalProductSpecs");
    if (specsInput) {
        if (p.specs && typeof p.specs === "object") {
            const lines = Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join("\n");
            specsInput.value = lines;
        } else {
            specsInput.value = "";
        }
    }

    document.getElementById("productModal")?.classList.add("active");
};

function setupProductForm() {
    const form = document.getElementById("productForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("modalProductId").value;
        const name = document.getElementById("modalProductName").value.trim();
        const category = document.getElementById("modalProductCategory").value;
        let badge = document.getElementById("modalProductBadge").value;
        const isOffer = document.getElementById("modalProductIsOffer").checked;
        if (isOffer) {
            badge = "العرض";
        }

        const price = Number(document.getElementById("modalProductPrice").value);
        const oldPriceVal = document.getElementById("modalProductOldPrice").value;
        const oldPrice = oldPriceVal ? Number(oldPriceVal) : null;
        const stock = Number(document.getElementById("modalProductStock").value);
        const image = document.getElementById("modalProductImage").value.trim() || "image/pc1.jpg";
        const description = document.getElementById("modalProductDesc").value.trim();
        const specsText = document.getElementById("modalProductSpecs").value.trim();
        const audioUrl = document.getElementById("modalProductAudioUrl").value.trim() || null;

        // Parse specs text into key-value object
        const specs = {};
        if (specsText) {
            specsText.split("\n").forEach(line => {
                const parts = line.split(":");
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join(":").trim();
                    if (key && val) specs[key] = val;
                }
            });
        }

        const payload = {
            name,
            category,
            badge,
            isOffer,
            price,
            oldPrice,
            stock,
            image,
            description,
            specs,
            audioUrl
        };

        try {
            const url = id ? `/api/products/${id}` : "/api/products";
            const method = id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                closeProductModal();
                showToast(id ? "تم تعديل المنتج بنجاح" : "تم نشر المنتج الجديد بنجاح");
                loadAdminProducts();
                loadAdminStats();
            } else {
                const err = await res.json();
                alert(err.error || "فشل حفظ المنتج");
            }
        } catch (err) {
            alert("خطأ في الاتصال بالخادم");
        }
    });
}

// Wilayas Delivery Rates Management
async function loadAdminWilayas() {
    const tbody = document.getElementById("adminWilayasTableBody");
    if (!tbody) return;

    try {
        const wilayas = await apiGetWilayas();
        tbody.innerHTML = wilayas.map(w => `
            <tr>
                <td><strong>${w.code}</strong></td>
                <td>${w.name}</td>
                <td>
                    <input type="number" id="fee_${w.code}" value="${w.deliveryFee}" class="form-control" style="max-width:120px; font-size:13px; padding:6px 10px;">
                </td>
                <td>
                    <span class="badge ${w.active ? 'badge-new' : 'badge-out'}">${w.active ? 'نشط' : 'معطل'}</span>
                </td>
                <td>
                    <button onclick="saveWilayaFee('${w.code}')" class="btn btn-primary btn-sm">حفظ السعر 💾</button>
                </td>
            </tr>
        `).join("");
    } catch (e) {
        console.error("Error loading wilayas", e);
    }
}

window.saveWilayaFee = async function(code) {
    const input = document.getElementById(`fee_${code}`);
    if (!input) return;
    const fee = Number(input.value);

    try {
        const res = await fetch(`/api/wilayas/${code}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deliveryFee: fee })
        });
        if (res.ok) {
            showToast(`تم تحديث سعر التوصيل لولاية ${code} إلى ${fee} DA`);
        } else {
            alert("فشل تحديث سعر التوصيل");
        }
    } catch (e) {
        alert("خطأ في الاتصال بالخادم");
    }
};

// Store Settings
async function loadAdminSettings() {
    try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById("settingStoreName").value = data.storeName || "";
        document.getElementById("settingPhone").value = data.phone || "";
        document.getElementById("settingWhatsapp").value = data.whatsapp || "";
        document.getElementById("settingFacebook").value = data.facebookUrl || "";
        document.getElementById("settingAnnouncement").value = data.announcement || "";
    } catch (e) {
        console.error("Error loading settings", e);
    }
}

function setupSettingsForm() {
    const form = document.getElementById("storeSettingsForm");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            storeName: document.getElementById("settingStoreName").value.trim(),
            phone: document.getElementById("settingPhone").value.trim(),
            whatsapp: document.getElementById("settingWhatsapp").value.trim(),
            facebookUrl: document.getElementById("settingFacebook").value.trim(),
            announcement: document.getElementById("settingAnnouncement").value.trim()
        };

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("تم حفظ إعدادات المتجر بنجاح");
            } else {
                alert("فشل حفظ الإعدادات");
            }
        } catch (e) {
            alert("خطأ في الاتصال بالخادم");
        }
    });
}
