// frontend/cart.js
console.log('cart.js loaded (v2 - verified)'); // Añadir v2 para confirmar que es esta versión
window.Cart = {
    items: [], 
    cartItemsContainer: null,
    totalPriceElement: null,
    cartSummaryItemsContainer: null,
    cartSummaryTotalPriceElement: null,
    cartSummaryCheckoutButton: null,
    emptyCartMessageElement: null, // Para el dropdown del carrito

    initCartElements: function() {
        this.cartItemsContainer = document.getElementById('cart-items');
        this.totalPriceElement = document.getElementById('total-price');
        this.cartSummaryItemsContainer = document.getElementById('cart-summary-items-container');
        this.cartSummaryTotalPriceElement = document.getElementById('cart-summary-total-price');
        this.cartSummaryCheckoutButton = document.getElementById('cart-summary-checkout-button');
        if (this.cartSummaryItemsContainer) {
            this.emptyCartMessageElement = this.cartSummaryItemsContainer.querySelector('.empty-cart-message');
        }
        console.log('Cart elements initialized:', 
            !!this.cartItemsContainer, 
            !!this.totalPriceElement, 
            !!this.cartSummaryItemsContainer, 
            !!this.cartSummaryTotalPriceElement
        );
    },

    calculateTotalPrice: function() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    handleAddToCartClick: function(event) {
        const productElement = event.target.closest('div.product[data-product-id]');
        if (!productElement) {
            console.error("Product element not found for Add to Cart.");
            return;
        }

        const productId = productElement.dataset.productId;
        const productNameElement = productElement.querySelector('h2');
        const productName = productNameElement ? productNameElement.textContent : 'Unknown Product';
        const productPrice = parseFloat(productElement.dataset.price);

        if (productId && productName && !isNaN(productPrice)) {
            const existingItem = Cart.items.find(item => item.productId === productId);
            if (existingItem) {
                // UI.showNotification(i18n.getTranslation("alert_product_already_in_cart", "This product is already in your cart."), 'info');
                // Para prueba sin UI completa, usar console.warn
                console.warn(i18n.getTranslation("alert_product_already_in_cart", "This product is already in your cart."));
            } else {
                Cart.items.push({ productId: productId, name: productName, price: productPrice, quantity: 1 });
                // UI.showNotification(i18n.getTranslation("text_product_added_to_cart", "{productName} added to cart!").replace("{productName}", productName), 'success');
                console.log(i18n.getTranslation("text_product_added_to_cart", "{productName} added to cart!").replace("{productName}", productName));
            }
            Cart.renderCart();
            Cart.renderCartSummaryDropdown();
        } else {
            console.error("Product data (ID, name, or price) invalid for Add to Cart.");
        }
    },

    renderCart: function() {
        if (!this.cartItemsContainer || !this.totalPriceElement) {
            console.error("Cart DOM elements (cart-items, total-price) not found for rendering main cart. Did you call Cart.initCartElements()?");
            return;
        }
        this.cartItemsContainer.innerHTML = ''; 
        if (this.items.length === 0) {
            this.cartItemsContainer.innerHTML = `<p>${i18n.getTranslation("cart_empty_message", "Your cart is currently empty.")}</p>`;
        } else {
            this.items.forEach((item, index) => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item-entry');
                cartItemDiv.innerHTML = `
                    ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}
                    <button class="remove-from-cart" data-index="${index}">
                        ${i18n.getTranslation("btn_remove", "Remove")}
                    </button>
                `;
                // Attach listener to the new remove button
                const removeButton = cartItemDiv.querySelector('.remove-from-cart');
                if(removeButton) {
                    removeButton.addEventListener('click', function() {
                        Cart.items.splice(parseInt(this.dataset.index), 1);
                        Cart.renderCart();
                        Cart.renderCartSummaryDropdown();
                    });
                }
                this.cartItemsContainer.appendChild(cartItemDiv);
            });
        }
        this.totalPriceElement.textContent = formatCurrency(this.calculateTotalPrice());
    },

    renderCartSummaryDropdown: function() {
        if (!this.cartSummaryItemsContainer || !this.cartSummaryTotalPriceElement) {
            // console.warn("Cart summary dropdown elements not found. Skipping update.");
            return;
        }

        this.cartSummaryItemsContainer.innerHTML = '';
        const cartTotal = this.calculateTotalPrice();

        if (this.items.length === 0) {
            if (this.emptyCartMessageElement) {
                this.emptyCartMessageElement.classList.remove('hidden');
                // No añadirlo dos veces si ya está en el DOM
                if (!this.cartSummaryItemsContainer.contains(this.emptyCartMessageElement)) {
                     this.cartSummaryItemsContainer.appendChild(this.emptyCartMessageElement);
                }
            } else {
                 this.cartSummaryItemsContainer.innerHTML = `<p class="empty-cart-message">${i18n.getTranslation("dropdown_cart_empty", "Your cart is empty.")}</p>`;
            }
            if (this.cartSummaryCheckoutButton) this.cartSummaryCheckoutButton.disabled = true;
        } else {
            if (this.emptyCartMessageElement) this.emptyCartMessageElement.classList.add('hidden');

            this.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('cart-summary-item');
                itemDiv.innerHTML = `
                    <span class="item-name">${item.name} (x${item.quantity})</span>
                    <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
                `;
                this.cartSummaryItemsContainer.appendChild(itemDiv);
            });
            if (this.cartSummaryCheckoutButton) this.cartSummaryCheckoutButton.disabled = false;
        }
        this.cartSummaryTotalPriceElement.textContent = formatCurrency(cartTotal);
    },
    
    clearCart: function() {
        this.items = [];
        this.renderCart();
        this.renderCartSummaryDropdown();
        console.log('Cart cleared.');
    }
};
