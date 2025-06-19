// frontend/auth.js

window.Auth = window.Auth || {};

const AUTH_API_BASE_URL = 'http://localhost:3000/api'; 
Auth.cachedProfile = null;

Auth.getCachedProfile = function() {
    return this.cachedProfile;
};

Auth.updateAuthStateUI = function(isLoggedIn, profile = null) {
    console.log('[Auth] Updating UI based on auth state:', isLoggedIn, 'Profile:', profile);
    this.cachedProfile = isLoggedIn ? profile : null;

    const userAuthSection = document.getElementById('user-auth'); // May not exist anymore
    const userProfileSection = document.getElementById('user-profile');
    const logoutButton = document.getElementById('logout-button'); 
    const avatarLogoutButton = document.getElementById('avatar-logout-button'); 
    const adminPageLink = document.getElementById('admin-page-link');
    const affiliateDashboardSection = document.getElementById('affiliate-dashboard');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const profileAffiliateIdEl = document.getElementById('profile-affiliate-id');
    const profileAffiliateLinkEl = document.getElementById('profile-affiliate-link');

    const headerCreditsButton = document.getElementById('header-credits-button');
    const headerTasksButton = document.getElementById('header-tasks-button');
    const headerCartButton = document.getElementById('header-cart-button');
    const headerAvatarButton = document.getElementById('header-avatar-button');
    
    const defaultAvatarUrl = 'https://netfly.s3.sa-east-1.amazonaws.com/u/demo/images/avatar/IM9pP2hNkPUkltS7MxSAazgDeHvcjPf0YqBzngHs.jpg';

    if (isLoggedIn && profile) {
        if (userAuthSection) userAuthSection.classList.add('hidden'); // Hide original auth section if it exists
        if (userProfileSection) userProfileSection.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.remove('hidden');
        if (avatarLogoutButton && avatarLogoutButton.closest('.MuiMenuItem-root')) { // Check if it's part of a MUI-like list
            avatarLogoutButton.closest('.MuiMenuItem-root').classList.remove('hidden');
        } else if (avatarLogoutButton) {
             avatarLogoutButton.classList.remove('hidden');
        }
        if (affiliateDashboardSection) affiliateDashboardSection.classList.remove('hidden');
        
        if (sidebarToggle) sidebarToggle.classList.remove('hidden');
        if (sidebar) sidebar.classList.add('hidden'); // Sidebar starts hidden, user toggles it
        document.body.classList.remove('sidebar-content-shifted');


        if (adminPageLink) {
            if (profile.isAdmin) adminPageLink.classList.remove('hidden');
            else adminPageLink.classList.add('hidden');
        }
        
        if (profileNameEl) profileNameEl.textContent = profile.name || '';
        if (profileEmailEl) profileEmailEl.textContent = profile.email || '';
        if (profileAffiliateIdEl) profileAffiliateIdEl.textContent = profile.affiliateId || '';
        if (profileAffiliateLinkEl) {
            profileAffiliateLinkEl.textContent = profile.affiliateLink || '';
            profileAffiliateLinkEl.href = profile.affiliateLink || '#';
        }
        
        const avatarImgInButton = headerAvatarButton ? headerAvatarButton.querySelector('.MuiAvatar-img') : null;
        if (avatarImgInButton) {
            avatarImgInButton.src = profile.avatar_url || defaultAvatarUrl;
        }

        if (headerCreditsButton) headerCreditsButton.classList.remove('hidden');
        if (headerTasksButton) headerTasksButton.classList.remove('hidden');
        if (headerCartButton) headerCartButton.classList.remove('hidden'); // Cart button visible when logged in
        if (headerAvatarButton) headerAvatarButton.classList.remove('hidden');

        if (window.Checkout && typeof Checkout.updateCheckoutFormForAuthState === 'function') {
            Checkout.updateCheckoutFormForAuthState(true, profile);
        }
        if (window.Affiliate && typeof Affiliate.fetchAffiliateDashboardData === 'function') {
            Affiliate.fetchAffiliateDashboardData();
        }

    } else { // Not logged in
        this.cachedProfile = null;
        if (userAuthSection) userAuthSection.classList.remove('hidden'); // Show original auth section if it exists (it shouldn't)
        if (userProfileSection) userProfileSection.classList.add('hidden');
        if (logoutButton) logoutButton.classList.add('hidden');
        if (avatarLogoutButton && avatarLogoutButton.closest('.MuiMenuItem-root')) {
            avatarLogoutButton.closest('.MuiMenuItem-root').classList.add('hidden');
        } else if (avatarLogoutButton) {
            avatarLogoutButton.classList.add('hidden');
        }
        if (affiliateDashboardSection) affiliateDashboardSection.classList.add('hidden');
        if (adminPageLink) adminPageLink.classList.add('hidden');

        if (sidebar) sidebar.classList.add('hidden');
        if (sidebarToggle) sidebarToggle.classList.add('hidden');
        document.body.classList.remove('sidebar-content-shifted');


        if (profileNameEl) profileNameEl.textContent = '';
        if (profileEmailEl) profileEmailEl.textContent = '';
        if (profileAffiliateIdEl) profileAffiliateIdEl.textContent = '';
        if (profileAffiliateLinkEl) {
            profileAffiliateLinkEl.textContent = '';
            profileAffiliateLinkEl.href = '#';
        }
        
        const avatarImgInButton = headerAvatarButton ? headerAvatarButton.querySelector('.MuiAvatar-img') : null;
        if (avatarImgInButton) {
            avatarImgInButton.src = defaultAvatarUrl;
        }

        if (headerCreditsButton) headerCreditsButton.classList.add('hidden');
        if (headerTasksButton) headerTasksButton.classList.add('hidden');
        // headerCartButton can remain visible. Its content/badge should be updated by Cart module.
        if (headerAvatarButton) headerAvatarButton.classList.remove('hidden'); 

        if (window.Checkout && typeof Checkout.updateCheckoutFormForAuthState === 'function') {
            Checkout.updateCheckoutFormForAuthState(false, null);
        }
        // No need to call Affiliate.fetchAffiliateDashboardData()
    }
    console.log('[Auth] UI update for auth state complete.');
};

Auth.fetchProfile = async function() { 
    const token = localStorage.getItem('authToken');
    const apiBaseUrl = window.API_BASE_URL || AUTH_API_BASE_URL; 

    if (!token) {
        console.log('[Auth] fetchProfile: No token found.');
        this.updateAuthStateUI(false, null);
        return null;
    }

    try {
        console.log('[Auth] fetchProfile: Fetching with token...');
        const response = await fetch(`${apiBaseUrl}/auth/profile`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('userName');
            localStorage.removeItem('userAvatarUrl');
            console.log('[Auth] fetchProfile: Token invalid/expired. Cleared token and related data.');
            this.updateAuthStateUI(false, null);
            return null;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        const profile = await response.json();
        console.log('[Auth] fetchProfile: Profile data received:', profile);

        localStorage.setItem('isAdmin', profile.isAdmin ? 'true' : 'false');
        localStorage.setItem('userName', profile.name || '');
        localStorage.setItem('userAvatarUrl', profile.avatar_url || '');
        
        this.updateAuthStateUI(true, profile);
        return profile;
    } catch (error) {
        console.error('[Auth] Error fetching profile:', error);
        // If fetch fails (network error, server error not 401/403), token is not necessarily bad.
        // We call updateAuthStateUI with isLoggedIn=false to reflect that we couldn't confirm the session.
        // This will clear profile-specific UI but keep login option available.
        // Alternatively, could try to use cachedProfile if available and show an "offline" status.
        this.updateAuthStateUI(false, null); // Safer to assume logged out if profile can't be fetched
        throw error; 
    }
};

Auth.handleRegistration = async function(isFromModal = false) { 
    console.log(`[Auth] handleRegistration called. Modal: ${isFromModal}`);
    const apiBaseUrl = window.API_BASE_URL || AUTH_API_BASE_URL;
    
    let name, email, password, formToReset;
    if (isFromModal) {
        name = document.getElementById('modal-register-name').value;
        email = document.getElementById('modal-register-email').value;
        password = document.getElementById('modal-register-password').value;
        formToReset = document.getElementById('modal-register-form');
    } else {
        name = document.getElementById('register-name').value; // Assumes these IDs exist if not modal
        email = document.getElementById('register-email').value;
        password = document.getElementById('register-password').value;
        formToReset = document.getElementById('register-form');
    }
    
    const referringAffiliateId = sessionStorage.getItem('referringAffiliateId');
    let requestBody = { name, email, password };
    if (referringAffiliateId) requestBody.referringAffiliateId = referringAffiliateId;

    console.log('[Auth] Attempting registration with data:', JSON.stringify(requestBody)); // Log de datos a enviar

    try {
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        console.log('[Auth] Registration response status:', response.status); // Log de status
        const data = await response.json();
        console.log('[Auth] Registration response data:', data); // Log de datos de respuesta

        if (response.ok) {
            const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("text_registration_success", "Registration successful! Please log in.") : "Registration successful! Please log in.";
            if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'success'); else alert(message);
            if (formToReset) formToReset.reset();
            if (isFromModal && typeof UI !== 'undefined' && UI.hideAuthModal) UI.hideAuthModal();
        } else {
            const reason = data.message || 'Unknown error';
            const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_registration_failed_reason", "Registration failed: {reason}").replace("{reason}", reason) : `Registration failed: ${reason}`;
            if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'error'); else alert(message);
        }
    } catch (error) {
        console.error('[Auth] Registration fetch/system error:', error); // Log de error de fetch
        const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_registration_error_generic", "An error occurred during registration.") : "An error occurred during registration.";
        if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'error'); else alert(message);
    }
};

Auth.handleLogin = async function(isFromModal = false) { 
    console.log(`[Auth] handleLogin called. Modal: ${isFromModal}`);
    const apiBaseUrl = window.API_BASE_URL || AUTH_API_BASE_URL;

    let email, password, formToReset;
    if (isFromModal) {
        email = document.getElementById('modal-login-email').value;
        password = document.getElementById('modal-login-password').value;
        formToReset = document.getElementById('modal-login-form');
    } else {
        email = document.getElementById('login-email').value; // Assumes these IDs exist if not modal
        password = document.getElementById('login-password').value;
        formToReset = document.getElementById('login-form');
    }
    
    let requestBody = { email, password }; // Definir requestBody para login
    console.log('[Auth] Attempting login with data:', JSON.stringify(requestBody)); // Log de datos a enviar

    try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody) // Use requestBody here
        });
        console.log('[Auth] Login response status:', response.status); // Log de status
        const result = await response.json();
        console.log('[Auth] Login response data:', result); // Log de datos de respuesta

        if (response.ok && result.token) {
            localStorage.setItem('authToken', result.token);
            await this.fetchProfile(); 
            
            const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("text_login_success", "Login successful!") : "Login successful!";
            if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'success'); else alert(message);
            
            if (formToReset) formToReset.reset();
            if (isFromModal && typeof UI !== 'undefined' && UI.hideAuthModal) UI.hideAuthModal();
        } else {
            const reason = result.message || 'Unknown error';
            const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_login_failed_reason", "Login failed: {reason}").replace("{reason}", reason) : `Login failed: ${reason}`;
            if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'error'); else alert(message);
        }
    } catch (error) {
        console.error('[Auth] Login fetch/system error:', error); // Log de error de fetch
        const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_login_error_generic", "An error occurred during login.") : "An error occurred during login.";
        if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'error'); else alert(message);
        this.updateAuthStateUI(false, null); // Ensure UI reflects logout on critical login error
    }
};

Auth.handleLogout = function() {
    console.log('[Auth] handleLogout called.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatarUrl');
    // localStorage.removeItem('userEmail'); // If it was stored

    this.cachedProfile = null; 
    this.updateAuthStateUI(false, null);

    if (window.Cart && typeof Cart.clearCart === 'function') {
        Cart.clearCart();
    }
    
    const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_logout_success", "You have been logged out.") : "You have been logged out.";
    if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'info');
    else alert(message);
};

console.log('auth.js loaded and window.Auth initialized with refined methods.');
