/* ==========================================================================
   PC STORE - KHALIL TECH | AUTH & USER ACCOUNTS SYSTEM
   ========================================================================== */

const AUTH_STORAGE_KEY = "pc_store_user_session";

// Get current session
function getAuthSession() {
    try {
        const data = localStorage.getItem(AUTH_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

// Save session
function setAuthSession(user, token) {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
        updateAuthUI();
    } catch (e) {
        console.error("Error saving auth session:", e);
    }
}

// Clear session
function clearAuthSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateAuthUI();
}

// Check logged in
function isLoggedIn() {
    return !!getAuthSession();
}

// Check if current user is admin
function isAdminUser() {
    const session = getAuthSession();
    return session && session.user && session.user.role === "admin";
}

// Current logged in user object
function getLoggedInUser() {
    const session = getAuthSession();
    return session ? session.user : null;
}

// API: Register new account
async function apiRegister(data) {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || "فشل تسجيل الحساب");
    }
    setAuthSession(json.user, json.token);
    return json;
}

// API: Login
async function apiLogin(login, password) {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || "فشل تسجيل الدخول");
    }
    setAuthSession(json.user, json.token);
    return json;
}

// API: Update Profile
async function apiUpdateProfile(data) {
    const session = getAuthSession();
    if (!session) throw new Error("يجب تسجيل الدخول أولاً");
    
    const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({ ...data, id: session.user.id })
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || "فشل تحديث البيانات");
    }
    setAuthSession(json.user, session.token);
    return json;
}

// Open Auth Modal (Login / Register)
function openAuthModal(mode = "login") {
    let modal = document.getElementById("authModal");
    if (!modal) {
        modal = createAuthModalElement();
        document.body.appendChild(modal);
    }
    modal.style.display = "flex";
    switchAuthTab(mode);
}

// Close Auth Modal
function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

// Switch between Login and Register tabs
function switchAuthTab(tab) {
    const loginForm = document.getElementById("authLoginForm");
    const regForm = document.getElementById("authRegisterForm");
    const loginTabBtn = document.getElementById("authLoginTabBtn");
    const regTabBtn = document.getElementById("authRegTabBtn");
    const errorEl = document.getElementById("authModalError");

    if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
    }

    if (tab === "login") {
        if (loginForm) loginForm.style.display = "block";
        if (regForm) regForm.style.display = "none";
        if (loginTabBtn) loginTabBtn.classList.add("active");
        if (regTabBtn) regTabBtn.classList.remove("active");
    } else {
        if (loginForm) loginForm.style.display = "none";
        if (regForm) regForm.style.display = "block";
        if (loginTabBtn) loginTabBtn.classList.remove("active");
        if (regTabBtn) regTabBtn.classList.add("active");
    }
}

// Create the Auth Modal HTML
function createAuthModalElement() {
    const div = document.createElement("div");
    div.id = "authModal";
    div.className = "auth-modal-overlay";
    div.innerHTML = `
        <div class="auth-modal-content" onclick="event.stopPropagation()">
            <button class="auth-modal-close" onclick="closeAuthModal()">✕</button>
            <div class="auth-modal-header">
                <div class="logo-icon" style="margin:0 auto 10px; width:45px; height:45px; font-size:22px;">⚡</div>
                <h3>حساب المستخدم | PC STORE</h3>
                <p>سجل حسابك لحفظ معلوماتك والطلب بسرعة عبر واتساب وإدارة متجرك</p>
            </div>

            <div class="auth-tabs">
                <button type="button" id="authLoginTabBtn" class="auth-tab active" onclick="switchAuthTab('login')">تسجيل الدخول</button>
                <button type="button" id="authRegTabBtn" class="auth-tab" onclick="switchAuthTab('register')">فتح حساب جديد</button>
            </div>

            <div id="authModalError" class="auth-error-box" style="display:none;"></div>

            <!-- LOGIN FORM -->
            <form id="authLoginForm" onsubmit="handleModalLogin(event)">
                <div class="form-group" style="margin-bottom:14px;">
                    <label>رقم الهاتف أو البريد الإلكتروني</label>
                    <input type="text" id="modalLoginId" class="form-control" placeholder="0550123456 أو admin" required>
                </div>
                <div class="form-group" style="margin-bottom:18px;">
                    <label>كلمة المرور</label>
                    <input type="password" id="modalLoginPass" class="form-control" placeholder="••••••••" required>
                </div>
                <button type="submit" id="modalLoginSubmitBtn" class="btn btn-primary" style="width:100%;">دخول إلى الحساب 🚀</button>
                <div style="margin-top:14px; text-align:center; font-size:13px; color:var(--text-dim);">
                    ليس لديك حساب؟ <a href="javascript:void(0)" onclick="switchAuthTab('register')" style="color:var(--primary-light); font-weight:700;">أنشئ حساباً مجاناً</a>
                </div>
            </form>

            <!-- REGISTER FORM -->
            <form id="authRegisterForm" style="display:none;" onsubmit="handleModalRegister(event)">
                <div class="form-group" style="margin-bottom:12px;">
                    <label>الاسم واللقب <span>*</span></label>
                    <input type="text" id="modalRegName" class="form-control" placeholder="مثال: أمين بن علي" required>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                    <div class="form-group">
                        <label>رقم الهاتف <span>*</span></label>
                        <input type="tel" id="modalRegPhone" class="form-control" placeholder="0550123456" required>
                    </div>
                    <div class="form-group">
                        <label>الولاية</label>
                        <input type="text" id="modalRegWilaya" class="form-control" placeholder="مثال: غليزان">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>العنوان الكامل</label>
                    <input type="text" id="modalRegAddress" class="form-control" placeholder="الحي، الشارع، البلدية...">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label>كلمة المرور <span>*</span></label>
                    <input type="password" id="modalRegPass" class="form-control" placeholder="4 خانات على الأقل" minlength="4" required>
                </div>
                <button type="submit" id="modalRegSubmitBtn" class="btn btn-primary" style="width:100%;">إنشاء الحساب الآن ✨</button>
                <div style="margin-top:14px; text-align:center; font-size:13px; color:var(--text-dim);">
                    لديك حساب بالفعل؟ <a href="javascript:void(0)" onclick="switchAuthTab('login')" style="color:var(--primary-light); font-weight:700;">سجل الدخول</a>
                </div>
            </form>
        </div>
    `;

    div.addEventListener("click", (e) => {
        if (e.target === div) closeAuthModal();
    });

    return div;
}

// Handle Login in Modal
async function handleModalLogin(e) {
    e.preventDefault();
    const loginVal = document.getElementById("modalLoginId").value.trim();
    const passVal = document.getElementById("modalLoginPass").value.trim();
    const btn = document.getElementById("modalLoginSubmitBtn");
    const errorEl = document.getElementById("authModalError");

    btn.disabled = true;
    btn.textContent = "جاري التحقق...";
    errorEl.style.display = "none";

    try {
        const res = await apiLogin(loginVal, passVal);
        closeAuthModal();
        if (typeof showToast === "function") {
            showToast(`أهلاً بك يا ${res.user.name} 👋`, "success");
        }
        // If on admin or checkout, optionally reload or autofill
        if (window.location.pathname.includes("checkout")) {
            if (typeof autoFillUserCheckout === "function") autoFillUserCheckout();
        } else if (res.user.role === "admin" && !window.location.pathname.includes("admin")) {
            // Can offer quick jump to admin
            showToast("تم تسجيل الدخول بصلاحية الإدارة!", "success");
        }
        updateAuthUI();
    } catch (err) {
        errorEl.textContent = err.message || "فشل تسجيل الدخول";
        errorEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.textContent = "دخول إلى الحساب 🚀";
    }
}

// Handle Register in Modal
async function handleModalRegister(e) {
    e.preventDefault();
    const name = document.getElementById("modalRegName").value.trim();
    const phone = document.getElementById("modalRegPhone").value.trim();
    const wilaya = document.getElementById("modalRegWilaya").value.trim();
    const address = document.getElementById("modalRegAddress").value.trim();
    const password = document.getElementById("modalRegPass").value.trim();
    const btn = document.getElementById("modalRegSubmitBtn");
    const errorEl = document.getElementById("authModalError");

    btn.disabled = true;
    btn.textContent = "جاري إنشاء الحساب...";
    errorEl.style.display = "none";

    try {
        const res = await apiRegister({ name, phone, wilaya, address, password });
        closeAuthModal();
        if (typeof showToast === "function") {
            showToast(`تم فتح حسابك بنجاح! مرحباً بك ${res.user.name}`, "success");
        }
        if (window.location.pathname.includes("checkout")) {
            if (typeof autoFillUserCheckout === "function") autoFillUserCheckout();
        }
        updateAuthUI();
    } catch (err) {
        errorEl.textContent = err.message || "فشل إنشاء الحساب";
        errorEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.textContent = "إنشاء الحساب الآن ✨";
    }
}

// Update UI in Navbar & everywhere
function updateAuthUI() {
    const session = getAuthSession();
    const user = session ? session.user : null;

    // Containers with class "auth-nav-slot" or ID "authNavBtn"
    const navSlots = document.querySelectorAll(".auth-nav-slot, #authNavBtn");

    navSlots.forEach(slot => {
        if (!user) {
            slot.innerHTML = `
                <button type="button" class="btn btn-outline btn-sm auth-trigger-btn" onclick="openAuthModal('register')">
                    👤 فتح حساب / دخول
                </button>
            `;
        } else {
            const isAdmin = user.role === "admin";
            slot.innerHTML = `
                <div class="user-profile-menu">
                    <button type="button" class="user-menu-btn" onclick="toggleUserDropdown(this)">
                        <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
                        <span class="user-display-name">${user.name}</span>
                        <span style="font-size:10px; opacity:0.7;">▼</span>
                    </button>
                    <div class="user-dropdown-card">
                        <div class="user-dropdown-header">
                            <strong>${user.name}</strong>
                            <span>${user.phone || user.email || "حساب مسجل"}</span>
                            ${isAdmin ? `<span class="badge badge-offer" style="display:inline-block; margin-top:4px; font-size:11px; padding:2px 8px;">👑 مدير المتجر</span>` : ""}
                        </div>
                        <div class="user-dropdown-links">
                            ${isAdmin ? `<a href="admin.html" class="user-dropdown-item">⚙️ لوحة إدارة المنتجات</a>` : ""}
                            <a href="account.html" class="user-dropdown-item">📝 ملفي الشخصي وعنواني</a>
                            <a href="cart.html" class="user-dropdown-item">🛒 سلة مشترياتي</a>
                            <button type="button" class="user-dropdown-item logout-item" onclick="handleUserLogout()">🚪 تسجيل الخروج</button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

function toggleUserDropdown(btn) {
    const menu = btn.parentElement;
    menu.classList.toggle("open");
}

// Close dropdown on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-profile-menu")) {
        document.querySelectorAll(".user-profile-menu.open").forEach(m => m.classList.remove("open"));
    }
});

function handleUserLogout() {
    clearAuthSession();
    if (typeof showToast === "function") {
        showToast("تم تسجيل الخروج بنجاح", "info");
    }
    // If on admin page or account page, redirect to index
    if (window.location.pathname.includes("admin") || window.location.pathname.includes("account")) {
        window.location.href = "index.html";
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
});
