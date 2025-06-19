// frontend/product.js
console.log('product.js loaded');
window.Product = {
    productsContainer: null,
    productsLoadingMessage: null,

    initProductElements: function() {
        this.productsContainer = document.getElementById('products-container');
        this.productsLoadingMessage = document.getElementById('products-loading-message');
    },

    fetchAndRenderProducts: async function(tag = null) { // Parámetro tag añadido
        if (!this.productsContainer) {
            console.error('Products container not initialized. Call Product.initProductElements() first.');
            if (this.productsLoadingMessage) this.productsLoadingMessage.textContent = i18n.getTranslation("error_failed_to_load_products", "Products display area not found.");
            return;
        }
        if (this.productsLoadingMessage) {
            this.productsLoadingMessage.textContent = i18n.getTranslation("text_loading_products", "Loading products...");
            this.productsLoadingMessage.style.display = 'block';
        }

        let apiUrl = `${window.API_BASE_URL}/products`;
        if (tag) {
            apiUrl += `?tag=${encodeURIComponent(tag)}`;
            console.log(`Product.js: Fetching products filtered by tag: ${tag} from ${apiUrl}`);
        } else {
            console.log(`Product.js: Fetching all products from ${apiUrl}`);
        }

        try {
            const response = await fetch(apiUrl); // Usar la apiUrl construida
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();

            if (this.productsLoadingMessage) this.productsLoadingMessage.style.display = 'none';
            this.productsContainer.innerHTML = ''; // Clear previous products

            if (products.length === 0) {
                this.productsContainer.innerHTML = `<p>${i18n.getTranslation("text_no_products_found", "No products found.")}</p>`;
                return;
            }

            products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('product');
                productDiv.dataset.productId = product.id;
                productDiv.dataset.price = product.price;

                const categoryPrefix = i18n.getTranslation("product_label_category_prefix", "Category:");
                const addToCartText = i18n.getTranslation("btn_add_to_cart", "Add to Cart");

                productDiv.innerHTML = `
                    <img src="${product.image_url || 'https://dummyimage.com/150x150/404040/eeeeee.png&text=No+Image'}" alt="${product.name}" style="width:100%; height:200px; object-fit:cover; border-radius:4px; margin-bottom:15px;">
                    <h2>${product.name}</h2>
                    <p class="description">${product.description || ''}</p>
                    <p class="category">${categoryPrefix} ${product.category || 'N/A'}</p>
                    <p class="price">${formatCurrency(product.price)}</p>
                    <button class="add-to-cart">${addToCartText}</button>
                `;
                this.productsContainer.appendChild(productDiv);
            });
            this.setupAddToCartButtons();
        } catch (error) {
            console.error('Failed to load products:', error);
            if (this.productsContainer) this.productsContainer.innerHTML = `<p>${i18n.getTranslation("error_failed_to_load_products", "Failed to load products. Please try again later.")}</p>`;
            if (this.productsLoadingMessage && this.productsContainer.innerHTML === '') {
                this.productsLoadingMessage.textContent = i18n.getTranslation("text_failed_to_load_products_short", "Failed to load products.");
                this.productsLoadingMessage.style.display = 'block';
            }
        }
    },

    setupAddToCartButtons: function() {
        const buttons = document.querySelectorAll('#products-container .add-to-cart');
        buttons.forEach(button => {
            button.removeEventListener('click', Cart.handleAddToCartClick); // Asegurar que Cart.handleAddToCartClick esté disponible
            button.addEventListener('click', Cart.handleAddToCartClick);
        });
        console.log('Add to cart buttons event listeners set up.');
    }
};
