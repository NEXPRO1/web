// frontend/checkout.js
console.log('checkout.js loaded');
window.Checkout = {
    checkoutForm: null,
    checkoutNameInput: null,
    checkoutEmailInput: null,
    checkoutPhoneInput: null,
    placeOrderButton: null,
    checkoutAuthMessage: null,

    initCheckoutElements: function() {
        this.checkoutForm = document.getElementById('checkout-form');
        this.checkoutNameInput = document.getElementById('checkout-name');
        this.checkoutEmailInput = document.getElementById('checkout-email');
        this.checkoutPhoneInput = document.getElementById('checkout-phone');
        this.placeOrderButton = document.getElementById('place-order-button');
        this.checkoutAuthMessage = document.getElementById('checkout-auth-message');

        if (this.checkoutForm) {
            this.checkoutForm.addEventListener('submit', (event) => this.handleCheckoutSubmit(event));
        }
    },

    handleCheckoutSubmit: async function(event) {
        event.preventDefault();
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Ensure UI.showNotification is available
            if (window.UI && typeof window.UI.showNotification === 'function') {
                UI.showNotification(i18n.getTranslation("text_please_login_or_register", "Please log in or register to place an order."), "error");
            } else {
                alert(i18n.getTranslation("text_please_login_or_register", "Please log in or register to place an order."));
            }
            return;
        }

        const customerDetails = {
            name: this.checkoutNameInput.value,
            email: this.checkoutEmailInput.value,
            phone: this.checkoutPhoneInput.value
        };
        
        // Ensure Cart.items is available
        const cartItemsForBackend = (window.Cart && Array.isArray(window.Cart.items)) ? 
                                    window.Cart.items.map(item => ({ productId: item.productId, quantity: item.quantity })) :
                                    [];

        if (cartItemsForBackend.length === 0) {
            if (window.UI && typeof window.UI.showNotification === 'function') {
                UI.showNotification(i18n.getTranslation("error_cart_empty_checkout", "Your cart is empty. Please add products before checking out."), "error");
            } else {
                alert(i18n.getTranslation("error_cart_empty_checkout", "Your cart is empty. Please add products before checking out."));
            }
            return;
        }

        const orderData = { customerDetails, cartItems: cartItemsForBackend };

        try {
            const response = await fetch(window.API_BASE_URL + '/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            if (response.ok) {
                const message = i18n.getTranslation("alert_order_placed_success_dynamic", "Order placed successfully! Order ID: {orderId}. Total: {totalAmount}")
                                .replace("{orderId}", result.orderId)
                                .replace("{totalAmount}", formatCurrency(result.totalAmount));
                if (window.UI && typeof window.UI.showNotification === 'function') UI.showNotification(message, 'success');
                else alert(message);
                
                if (window.Cart && typeof window.Cart.clearCart === 'function') Cart.clearCart();
                if(this.checkoutForm) this.checkoutForm.reset();
                
                // Re-populate name/email if user is logged in (profile data might be stale if they changed it in another tab)
                const userProfile = (window.Auth && typeof window.Auth.getCachedProfile === 'function') ? Auth.getCachedProfile() : null;
                if (userProfile) { // Assuming Auth module can provide cached profile data
                    this.checkoutNameInput.value = userProfile.name || '';
                    this.checkoutEmailInput.value = userProfile.email || '';
                }

            } else {
                const message = i18n.getTranslation("alert_order_failed_reason", "Error placing order: {reason}")
                                .replace("{reason}", result.message || 'Unknown error');
                if (window.UI && typeof window.UI.showNotification === 'function') UI.showNotification(message, 'error');
                else alert(message);
            }
        } catch (error) {
            console.error('Checkout/Network error:', error);
            const message = i18n.getTranslation("alert_order_error_generic", "Error submitting order. Check console.");
            if (window.UI && typeof window.UI.showNotification === 'function') UI.showNotification(message, 'error');
            else alert(message);
        }
    },

    updateCheckoutFormForAuthState: function(isLoggedIn, profile) {
        if (!this.checkoutForm || !this.checkoutNameInput || !this.checkoutEmailInput || !this.checkoutPhoneInput || !this.placeOrderButton || !this.checkoutAuthMessage) {
            // console.warn("Checkout elements not fully initialized. Skipping auth state update for checkout form.");
            return;
        }

        if (isLoggedIn && profile) {
            this.checkoutNameInput.value = profile.name || '';
            this.checkoutEmailInput.value = profile.email || '';
            // this.checkoutPhoneInput.value = profile.phone || ''; // If profile had phone
            
            this.checkoutNameInput.disabled = false;
            this.checkoutEmailInput.disabled = false;
            this.checkoutPhoneInput.disabled = false;
            this.placeOrderButton.disabled = false;
            this.checkoutAuthMessage.classList.add('hidden');
        } else {
            // this.checkoutForm.reset(); // Don't reset if they were typing
            this.checkoutNameInput.disabled = true;
            this.checkoutEmailInput.disabled = true;
            this.checkoutPhoneInput.disabled = true;
            this.placeOrderButton.disabled = true;
            this.checkoutAuthMessage.textContent = i18n.getTranslation("text_please_login_or_register", "Please log in or register to place an order.");
            this.checkoutAuthMessage.classList.remove('hidden');
        }
    }
};
