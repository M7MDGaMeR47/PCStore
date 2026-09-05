const productsContainer = document.getElementById("featuredProducts");

function displayProducts(productsToDisplay){
    productsContainer.innerHTML = "";

    for(const product of productsToDisplay){
        const productCard = document.createElement("article");

        productCard.classList.add("product-card");

        productCard.innerHTML = 
        `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <span class="product-badge ${product.badgeType}">${product.badge}</span>
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3>${product.name}</h3>
                <p class="product-specs">${product.description}</p>
                <div class="product-bottom">
                    <strong>${product.price.toLocaleString()}DA</strong>
                    <button class="add-cart" data-id="${product.id}">🛒</button>
                </div>
            </div>
        `
        
        productsContainer.appendChild(productCard);
    }
}

displayProducts(products.slice(0, 4));