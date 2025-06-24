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
    const avatarAdminPanelLinkContainer = document.getElementById('avatar-admin-panel-link-container');
    const avatarNotificationsLinkContainer = document.getElementById('avatar-notifications-link-container'); // ADDED

    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');
    const profileAffiliateIdEl = document.getElementById('profile-affiliate-id');
    const profileAffiliateLinkEl = document.getElementById('profile-affiliate-link');

    const headerCreditsButton = document.getElementById('header-credits-button');
    const headerTasksButton = document.getElementById('header-tasks-button');
    const headerCartButton = document.getElementById('header-cart-button');
    const headerAvatarButton = document.getElementById('header-avatar-button');
    
    const defaultAvatarUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

    if (isLoggedIn && profile) {
        if (userAuthSection) userAuthSection.classList.add('hidden'); 
        if (userProfileSection) userProfileSection.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.remove('hidden');
        if (avatarLogoutButton && avatarLogoutButton.closest('.MuiMenuItem-root')) { 
            avatarLogoutButton.closest('.MuiMenuItem-root').classList.remove('hidden');
        } else if (avatarLogoutButton) {
             avatarLogoutButton.classList.remove('hidden');
        }
        if (affiliateDashboardSection) affiliateDashboardSection.classList.remove('hidden');
        
        if (sidebarToggle) sidebarToggle.classList.remove('hidden');
        if (sidebar) sidebar.classList.add('hidden'); 
        document.body.classList.remove('sidebar-content-shifted');

        if (adminPageLink) {
            if (profile.isAdmin) adminPageLink.classList.remove('hidden');
            else adminPageLink.classList.add('hidden');
        }

        if (avatarAdminPanelLinkContainer) {
            if (profile.isAdmin) {
                avatarAdminPanelLinkContainer.classList.remove('hidden');
            } else {
                avatarAdminPanelLinkContainer.classList.add('hidden');
            }
        }
        // ADDED for avatar notifications link
        if (avatarNotificationsLinkContainer) {
            avatarNotificationsLinkContainer.classList.remove('hidden');
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
        // if (headerTasksButton) headerTasksButton.classList.remove('hidden'); // Already removed from HTML
        if (headerCartButton) headerCartButton.classList.remove('hidden'); 
        if (headerAvatarButton) headerAvatarButton.classList.remove('hidden');

        if (window.Checkout && typeof Checkout.updateCheckoutFormForAuthState === 'function') {
            Checkout.updateCheckoutFormForAuthState(true, profile);
        }
        if (window.Affiliate && typeof Affiliate.fetchAffiliateDashboardData === 'function') {
            Affiliate.fetchAffiliateDashboardData();
        }

    } else { // Not logged in
        this.cachedProfile = null;
        if (userAuthSection) userAuthSection.classList.remove('hidden'); 
        if (userProfileSection) userProfileSection.classList.add('hidden');
        if (logoutButton) logoutButton.classList.add('hidden');
        if (avatarLogoutButton && avatarLogoutButton.closest('.MuiMenuItem-root')) {
            avatarLogoutButton.closest('.MuiMenuItem-root').classList.add('hidden');
        } else if (avatarLogoutButton) {
            avatarLogoutButton.classList.add('hidden');
        }
        if (affiliateDashboardSection) affiliateDashboardSection.classList.add('hidden');
        if (adminPageLink) adminPageLink.classList.add('hidden');
        
        if (avatarAdminPanelLinkContainer) {
            avatarAdminPanelLinkContainer.classList.add('hidden');
        }
        // ADDED for avatar notifications link
        if (avatarNotificationsLinkContainer) {
            avatarNotificationsLinkContainer.classList.add('hidden');
        }

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
        // if (headerTasksButton) headerTasksButton.classList.add('hidden'); // Already removed from HTML
        if (headerAvatarButton) headerAvatarButton.classList.remove('hidden'); 

        if (window.Checkout && typeof Checkout.updateCheckoutFormForAuthState === 'function') {
            Checkout.updateCheckoutFormForAuthState(false, null);
        }
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
        this.updateAuthStateUI(false, null); 
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
        name = document.getElementById('register-name').value; 
        email = document.getElementById('register-email').value;
        password = document.getElementById('register-password').value;
        formToReset = document.getElementById('register-form');
    }
    
    const referringAffiliateId = sessionStorage.getItem('referringAffiliateId');
    let requestBody = { name, email, password };
    if (referringAffiliateId) requestBody.referringAffiliateId = referringAffiliateId;

    console.log('[Auth] Attempting registration with data:', JSON.stringify(requestBody)); 

    try {
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        console.log('[Auth] Registration response status:', response.status); 
        const data = await response.json();
        console.log('[Auth] Registration response data:', data); 

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
        console.error('[Auth] Registration fetch/system error:', error); 
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
        email = document.getElementById('login-email').value; 
        password = document.getElementById('login-password').value;
        formToReset = document.getElementById('login-form');
    }
    
    let requestBody = { email, password }; 
    console.log('[Auth] Attempting login with data:', JSON.stringify(requestBody)); 

    try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody) 
        });
        console.log('[Auth] Login response status:', response.status); 
        const result = await response.json();
        console.log('[Auth] Login response data:', result); 

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
        console.error('[Auth] Login fetch/system error:', error); 
        const message = (typeof i18n !== 'undefined' && i18n.getTranslation) ? i18n.getTranslation("alert_login_error_generic", "An error occurred during login.") : "An error occurred during login.";
        if (typeof UI !== 'undefined' && UI.showNotification) UI.showNotification(message, 'error'); else alert(message);
        this.updateAuthStateUI(false, null); 
    }
};

Auth.handleLogout = function() {
    console.log('[Auth] handleLogout called.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatarUrl');

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
