// frontend/main.js

// Debounce utility function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this; // Capture the correct context
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Global formatCurrency function
function formatCurrency(value, currency) {
    const currentLocale = (typeof i18n !== 'undefined' && i18n.currentLanguage) ? i18n.currentLanguage : 'en';
    let defaultCurrency = 'USD';
    if (currentLocale === 'es') {
        defaultCurrency = 'MXN';
    }
    const displayCurrency = currency || defaultCurrency;
    const num = parseFloat(value);

    if (isNaN(num)) {
        return `${displayCurrency} 0.00`;
    }

    try {
        return new Intl.NumberFormat(currentLocale + '-u-nu-latn', {
            style: 'currency',
            currency: displayCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    } catch (e) {
        return `${displayCurrency} ${num.toFixed(2)}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('main.js: DOMContentLoaded event fired.');

    try {
        if (window.i18n && typeof window.i18n.initializeI18n === 'function') {
            await i18n.initializeI18n();
            console.log('main.js: i18n initialized successfully.');
            if (typeof i18n.translatePage === 'function') {
                i18n.translatePage();
            }
            if (window.UI && typeof window.UI.updateActiveLanguageButton === 'function') {
                UI.updateActiveLanguageButton(i18n.currentLanguage);
            }
        } else {
            console.error('main.js: i18n object or initializeI18n function is not available!');
        }
    } catch (e) {
        console.error('main.js: Error during i18n initialization:', e);
    }

    if (window.Product && typeof window.Product.initProductElements === 'function') {
        Product.initProductElements();
        console.log('main.js: Product elements initialized.');
    }
    if (window.Cart && typeof window.Cart.initCartElements === 'function') {
        Cart.initCartElements();
        console.log('main.js: Cart elements initialized.');
    }
    if (window.Affiliate && typeof window.Affiliate.initAffiliateElements === 'function') {
        Affiliate.initAffiliateElements();
        console.log('main.js: Affiliate elements initialized.');
    }
    if (window.Checkout && typeof window.Checkout.initCheckoutElements === 'function') {
        Checkout.initCheckoutElements();
        console.log('main.js: Checkout elements initialized.');
    }

    if (window.UI) {
        if (typeof UI.initAvatarButton === 'function') UI.initAvatarButton();
        if (typeof UI.initSettingsDropdown === 'function') {
            UI.initSettingsDropdown();
            console.log('main.js: Settings dropdown initialized.');
        }
        if (typeof UI.initLanguageSwitcherButtons === 'function') {
            UI.initLanguageSwitcherButtons();
        }
        if (typeof UI.initThemeSwitcher === 'function') {
            UI.initThemeSwitcher(); 
        }
        if (typeof UI.initSidebarToggle === 'function') { 
            UI.initSidebarToggle();
        }
        if (typeof UI.initCartSummaryDropdown === 'function') { 
            UI.initCartSummaryDropdown();
        }
        if (typeof UI.initUserProfileTabs === 'function') { 
            UI.initUserProfileTabs();
        }
        if (typeof UI.initAvatarUpload === 'function') { // Added this call
            UI.initAvatarUpload();
            console.log('main.js: Avatar upload initialized.');
        }
        console.log('main.js: All core UI components initialized.');
    } else {
        console.error('main.js: window.UI object not found.');
    }
    
    // Logout Button in main header (if it exists there)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton && window.Auth && typeof Auth.handleLogout === 'function') {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault(); 
            Auth.handleLogout();
        });
        console.log('main.js: Main logout button listener attached.');
    } else {
        if (!logoutButton) console.warn('main.js: Main logout button (#logout-button) not found.');
        // Auth or handleLogout might not be available if Auth module fails to load, which is handled below.
    }

    if (window.Auth && typeof window.Auth.fetchProfile === 'function') {
        try {
            await Auth.fetchProfile();
            console.log('main.js: Initial profile fetch executed.');
            if (window.Checkout && typeof window.Checkout.updateCheckoutFormForAuthState === 'function' && window.Auth.getCachedProfile) {
                 const profile = window.Auth.getCachedProfile ? window.Auth.getCachedProfile() : null;
                 Checkout.updateCheckoutFormForAuthState(!!localStorage.getItem('authToken'), profile);
            }
        } catch (error) {
            console.error('main.js: Error during initial profile fetch:', error);
            if (typeof Auth.updateAuthStateUI === 'function') Auth.updateAuthStateUI(false);
            if (window.Checkout && typeof window.Checkout.updateCheckoutFormForAuthState === 'function') {
                Checkout.updateCheckoutFormForAuthState(false, null);
            }
        }
    } else {
        console.error('main.js: Auth.fetchProfile function not found. UI might not reflect login state.');
        if (window.Auth && typeof Auth.updateAuthStateUI === 'function') Auth.updateAuthStateUI(false);
        if (window.Checkout && typeof window.Checkout.updateCheckoutFormForAuthState === 'function') {
            Checkout.updateCheckoutFormForAuthState(false, null);
        }
    }

    let currentTag = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        currentTag = urlParams.get('tag');
        if (currentTag) {
            console.log(`main.js: Tag found in URL: ${currentTag}`);
        }
    } catch (e) {
        console.warn("main.js: Error reading URL parameters for tag:", e);
    }

    if (window.Product && typeof window.Product.fetchAndRenderProducts === 'function') {
        try {
            await Product.fetchAndRenderProducts(currentTag);
        } catch (error) {
            console.error('main.js: Error fetching/rendering products:', error);
        }
    } else {
        console.error('main.js: Product.fetchAndRenderProducts function not found.');
    }

    // Initialize Floating Buttons
    if (window.FloatingButtons && typeof window.FloatingButtons.init === 'function') {
        FloatingButtons.init(); // This calls fetchAndRender, which then calls positionButtons
        console.log('main.js: FloatingButtons.init() called.');
    } else {
        console.error('main.js: FloatingButtons.init function not found.');
    }

    // Add resize listener for floating buttons
    if (window.FloatingButtons && typeof window.FloatingButtons.positionButtons === 'function') {
        const debouncedPositionButtons = debounce(FloatingButtons.positionButtons.bind(FloatingButtons), 250);
        window.addEventListener('resize', debouncedPositionButtons);
        console.log('main.js: Resize listener for floating buttons added.');
    } else {
        console.warn('main.js: FloatingButtons.positionButtons function not found, cannot add resize listener.');
    }

    if (window.Cart && typeof window.Cart.renderCart === 'function') {
        Cart.renderCart();
        console.log('main.js: Initial cart rendered.');
    }
    if (window.Cart && typeof window.Cart.renderCartSummaryDropdown === 'function') {
        Cart.renderCartSummaryDropdown();
        console.log('main.js: Initial cart summary dropdown rendered.');
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const referringAffiliateIdFromUrl = urlParams.get('ref');
        if (referringAffiliateIdFromUrl) {
            sessionStorage.setItem('referringAffiliateId', referringAffiliateIdFromUrl);
            console.log('main.js: Captured referring affiliate ID:', referringAffiliateIdFromUrl);
        }
    } catch (e) {
        console.warn("main.js: URLSearchParams not supported or error accessing it. Affiliate ref via URL might not work.");
    }
    
    console.log('main.js: All initializations complete.');
});
