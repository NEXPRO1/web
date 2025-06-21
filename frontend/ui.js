// frontend/ui.js

// Initialize window.UI if it doesn't exist
window.UI = window.UI || {};

// --- Modal State and Functions ---
window.UI.isAuthModalLoaded = false;

window.UI.loadAuthModalHTML = async function() { // Corrected assignment syntax
    if (window.UI.isAuthModalLoaded) {
        // Si el HTML ya se cargó una vez, no es necesario volver a cargarlo.
        // La inicialización de la animación ya debería haber ocurrido.
        // Si se necesita reiniciar la animación o el estado del modal (ej. panel activo)
        // cada vez que se muestra, esa lógica iría en showAuthModal o
        // initializeAuthModalAnimation debería ser idempotente o tener una función de reseteo.
        // Por ahora, asumimos que la inicialización de la animación solo necesita ocurrir una vez.
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
            modalContainer.innerHTML = html; // Inyectar el contenido del modal
            window.UI.isAuthModalLoaded = true; // Marcar como cargado
            console.log('Auth modal HTML successfully loaded into #auth-modal-container.');
            
            // Llamar a la función de animación DESPUÉS de inyectar el HTML
            if (typeof initializeAuthModalAnimation === 'function') {
                initializeAuthModalAnimation(); 
            } else {
                console.error('initializeAuthModalAnimation function not found. Ensure login-modal.js is loaded and defines it.');
            }

            // ---> ADDING THIS <---
            const closeButton = document.getElementById('close-auth-modal-btn');
            if (closeButton) {
                closeButton.addEventListener('click', UI.hideAuthModal); 
                console.log('Event listener for #close-auth-modal-btn added.');
            } else {
                console.warn('#close-auth-modal-btn not found in modal HTML after injection.');
            }
            // ---> END OF ADDING <---

            return Promise.resolve();
        } else {
            console.error('#auth-modal-container element not found in DOM. Cannot inject modal HTML.');
            window.UI.isAuthModalLoaded = false; 
            return Promise.reject(new Error('Modal container #auth-modal-container not found'));
        }
    } catch (error) {
        console.error('Error in UI.loadAuthModalHTML:', error);
        window.UI.isAuthModalLoaded = false;
        return Promise.reject(error); // Re-lanzar el error para que showAuthModal lo maneje
    }
}; // Removed trailing comma, added semicolon for statement

window.UI.showAuthModal = async function() {
    // The new modal structure uses #auth-modal-container
    const modalContainer = document.getElementById('auth-modal-container'); 
    
    if (!modalContainer) {
        console.error('#auth-modal-container not found, cannot show modal.');
        return;
    }

    try {
        // Ensure HTML is "loaded" (i.e., references are ready, especially if it was ever dynamic)
        await window.UI.loadAuthModalHTML(); 
        
        // Forms inside #auth-modal-container should have IDs:
        // modal-register-form (if we add it later to the form tag) // These IDs are now on the forms
        // modal-login-form (if we add it later to the form tag)   // These IDs are now on the forms
        
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
        
        modalContainer.classList.remove('hidden'); // modalContainer es #auth-modal-container
        // The new modal has its own animation system via login-modal.js,
        // so we don't need to add/remove classes like 'active' on the container itself here.
        // The #container inside #auth-modal-container handles its own state.

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
        // If the modal has internal state that needs resetting (like active panel),
        // login-modal.js should handle that or expose a reset function.
        console.log('Auth modal hidden by ui.js (using #auth-modal-container).');
    }
};

// --- Sidebar Toggle Logic ---
window.UI.initSidebarToggle = function() {
    const sidebarToggleButton = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    // const mainContent = document.getElementById('main-content'); // Not strictly needed if using body class

    if (sidebarToggleButton && sidebar) {
        sidebarToggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
            document.body.classList.toggle('sidebar-content-shifted');
            sidebarToggleButton.classList.toggle('sidebar-toggle-active'); // For icon animation
            console.log('Sidebar toggled. Sidebar hidden:', sidebar.classList.contains('hidden'));
        });
        console.log('Sidebar toggle initialized.');
    } else {
        if (!sidebarToggleButton) console.error('UI.initSidebarToggle: Sidebar toggle button (#sidebar-toggle) not found.');
        if (!sidebar) console.error('UI.initSidebarToggle: Sidebar element (#sidebar) not found.');
    }
};


// --- Floating Buttons Logic (Old - to be removed or updated if FloatingButtons module takes over) ---
// This function seems to be from an older implementation plan.
// The new FloatingButtons module (floatingButtons.js) has its own fetchAndRender.
// This UI.fetchAndRenderFloatingButtons should likely be deprecated/removed.
// For now, I will leave it as is, as the subtask doesn't explicitly say to remove it,
// but it's a point of potential conflict or redundancy.
window.UI.fetchAndRenderFloatingButtons = async function() {
    console.warn("UI.fetchAndRenderFloatingButtons is likely deprecated. Functionality moved to FloatingButtons.js");
    // ... (original content of this function) ...
};

// --- Theme Switcher Logic ---
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


// --- Settings Dropdown Logic ---
window.UI.initSettingsDropdown = function() {
    const settingsButton = document.getElementById('header-settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const avatarDropdown = document.getElementById('avatar-dropdown'); 
    const cartSummaryDropdown = document.getElementById('cart-summary-dropdown');

    if (settingsButton && settingsDropdown) {
        settingsDropdown.classList.add('hidden'); // <--- LÍNEA AÑADIDA
        console.log('UI.initSettingsDropdown: Ensured #settings-dropdown is hidden at initialization of its listener.'); // <--- LÍNEA AÑADIDA
            
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

            console.log('UI.initSettingsDropdown: Click handler - Current classes on #settings-dropdown before DwasHidden check:', settingsDropdown.className); // NUEVO LOG
            console.log('UI.initSettingsDropdown: Click handler - Does it contain "hidden"?', settingsDropdown.classList.contains('hidden')); // NUEVO LOG
            const DwasHidden = settingsDropdown.classList.contains('hidden'); // Estado ANTES de alternar
            settingsDropdown.classList.toggle('hidden'); // Alternar la clase
            const DisNowHidden = settingsDropdown.classList.contains('hidden'); // Estado DESPUÉS de alternar

            // Actualizar los console.log para reflejar el estado antes y después del toggle
            console.log(`UI.initSettingsDropdown: Settings dropdown - WasHidden: ${DwasHidden}, IsNowHidden: ${DisNowHidden}`);

            if (!DisNowHidden) { // Si el dropdown NO está oculto ahora (es decir, se acaba de mostrar)
                console.log('UI.initSettingsDropdown: Dropdown is now visible, proceeding to position.');
                try {
                    const btnRect = settingsButton.getBoundingClientRect(); // settingsButton debe estar en el scope del listener
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
                    settingsDropdown.classList.add('hidden'); // Ocultar si hay error de posición
                    console.log('UI.initSettingsDropdown: Settings dropdown hidden due to positioning error.');
                }
            } else { // Si el dropdown SÍ está oculto ahora (es decir, se acaba de ocultar)
                console.log('UI.initSettingsDropdown: Settings dropdown is now hidden.');
            }
        });
        console.log('UI.initSettingsDropdown: Event listener attached. Settings dropdown initialized.');
    } else {
        if (!settingsButton) console.error('UI.initSettingsDropdown: Settings button (#header-settings-button) not found.');
        if (!settingsDropdown) console.error('UI.initSettingsDropdown: Settings dropdown (#settings-dropdown) not found.');
    }
};

// --- Cart Summary Dropdown Logic ---
window.UI.initCartSummaryDropdown = function() {
    const cartButton = document.getElementById('header-cart-button');
    const cartDropdown = document.getElementById('cart-summary-dropdown');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const settingsDropdown = document.getElementById('settings-dropdown');

    if (cartButton && cartDropdown) {
        cartButton.addEventListener('click', function(event) {
            event.stopPropagation();
            // Hide other dropdowns
            if (avatarDropdown && !avatarDropdown.classList.contains('hidden')) avatarDropdown.classList.add('hidden');
            if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) settingsDropdown.classList.add('hidden');
            
            const authModalContainer = document.getElementById('auth-modal-container');
            if (authModalContainer && !authModalContainer.classList.contains('hidden') && typeof UI.hideAuthModal === 'function') {
                UI.hideAuthModal();
            }

            const isHidden = cartDropdown.classList.contains('hidden');
            if (isHidden) {
                if (window.Cart && typeof Cart.renderCartSummaryDropdown === 'function') {
                    Cart.renderCartSummaryDropdown(); // Ensure content is up-to-date
                }
                
                cartDropdown.classList.remove('hidden');
                const btnRect = cartButton.getBoundingClientRect();
                cartDropdown.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
                cartDropdown.style.left = 'auto';
                cartDropdown.style.right = (window.innerWidth - btnRect.right - window.scrollX) + 'px';
                const dropdownRect = cartDropdown.getBoundingClientRect();
                if (dropdownRect.left < 0) { // Prevent going off-screen left
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


// --- Avatar Button Logic (and Global Click Listener) ---
window.UI.initAvatarButton = function() { // This function also initializes the global click listener
    const headerAvatarButton = document.getElementById('header-avatar-button');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const settingsDropdown = document.getElementById('settings-dropdown'); 
    const cartSummaryDropdown = document.getElementById('cart-summary-dropdown'); // Added for awareness

    if (headerAvatarButton) {
        headerAvatarButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const token = localStorage.getItem('authToken');

            // Hide other dropdowns
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
                        const userNameElement = avatarDropdown.querySelector('#avatar-dropdown-username');
                        if (userNameElement) userNameElement.textContent = localStorage.getItem('userName') || 'User';
                        const userImageElement = avatarDropdown.querySelector('#avatar-dropdown-user-image');
                        if (userImageElement) userImageElement.src = localStorage.getItem('userAvatarUrl') || 'logo.png'; // Fallback to logo.png
                        const userEmailElement = avatarDropdown.querySelector('#avatar-dropdown-user-email');
                        if (userEmailElement && typeof Auth !== 'undefined' && Auth.cachedProfile) userEmailElement.textContent = Auth.cachedProfile.email || 'email@example.com';


                        // Initialize tabs for avatar dropdown if they exist
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
                            // Activate the first tab by default if none are selected
                            if (!avatarDropdown.querySelector('.MuiTab-root.Mui-selected')) {
                                avatarTabs[0].click();
                            }
                        }
                        
                        // Attach listener for avatar dropdown's logout button
                        const avatarLogoutButton = document.getElementById('avatar-logout-button');
                        if (avatarLogoutButton && window.Auth && typeof Auth.handleLogout === 'function') {
                            // Check if listener already attached to prevent duplicates if initAvatarButton is called multiple times
                            if (!avatarLogoutButton.hasAttribute('data-logout-listener-attached')) {
                                avatarLogoutButton.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    Auth.handleLogout();
                                    avatarDropdown.classList.add('hidden'); // Hide dropdown after logout
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

    // Consolidated Global Click Listener (ensure it runs only once)
    if (!document.body.hasAttribute('data-global-click-listener-attached')) {
        document.addEventListener('click', function(event) {
            const authModalContainer = document.getElementById('auth-modal-container');
            // Check if click is outside the auth modal and not on any button that opens a dropdown
            if (authModalContainer && !authModalContainer.classList.contains('hidden')) {
                const clickedInsideModal = authModalContainer.contains(event.target);
                const clickedOnAvatarButton = headerAvatarButton && headerAvatarButton.contains(event.target);
                // Add checks for other potential modal openers if necessary

                if (!clickedInsideModal && !clickedOnAvatarButton /* && !clickedOnOtherModalOpener */) {
                     // Only hide if the click is truly outside interactive elements that manage their own state.
                     // For example, if a dropdown is open, its own logic should handle clicks on its button.
                     // This global listener is more for clicks on the body itself.
                     let shouldHideModal = true;
                     const activeDropdowns = [
                        document.getElementById('avatar-dropdown'),
                        document.getElementById('settings-dropdown'),
                        document.getElementById('cart-summary-dropdown')
                     ].filter(Boolean); // Remove nulls if some don't exist

                     for (const dropdown of activeDropdowns) {
                         if (dropdown.contains(event.target)) {
                             shouldHideModal = false; // Click was inside an open dropdown
                             break;
                         }
                     }
                     // Also check if click was on any of the buttons that toggle these dropdowns
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

            // Close Avatar Dropdown
            const currentAvatarDropdown = document.getElementById('avatar-dropdown');
            if (currentAvatarDropdown && !currentAvatarDropdown.classList.contains('hidden')) {
                if (headerAvatarButton && !headerAvatarButton.contains(event.target) && !currentAvatarDropdown.contains(event.target)) {
                    currentAvatarDropdown.classList.add('hidden');
                }
            }

            // Close Settings Dropdown
            const currentSettingsDropdown = document.getElementById('settings-dropdown');
            const currentSettingsButton = document.getElementById('header-settings-button');
            if (currentSettingsDropdown && !currentSettingsDropdown.classList.contains('hidden')) {
                if (currentSettingsButton && !currentSettingsButton.contains(event.target) && !currentSettingsDropdown.contains(event.target)) {
                    currentSettingsDropdown.classList.add('hidden');
                }
            }
            
            // Close Cart Summary Dropdown (Modified part)
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

// --- Language Switcher Logic ---
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
        // console.log(`Active language button updated to: ${activeLang}`); // Can be noisy
    }
};

window.UI.initLanguageSwitcherButtons = function() {
    const langButtonsContainer = document.getElementById('language-buttons-container-dropdown');
    if (!langButtonsContainer) {
        // console.warn('Language buttons container (#language-buttons-container-dropdown) not found.');
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

// Notification System (Basic Example)
window.UI.showNotification = function(message, type = 'info', duration = 3000) {
    let notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        // Basic styling for notification area (should be in CSS)
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
    notification.className = `notification notification-${type}`; // Use classes for styling
    notification.textContent = message;

    // More styling (should be in CSS ideally)
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
    } else { // info or default
        notification.style.backgroundColor = 'var(--accent-blue, #3B82F6)';
    }

    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
            if (notificationArea.children.length === 0) {
                // Optionally remove notificationArea if empty, or keep it.
                // notificationArea.remove(); 
            }
        }, 500); // Allow time for fade out
    }, duration);
};

function updateSidebarProfileCard(profile) {
    // Avatar y nombre
    document.getElementById('dropdown-profile-avatar').src = profile.avatar_url || 'https://netfly.s3.sa-east-1.amazonaws.com/u/demo/images/avatar/IM9pP2hNkPUkltS7MxSAazgDeHvcjPf0YqBzngHs.jpg';
    document.getElementById('dropdown-profile-name').textContent = profile.name || 'Usuario';

    // Conteo de afiliados
    document.getElementById('dropdown-profile-affiliates').textContent = profile.total_affiliates || '0';

    // URL de afiliado funcional
    const affiliateUrl = `${window.location.origin}/?ref=${encodeURIComponent(profile.affiliate_id)}`;
    const urlElem = document.getElementById('dropdown-profile-url');
    urlElem.href = affiliateUrl;
    urlElem.textContent = affiliateUrl;

    // % de ganancia
    document.getElementById('dropdown-profile-commission').textContent = (profile.commission_percent ? profile.commission_percent + '%' : '0%');
}

// Ejemplo de uso después de obtener el perfil (ajusta según tu backend):
const userProfile = {
    avatar_url: localStorage.getItem('userAvatarUrl'),
    name: localStorage.getItem('userName'),
    affiliate_id: localStorage.getItem('userAffiliateId') || 'demo123', // Debes obtenerlo de tu backend
    total_affiliates: 12, // Debes obtenerlo de tu backend
    commission_percent: 10 // Debes obtenerlo de tu backend
};
updateSidebarProfileCard(userProfile);

console.log('ui.js loaded with all UI component initializers.');
