let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.querySelector(".cart-count");

/*
    حفظ السلة
*/
function saveCart() {
    localStorage.setItem("cart",JSON.stringify(cart));
}

/*
    تحديث عدد المنتجات في Navbar
*/
function updateCartCount() {
    const count = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

    cartCount.textContent = count;
}

/*
    إضافة منتج إلى السلة
*/
function addToCart(productId) {
    const existingProduct = cart.find(item => item.id === productId);

    if (existingProduct) {existingProduct.quantity++;}
    else {
        cart.push({id: productId, quantity: 1});
    }

    saveCart();
    updateCartCount();
}

/*
    عرض السلة
*/
function displayCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        emptyCart.style.display = "block";
        updateCartCount();
        cartSubtotal.textContent = "0 DA";
        cartTotal.textContent = "0 DA";
        return;
    }

    emptyCart.style.display = "none";

    let total = 0;

    cart.forEach(cartItem => {
        const product = products.find(product => product.id === cartItem.id);

        if (!product) return;

        const itemTotal = product.price * cartItem.quantity;

        total += itemTotal;

        const item = document.createElement("div");

        item.classList.add("cart-item");

        item.innerHTML =
        `
            <div class="cart-item-image">
                <img src="${product.image}" alt="${product.name}">
            </div>

            <div class="cart-item-info">
                <p class="product-category">${product.category}</p>
                <h3>${product.name}</h3>
                <strong>${product.price.toLocaleString()} DA</strong>
            </div>

            <div class="quantity-controls">
                <button class="quantity-btn" data-action="increase" data-id="${product.id}">+</button>
                <span>${cartItem.quantity}</span>
                <button class="quantity-btn" data-action="decrease" data-id="${product.id}">-</button>
            </div>

            <div class="cart-item-total">${itemTotal.toLocaleString()}DA</div>

            <button class="remove-cart" data-id="${product.id}">✕</button>
        `;

        cartItems.appendChild(item);
    });


    cartSubtotal.textContent = `${total.toLocaleString()}DA`;
    cartTotal.textContent = `${total.toLocaleString()}DA`;

    updateCartCount();
}

/*
    التحكم في الكمية والحذف
*/
cartItems.addEventListener("click", event => {
        const button = event.target.closest("button");

        if (!button) return;

        const productId = Number(button.dataset.id);
        const action = button.dataset.action;
        const cartItem = cart.find(item => item.id === productId);

        if (action === "increase") {
            cartItem.quantity++;
        }


        if (action === "decrease") {
            cartItem.quantity--;

            if (cartItem.quantity <= 0) {
                cart = cart.filter(item => item.id !== productId);
            }
        }

        if (button.classList.contains("remove-cart")) {
            cart = cart.filter(item => item.id !== productId);
        }

        saveCart();
        displayCart();
    }
);

/*
    تشغيل الصفحة
*/
displayCart();