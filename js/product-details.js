const productDetails = document.getElementById("productDetails");

const urlParams = new URLSearchParams(window.location.search);
const productId = Number(urlParams.get("id"));

const product = products.find(product => product.id === productId);

if (!product) {
    productDetails.innerHTML = 
    `
        <div class="product-not-found">
            <h1>المنتج غير موجود</h1>
            <p>ربما تم حذف المنتج أو أن الرابط غير صحيح.</p>
            <a href="products.html" class="btn primary">العودة إلى المنتجات</a>
        </div>
    `;
}else{
    productDetails.innerHTML = 
    `
        <div class="product-details-image">
            <img src="${product.image}" alt="${product.name}">
            ${
                product.badge ?
                         `<span class="product-badge ${product.badgeType}">${product.badge}</span>`
                              :
                         ""
            }
        </div>

        <div class="product-details-info">
            <p class="product-category">${product.category}</p>
            <h1>${product.name}</h1>
            <p class="product-details-description">${product.description}</p>

            <div class="product-details-price">${product.price.toLocaleString()}DA</div>

            <div class="product-details-status">
                <span>✓ متوفر</span>
            </div>

            <button class="add-to-cart-btn" data-id="${product.id}">🛒 أضف إلى السلة</button>
        </div>
    `;
}

const addToCartButton = document.querySelector(".add-to-cart-btn");

addToCartButton.addEventListener("click", () => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingProduct = cart.find(item => item.id === product.id);

        if (existingProduct) {existingProduct.quantity++;}
        else {cart.push({id: product.id, quantity: 1});}

        localStorage.setItem("cart", JSON.stringify(cart));

        addToCartButton.textContent = "✓ تمت الإضافة للسلة";
    }
);