const productsContainer = document.getElementById("productsPage");
const searchInput = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const priceSort = document.getElementById("priceSort");
const noProducts = document.getElementById("noProducts");

function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = "";

    if(productsToDisplay.length === 0) {
        noProducts.style.display = "block";
        return;
    }

    noProducts.style.display = "none";

    for(const product of productsToDisplay){
        const productCard = document.createElement("article");

        productCard.classList.add("product-card");

        productCard.addEventListener("click", (event) => {
            if (event.target.closest(".add-cart")) {return;}

            window.location.href = `product.html?id=${product.id}`;
        });

        const cartButton = productCard.querySelector(".add-cart");

        cartButton.addEventListener("click", () => {
            let cart =
                JSON.parse(
                    localStorage.getItem("cart")
                ) || [];

            const existingProduct =
                cart.find(
                    item => item.id === product.id
                );

            if (existingProduct) {
                existingProduct.quantity++;
            }
            else {
                cart.push({
                    id: product.id,
                    quantity: 1
                });
            }

            localStorage.setItem(
                "cart",
                JSON.stringify(cart)
            );

            cartButton.textContent = "✓";
        });

        productCard.innerHTML = 
        `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${
                    product.badge ? 
                        `<span class="product-badge ${product.badgeType}">${product.badge}</span>`
                                  :
                        ""
                }
            </div>

            <div class="product-info">
                <p class="product-category"> ${product.category}</p>
                <h3>${product.name}</h3>
                <p class="product-specs">${product.description}</p>

                <div class="product-bottom">
                    <strong>${product.price.toLocaleString()}DA</strong>
                    <button class="add-cart" data-id="${product.id}">🛒</button>
                </div>
            </div>
        `;

        productsContainer.appendChild(productCard);
    }

}

function filterProducts() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedSort = priceSort.value;

    let filteredProducts = products.filter(product => 
        {
            const matchesSearch = product.name.toLowerCase().includes(searchValue);
            const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
            return (matchesSearch && matchesCategory);
        });

    if (selectedSort === "low"){
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (selectedSort === "high"){
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    displayProducts(filteredProducts);
}

searchInput.addEventListener("input",filterProducts);
categoryFilter.addEventListener("change",filterProducts);
priceSort.addEventListener("change",filterProducts);

displayProducts(products);