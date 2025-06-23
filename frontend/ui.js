// frontend/ui.js

// Initialize window.UI if it doesn't exist
window.UI = window.UI || {};

// --- Modal State and Functions ---
window.UI.isAuthModalLoaded = false;

window.UI.loadAuthModalHTML = async function() { // Corrected assignment syntax
    if (window.UI.isAuthModalLoaded) {
        return Promise.resolve();
    }
    try {
        console.log('UI.loadAuthModalHTML: Fetching login-modal.html...');
        const response = await fetch('login-modal.html'); 
        if (!response.ok) {
            throw new Error(`Failed to fetch login-modal.html: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        const modalContainer = document.getElementById('auth-modal-container'); 

        if (modalContainer) {
            modalContainer.innerHTML = html; 
            window.UI.isAuthModalLoaded = true; 
            console.log('Auth modal HTML successfully loaded into #auth-modal-container.');
            
            if (typeof initializeAuthModalAnimation === 'function') {
                initializeAuthModalAnimation(); 
            } else {
                console.error('initializeAuthModalAnimation function not found. Ensure login-modal.js is loaded and defines it.');
            }

            const closeButton = document.getElementById('close-auth-modal-btn');
            if (closeButton) {
                closeButton.addEventListener('click', UI.hideAuthModal); 
                console.log('Event listener for #close-auth-modal-btn added.');
            } else {
                console.warn('#close-auth-modal-btn not found in modal HTML after injection.');
            }

            return Promise.resolve();
        } else {
            console.error('#auth-modal-container element not found in DOM. Cannot inject modal HTML.');
            window.UI.isAuthModalLoaded = false; 
            return Promise.reject(new Error('Modal container #auth-modal-container not found'));
        }
    } catch (error) {
        console.error('Error in UI.loadAuthModalHTML:', error);
        window.UI.isAuthModalLoaded = false;
        return Promise.reject(error); 
    }
}; 

window.UI.showAuthModal = async function() {
    const modalContainer = document.getElementById('auth-modal-container'); 
    
    if (!modalContainer) {
        console.error('#auth-modal-container not found, cannot show modal.');
        return;
    }

    try {
        await window.UI.loadAuthModalHTML(); 
        
        const modalRegisterForm = document.getElementById('modal-register-form');
        const modalLoginForm = document.getElementById('modal-login-form');

        if (modalRegisterForm) {
            console.log('UI.showAuthModal: Found modalRegisterForm. Attaching onsubmit listener.');
            modalRegisterForm.onsubmit = function(event) { 
                event.preventDefault();
                console.log('UI.showAuthModal: modalRegisterForm submitted. Calling Auth.handleRegistration(true).');
                if (window.Auth && typeof window.Auth.handleRegistration === 'function') {
                    window.Auth.handleRegistration(true); 
                } else {
                    console.error('Auth.handleRegistration function not found at submit time.');
                }
            };
        } else {
            console.error('UI.showAuthModal: Modal register form (#modal-register-form) NOT FOUND.');
        }

        if (modalLoginForm) {
            console.log('UI.showAuthModal: Found modalLoginForm. Attaching onsubmit listener.');
            modalLoginForm.onsubmit = function(event) { 
                event.preventDefault();
                console.log('UI.showAuthModal: modalLoginForm submitted. Calling Auth.handleLogin(true).');
                if (window.Auth && typeof window.Auth.handleLogin === 'function') {
                    window.Auth.handleLogin(true); 
                } else {
                    console.error('Auth.handleLogin function not found at submit time.');
                }
            };
        } else {
            console.error('UI.showAuthModal: Modal login form (#modal-login-form) NOT FOUND.');
        }
        
        modalContainer.classList.remove('hidden'); 

        console.log('Auth modal shown by ui.js (using #auth-modal-container).');
        const loginEmailInput = document.getElementById('modal-login-email');
        if (loginEmailInput) {
            loginEmailInput.focus();
        }

    } catch (error) {
        console.error('Could not show auth modal:', error);
        var message = 'Failed to load authentication form. Please try again.';
        if (typeof i18n !== 'undefined' && typeof i18n.getTranslation === 'function') {
            message = i18n.getTranslation('error_loading_auth_modal', message);
        }
        if (typeof window.UI.showNotification === 'function') {
             window.UI.showNotification(message, 'error');
        } else {
            alert(message); 
        }
    }
};

window.UI.hideAuthModal = function() {
    const modalContainer = document.getElementById('auth-modal-container');
    if (modalContainer) {
        modalContainer.classList.add('hidden');
        console.log('Auth modal hidden by ui.js (using #auth-modal-container).');
    }
};

window.UI.initSidebarToggle = function() {
    const sidebarToggleButton = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggleButton && sidebar) {
        sidebarToggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
            document.body.classList.toggle('sidebar-content-shifted');
            sidebarToggleButton.classList.toggle('sidebar-toggle-active'); 
            console.log('Sidebar toggled. Sidebar hidden:', sidebar.classList.contains('hidden'));

            if (window.FloatingButtons && typeof window.FloatingButtons.positionButtons === 'function') {
                setTimeout(() => {
                    window.FloatingButtons.positionButtons();
                    console.log('FloatingButtons.positionButtons() called after sidebar toggle.');
                }, 350); 
            }
        });
        console.log('Sidebar toggle initialized.');
    } else {
        if (!sidebarToggleButton) console.error('UI.initSidebarToggle: Sidebar toggle button (#sidebar-toggle) not found.');
        if (!sidebar) console.error('UI.initSidebarToggle: Sidebar element (#sidebar) not found.');
    }
    
    window.UI.updateDropdownProfileCard = function(profile) {
    console.log('Actualizando perfil cuadrado con:', profile);
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('hidden');
    // Espera un pequeño tiempo para asegurar que el DOM se actualizó
    setTimeout(() => {
        if (window.Affiliate && typeof window.Affiliate.fetchAffiliateDashboardData === 'function') {
            window.Affiliate.fetchAffiliateDashboardData();
        }
    }, 100);
    });
    };
};

window.UI.fetchAndRenderFloatingButtons = async function() {
    console.warn("UI.fetchAndRenderFloatingButtons is likely deprecated. Functionality moved to FloatingButtons.js");
};

window.UI._currentTheme = 'dark'; 

window.UI.applyThemePreference = function(theme) {
    const bodyElement = document.body;
    const logoImage = document.getElementById('site-logo');
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

    if (theme === 'light') {
        bodyElement.classList.add('light-theme');
        if (logoImage) logoImage.src = 'logo1.webp'; 
        if (themeToggleCheckbox) themeToggleCheckbox.checked = false; 
        this._currentTheme = 'light';
    } else { 
        bodyElement.classList.remove('light-theme');
        if (logoImage) logoImage.src = 'logo.webp'; 
        if (themeToggleCheckbox) themeToggleCheckbox.checked = true; 
        this._currentTheme = 'dark';
    }
    try {
        localStorage.setItem('selectedTheme', theme);
    } catch (e) {
        console.warn("Could not save theme to localStorage:", e);
    }
    console.log(`Theme applied: ${theme}`);
};

window.UI.initThemeSwitcher = function() {
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    if (!themeToggleCheckbox) {
        console.error('Theme toggle checkbox (#theme-toggle-checkbox) not found.');
        return;
    }

    let initialTheme = 'dark'; 
    try {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
            initialTheme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            initialTheme = 'light';
        }
    } catch (e) {
        console.warn("Could not access localStorage or matchMedia for initial theme:", e);
    }
    
    this.applyThemePreference(initialTheme); 

    themeToggleCheckbox.addEventListener('change', () => {
        if (themeToggleCheckbox.checked) { 
            this.applyThemePreference('dark');
        } else { 
            this.applyThemePreference('light');
        }
    });

    console.log('Theme switcher initialized. Initial theme:', this._currentTheme);
};

window.UI.initSettingsDropdown = function() {
    const settingsButton = document.getElementById('header-settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const avatarDropdown = document.getElementById('avatar-dropdown'); 
    const cartSummaryDropdown = document.getElementById('cart-summary-dropdown');

    if (settingsButton && settingsDropdown) {
        settingsDropdown.classList.add('hidden'); 
        console.log('UI.initSettingsDropdown: Ensured #settings-dropdown is hidden at initialization of its listener.'); 
            
        console.log('UI.initSettingsDropdown: Found settings button and dropdown. Attaching listener.');
        settingsButton.addEventListener('click', function(event) {
            console.log('UI.initSettingsDropdown: Settings button clicked.');
            event.stopPropagation(); 

            console.log('UI.initSettingsDropdown: Hiding other dropdowns/modals.');
            if (avatarDropdown && !avatarDropdown.classList.contains('hidden')) {
                avatarDropdown.classList.add('hidden');
                console.log('UI.initSettingsDropdown: Avatar dropdown hidden.');
            }
            if (cartSummaryDropdown && !cartSummaryDropdown.classList.contains('hidden')) {
                cartSummaryDropdown.classList.add('hidden');
                console.log('UI.initSettingsDropdown: Cart summary dropdown hidden.');
            }
            
            const authModalContainer = document.getElementById('auth-modal-container');
            if (authModalContainer && !authModalContainer.classList.contains('hidden') && typeof UI.hideAuthModal === 'function') {
                UI.hideAuthModal();
                console.log('UI.initSettingsDropdown: Auth modal hidden.');
            }

            console.log('UI.initSettingsDropdown: Click handler - Current classes on #settings-dropdown before DwasHidden check:', settingsDropdown.className); 
            console.log('UI.initSettingsDropdown: Click handler - Does it contain "hidden"?', settingsDropdown.classList.contains('hidden')); 
            const DwasHidden = settingsDropdown.classList.contains('hidden'); 
            settingsDropdown.classList.toggle('hidden'); 
            const DisNowHidden = settingsDropdown.classList.contains('hidden'); 

            console.log(`UI.initSettingsDropdown: Settings dropdown - WasHidden: ${DwasHidden}, IsNowHidden: ${DisNowHidden}`);

            if (!DisNowHidden) { 
                console.log('UI.initSettingsDropdown: Dropdown is now visible, proceeding to position.');
                try {
                    const btnRect = settingsButton.getBoundingClientRect(); 
                    settingsDropdown.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
                    settingsDropdown.style.left = 'auto';
                    settingsDropdown.style.right = (window.innerWidth - btnRect.right - window.scrollX) + 'px';
                    
                    const dropdownRect = settingsDropdown.getBoundingClientRect();
                    if (dropdownRect.left < 0) {
                        settingsDropdown.style.right = 'auto';
                        settingsDropdown.style.left = (btnRect.left + window.scrollX) + 'px';
                        console.log('UI.initSettingsDropdown: Settings dropdown position adjusted to prevent off-screen left.');
                    }
                    console.log('UI.initSettingsDropdown: Settings dropdown positioned and shown.');
                } catch (e) {
                    console.error('UI.initSettingsDropdown: Error during positioning:', e);
                    settingsDropdown.classList.add('hidden'); 
                    console.log('UI.initSettingsDropdown: Settings dropdown hidden due to positioning error.');
                }
            } else { 
                console.log('UI.initSettingsDropdown: Settings dropdown is now hidden.');
            }
        });
        console.log('UI.initSettingsDropdown: Event listener attached. Settings dropdown initialized.');
    } else {
        if (!settingsButton) console.error('UI.initSettingsDropdown: Settings button (#header-settings-button) not found.');
        if (!settingsDropdown) console.error('UI.initSettingsDropdown: Settings dropdown (#settings-dropdown) not found.');
    }
};

window.UI.initCartSummaryDropdown = function() {
    const cartButton = document.getElementById('header-cart-button');
    const cartDropdown = document.getElementById('cart-summary-dropdown');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const settingsDropdown = document.getElementById('settings-dropdown');

    if (cartButton && cartDropdown) {
        cartButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (avatarDropdown && !avatarDropdown.classList.contains('hidden')) avatarDropdown.classList.add('hidden');
            if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) settingsDropdown.classList.add('hidden');
            
            const authModalContainer = document.getElementById('auth-modal-container');
            if (authModalContainer && !authModalContainer.classList.contains('hidden') && typeof UI.hideAuthModal === 'function') {
                UI.hideAuthModal();
            }

            const isHidden = cartDropdown.classList.contains('hidden');
            if (isHidden) {
                if (window.Cart && typeof Cart.renderCartSummaryDropdown === 'function') {
                    Cart.renderCartSummaryDropdown(); 
                }
                
                cartDropdown.classList.remove('hidden');
                const btnRect = cartButton.getBoundingClientRect();
                cartDropdown.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
                cartDropdown.style.left = 'auto';
                cartDropdown.style.right = (window.innerWidth - btnRect.right - window.scrollX) + 'px';
                const dropdownRect = cartDropdown.getBoundingClientRect();
                if (dropdownRect.left < 0) { 
                    cartDropdown.style.right = 'auto';
                    cartDropdown.style.left = (btnRect.left + window.scrollX) + 'px';
                }
                console.log('Cart summary dropdown shown.');
            } else {
                cartDropdown.classList.add('hidden');
                console.log('Cart summary dropdown hidden.');
            }
        });
        console.log('Cart summary dropdown initialized.');
    } else {
        if (!cartButton) console.error('UI.initCartSummaryDropdown: Header cart button (#header-cart-button) not found.');
        if (!cartDropdown) console.error('UI.initCartSummaryDropdown: Cart summary dropdown (#cart-summary-dropdown) not found.');
    }
};

window.UI.initAvatarButton = function() { 
    const headerAvatarButton = document.getElementById('header-avatar-button');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const settingsDropdown = document.getElementById('settings-dropdown'); 
    const cartSummaryDropdown = document.getElementById('cart-summary-dropdown'); 

    if (headerAvatarButton) {
        headerAvatarButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const token = localStorage.getItem('authToken');

            if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) settingsDropdown.classList.add('hidden');
            if (cartSummaryDropdown && !cartSummaryDropdown.classList.contains('hidden')) cartSummaryDropdown.classList.add('hidden');

            if (!token) { 
                console.log('Avatar clicked, no token, showing auth modal.');
                if (avatarDropdown && !avatarDropdown.classList.contains('hidden')) avatarDropdown.classList.add('hidden');
                window.UI.showAuthModal();
            } else { 
                console.log('Avatar clicked, token found, toggling avatar dropdown.');
                if (avatarDropdown) {
                    const isHidden = avatarDropdown.classList.contains('hidden');
                    if (isHidden) {
                        avatarDropdown.classList.remove('hidden');
                        const btnRect = headerAvatarButton.getBoundingClientRect();
                        avatarDropdown.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
                        avatarDropdown.style.left = 'auto'; 
                        avatarDropdown.style.right = (window.innerWidth - btnRect.right - window.scrollX) + 'px';
                        var dropdownRect = avatarDropdown.getBoundingClientRect();
                        if (dropdownRect.left < 0) { 
                            avatarDropdown.style.right = 'auto'; 
                            avatarDropdown.style.left = (btnRect.left + window.scrollX) + 'px';
                        }
                        
                        if (window.Auth && Auth.cachedProfile && typeof window.UI.updateDropdownProfileCard === 'function') {
                            window.UI.updateDropdownProfileCard(Auth.cachedProfile);
                        }


                        const avatarTabs = avatarDropdown.querySelectorAll('.MuiTab-root');
                        const avatarTabPanels = avatarDropdown.querySelectorAll('[role="tabpanel"]');
                        if (avatarTabs.length > 0 && avatarTabPanels.length > 0) {
                            avatarTabs.forEach(tab => {
                                tab.addEventListener('click', function() {
                                    avatarTabs.forEach(t => t.classList.remove('Mui-selected'));
                                    this.classList.add('Mui-selected');
                                    const panelId = this.getAttribute('aria-controls');
                                    avatarTabPanels.forEach(panel => {
                                        if (panel.id === panelId) {
                                            panel.classList.remove('hidden');
                                        } else {
                                            panel.classList.add('hidden');
                                        }
                                    });
                                });
                            });
                            if (!avatarDropdown.querySelector('.MuiTab-root.Mui-selected')) {
                                avatarTabs[0].click();
                            }
                        }
                        
                        const avatarLogoutButton = document.getElementById('avatar-logout-button');
                        if (avatarLogoutButton && window.Auth && typeof Auth.handleLogout === 'function') {
                            if (!avatarLogoutButton.hasAttribute('data-logout-listener-attached')) {
                                avatarLogoutButton.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    Auth.handleLogout();
                                    avatarDropdown.classList.add('hidden'); 
                                });
                                avatarLogoutButton.setAttribute('data-logout-listener-attached', 'true');
                            }
                        }
                    } else {
                        avatarDropdown.classList.add('hidden');
                    }
                } else {
                    console.error('UI.initAvatarButton: Avatar dropdown element (#avatar-dropdown) not found.');
                }
            }
        });
        console.log('Avatar button initialized.');
    } else {
        console.error('UI.initAvatarButton: Header avatar button (#header-avatar-button) not found.');
    }

    if (!document.body.hasAttribute('data-global-click-listener-attached')) {
        document.addEventListener('click', function(event) {
            const authModalContainer = document.getElementById('auth-modal-container');
            if (authModalContainer && !authModalContainer.classList.contains('hidden')) {
                const clickedInsideModal = authModalContainer.contains(event.target);
                const clickedOnAvatarButton = headerAvatarButton && headerAvatarButton.contains(event.target);

                if (!clickedInsideModal && !clickedOnAvatarButton ) {
                     let shouldHideModal = true;
                     const activeDropdowns = [
                        document.getElementById('avatar-dropdown'),
                        document.getElementById('settings-dropdown'),
                        document.getElementById('cart-summary-dropdown')
                     ].filter(Boolean); 

                     for (const dropdown of activeDropdowns) {
                         if (dropdown.contains(event.target)) {
                             shouldHideModal = false; 
                             break;
                         }
                     }
                     const dropdownButtons = [
                        headerAvatarButton,
                        document.getElementById('header-settings-button'),
                        document.getElementById('header-cart-button')
                     ].filter(Boolean);
                     for (const btn of dropdownButtons) {
                         if (btn.contains(event.target)) {
                             shouldHideModal = false;
                             break;
                         }
                     }
                    if (shouldHideModal) UI.hideAuthModal();
                }
            }

            const currentAvatarDropdown = document.getElementById('avatar-dropdown');
            if (currentAvatarDropdown && !currentAvatarDropdown.classList.contains('hidden')) {
                if (headerAvatarButton && !headerAvatarButton.contains(event.target) && !currentAvatarDropdown.contains(event.target)) {
                    currentAvatarDropdown.classList.add('hidden');
                }
            }

            const currentSettingsDropdown = document.getElementById('settings-dropdown');
            const currentSettingsButton = document.getElementById('header-settings-button');
            if (currentSettingsDropdown && !currentSettingsDropdown.classList.contains('hidden')) {
                if (currentSettingsButton && !currentSettingsButton.contains(event.target) && !currentSettingsDropdown.contains(event.target)) {
                    currentSettingsDropdown.classList.add('hidden');
                }
            }
            
            const currentCartSummaryDropdown = document.getElementById('cart-summary-dropdown');
            const currentCartButton = document.getElementById('header-cart-button');
            if (currentCartSummaryDropdown && !currentCartSummaryDropdown.classList.contains('hidden')) {
                if (currentCartButton && !currentCartButton.contains(event.target) && !currentCartSummaryDropdown.contains(event.target)) {
                    currentCartSummaryDropdown.classList.add('hidden');
                }
            }
        });
        document.body.setAttribute('data-global-click-listener-attached', 'true');
        console.log('Global click listener for dropdowns initialized.');
    }
};

window.UI.updateActiveLanguageButton = function(activeLang) {
    const langEnButton = document.getElementById('lang-en-button');
    const langEsButton = document.getElementById('lang-es-button');
    const activeClass = 'active-lang-button'; 

    if (langEnButton && langEsButton) {
        if (activeLang === 'en') {
            langEnButton.classList.add(activeClass);
            langEsButton.classList.remove(activeClass);
        } else if (activeLang === 'es') {
            langEsButton.classList.add(activeClass);
            langEnButton.classList.remove(activeClass);
        } else { 
            langEnButton.classList.remove(activeClass);
            langEsButton.classList.remove(activeClass);
        }
    }
};

window.UI.initLanguageSwitcherButtons = function() {
    const langButtonsContainer = document.getElementById('language-buttons-container-dropdown');
    if (!langButtonsContainer) {
        return;
    }

    const langEnButton = document.getElementById('lang-en-button');
    const langEsButton = document.getElementById('lang-es-button');
    const settingsDropdown = document.getElementById('settings-dropdown');

    const handleLanguageChange = async (event) => {
        const button = event.target.closest('button[data-lang]');
        if (!button) return;

        const lang = button.dataset.lang;
        console.log(`Language button clicked: ${lang}`);

        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
            try {
                await window.i18n.setLanguage(lang); 
                console.log(`Language changed to ${lang} by i18n.setLanguage.`);
                UI.updateActiveLanguageButton(lang); 

                if (settingsDropdown) {
                    settingsDropdown.classList.add('hidden');
                }
            } catch (error) {
                console.error(`Error setting language to ${lang}:`, error);
                if (typeof UI.showNotification === 'function') {
                    UI.showNotification(`Failed to change language to ${lang}.`, 'error');
                } else {
                    alert(`Failed to change language to ${lang}.`);
                }
            }
        } else {
            console.error('i18n object or setLanguage function is not available.');
        }
    };

    if (langEnButton) {
        langEnButton.addEventListener('click', handleLanguageChange);
    }
    if (langEsButton) {
        langEsButton.addEventListener('click', handleLanguageChange);
    }
    console.log('Language switcher (in dropdown) initialized.');
};

window.UI.showNotification = function(message, type = 'info', duration = 3000) {
    let notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        Object.assign(notificationArea.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '2000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(notificationArea);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`; 
    notification.textContent = message;

    Object.assign(notification.style, {
        padding: '10px 20px',
        borderRadius: '5px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        opacity: '0.95',
        transition: 'opacity 0.5s ease-in-out'
    });
    if (type === 'error') {
        notification.style.backgroundColor = 'var(--error-red, #dc3545)';
    } else if (type === 'success') {
        notification.style.backgroundColor = 'var(--success-green, #28a745)';
    } else { 
        notification.style.backgroundColor = 'var(--accent-blue, #3B82F6)';
    }

    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
            if (notificationArea.children.length === 0) {
            }
        }, 500); 
    }, duration);
};

console.log('ui.js loaded with all UI component initializers.');
