// admin.js

const API_BASE_URL = 'http://localhost:3000/api'; // Global for this script

const AdminFloatingButtons = {
    listElement: null,
    formElement: null,
    messageElement: null,
    token: null,

    init: function(apiToken) {
        this.listElement = document.getElementById('existing-floating-buttons-list');
        this.formElement = document.getElementById('add-floating-button-form');
        this.messageElement = document.getElementById('add-fb-message');
        this.token = apiToken;

        if (!this.listElement || !this.formElement || !this.messageElement) {
            console.error('Required elements for Floating Buttons admin section not found. Section will not be initialized.');
            return;
        }

        this.formElement.addEventListener('submit', this.handleAddSubmit.bind(this));
        this.loadExistingButtons();
        console.log('AdminFloatingButtons initialized.');
    },

    loadExistingButtons: async function() {
        if (!this.listElement || !this.token) {
            console.error('Cannot load buttons: listElement or token missing.');
            if(this.listElement) this.listElement.innerHTML = '<p style="color: red;">Initialization error for button list.</p>';
            return;
        }
        this.listElement.innerHTML = `<p>${i18n.getTranslation("text_loading_buttons", "Loading buttons...")}</p>`;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/floating-buttons`, { // Use global API_BASE_URL
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load floating buttons.');
            }

            this.listElement.innerHTML = ''; 
            if (data.length === 0) {
                this.listElement.innerHTML = `<p>${i18n.getTranslation("text_no_floating_buttons", "No floating buttons configured yet.")}</p>`;
                return;
            }

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';

            data.forEach(button => {
                const li = document.createElement('li');
                li.style.marginBottom = '10px';
                li.style.padding = '10px';
                li.style.border = '1px solid #ccc'; // Use theme variable later: var(--border-gray)
                li.style.borderRadius = '4px';
                li.innerHTML = `
                    <img src="${button.button_image_url}" alt="Button Image" style="width: 40px; height: 40px; vertical-align: middle; margin-right: 10px; border-radius: 4px;">
                    <strong>Tag:</strong> ${button.target_tag} <br>
                    <strong>Tooltip:</strong> ${button.tooltip_text || 'N/A'} <br>
                    <strong>Orden:</strong> ${button.sort_order}
                    <button class="delete-fb-btn" data-id="${button.id}" style="margin-left: 15px; background-color: var(--error-red, #dc3545); color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">
                        ${i18n.getTranslation("btn_delete", "Delete")}
                    </button>
                `;
                ul.appendChild(li);
            });
            this.listElement.appendChild(ul);

            this.listElement.querySelectorAll('.delete-fb-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleDelete(e.target.dataset.id));
            });

        } catch (error) {
            console.error('Error loading floating buttons:', error);
            this.listElement.innerHTML = `<p style="color: var(--error-red, red);">${i18n.getTranslation("error_loading_buttons", "Error loading buttons:")} ${error.message}</p>`;
        }
    },

    handleAddSubmit: async function(event) {
        event.preventDefault();
        if (!this.formElement || !this.token || !this.messageElement) return;

        this.messageElement.textContent = i18n.getTranslation("text_processing", "Processing...");
        this.messageElement.style.color = 'var(--text-muted)';

        const formData = new FormData(this.formElement);
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/floating-buttons`, { // Use global API_BASE_URL
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add floating button.');
            }

            this.messageElement.textContent = result.message || i18n.getTranslation("text_button_added_success", "Button added successfully!");
            this.messageElement.style.color = 'var(--success-green)';
            this.formElement.reset();
            this.loadExistingButtons(); 

        } catch (error) {
            console.error('Error adding floating button:', error);
            this.messageElement.textContent = `${i18n.getTranslation("text_error", "Error:")} ${error.message}`;
            this.messageElement.style.color = 'var(--error-red)';
        }
    },

    handleDelete: async function(buttonId) {
        if (!this.token || !this.messageElement) return;
        
        const confirmDelete = confirm(i18n.getTranslation("confirm_delete_button", "Are you sure you want to delete floating button with ID {buttonId}?").replace("{buttonId}", buttonId));
        if (!confirmDelete) {
            return;
        }

        this.messageElement.textContent = i18n.getTranslation("text_deleting", "Deleting...");
        this.messageElement.style.color = 'var(--text-muted)';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/floating-buttons/${buttonId}`, { // Use global API_BASE_URL
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete floating button.');
            }
            this.messageElement.textContent = result.message || i18n.getTranslation("text_button_deleted_success", "Button deleted successfully.");
            this.messageElement.style.color = 'var(--success-green)';
            this.loadExistingButtons();

        } catch (error) {
            console.error('Error deleting floating button:', error);
            this.messageElement.textContent = `${i18n.getTranslation("text_error", "Error:")} ${error.message}`;
            this.messageElement.style.color = 'var(--error-red)';
        }
    }
};


document.addEventListener('DOMContentLoaded', async () => { 
    if (typeof i18n !== 'undefined' && typeof i18n.initializeI18n === 'function') {
        await i18n.initializeI18n(); 
        // Translate static text after i18n is ready
        if (typeof i18n.translatePage === 'function') {
            i18n.translatePage();
        }
    } else {
        console.error("i18n module not loaded correctly for admin.js.");
    }

    const languageSelectAdmin = document.getElementById('language-select-admin'); 
    const adminEmailDisplay = document.getElementById('admin-email-display');
    const adminLogoutButton = document.getElementById('admin-logout-button');
    const addProductForm = document.getElementById('add-product-form-admin');
    const addProductMessage = document.getElementById('add-product-message-admin');
    var adminSidebar = document.getElementById('sidebar'); 
    var adminSidebarToggle = document.getElementById('sidebar-toggle');
    const adminNav = document.getElementById('admin-nav');
    const adminSections = document.querySelectorAll('.admin-section');


    // Admin section navigation
    if (adminNav) {
        adminNav.style.display = 'flex'; // Make nav visible now that JS is controlling sections
        const navLinks = adminNav.querySelectorAll('a[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetSectionId = link.dataset.section;
                
                adminSections.forEach(section => {
                    if (section.id === targetSectionId) {
                        section.classList.remove('hidden');
                    } else {
                        section.classList.add('hidden');
                    }
                });

                // If navigating to floating buttons, ensure they are loaded
                if (targetSectionId === 'admin-floating-buttons-section' && AdminFloatingButtons.listElement) {
                    AdminFloatingButtons.loadExistingButtons();
                }
                // Add similar conditions for other sections if they need data refresh on view
            });
        });
        // Default to showing the first linked section (if any) or a specific one
        if (navLinks.length > 0) {
            const defaultSectionId = navLinks[0].dataset.section; // Default to first nav item's section
            document.getElementById(defaultSectionId)?.classList.remove('hidden');
        }
    }


    async function initializeAdminPage() {
        const userSpecificHeaderButtonIds = [
            'header-credits-button', 'header-tasks-button', 
            'header-cart-button', 'header-avatar-button'
        ];
        const token = localStorage.getItem('authToken');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';

        if (!token || !isAdmin) {
            window.location.href = 'index.html';
            return; 
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(i18n.getTranslation("error_session_expired_or_invalid", "Session expired or invalid."));
            }
            const profileData = await response.json();
            if (!profileData.isAdmin) {
                localStorage.clear(); // Clear all auth related data
                window.location.href = 'index.html'; 
                return;
            }
            if (adminEmailDisplay) {
                adminEmailDisplay.textContent = profileData.email || 'Admin';
            }
            // Initialize modules that require admin token
            AdminFloatingButtons.init(token);

        } catch (error) {
            console.error('Admin auth check failed:', error);
            localStorage.clear();
            window.location.href = 'index.html'; 
            return;
        }

        if (adminLogoutButton) {
            adminLogoutButton.addEventListener('click', handleAdminLogout);
        }
        if (addProductForm) {
            addProductForm.addEventListener('submit', handleAddProduct);
        }

        if (adminSidebarToggle && adminSidebar) {
            adminSidebarToggle.addEventListener('click', function() {
                adminSidebar.classList.toggle('hidden');
                document.body.classList.toggle('sidebar-content-shifted');
                const isAdminSidebarNowHidden = adminSidebar.classList.contains('hidden');
                adminSidebarToggle.classList.toggle('sidebar-toggle-active', !isAdminSidebarNowHidden);
                adminSidebarToggle.setAttribute('aria-expanded', String(!isAdminSidebarNowHidden));
            });
            
            adminSidebar.classList.add('hidden'); 
            adminSidebarToggle.classList.remove('hidden');      
            adminSidebarToggle.classList.remove('sidebar-toggle-active'); 
            adminSidebarToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('sidebar-content-shifted'); 
        }

        userSpecificHeaderButtonIds.forEach(function(buttonId) {
            var button = document.getElementById(buttonId);
            if (button) button.classList.remove('hidden');
        });
    }

    async function handleAddProduct(event) {
        event.preventDefault();
        if (!addProductMessage) return;
        addProductMessage.textContent = ''; 
        addProductMessage.style.color = 'inherit'; 

        const token = localStorage.getItem('authToken');
        if (!token) {
            addProductMessage.textContent = i18n.getTranslation("admin_auth_error_login_again", "Authentication error. Please log in again.");
            addProductMessage.style.color = 'red';
            return;
        }

        const name = document.getElementById('product-name-admin').value;
        const description = document.getElementById('product-description-admin').value;
        const price = document.getElementById('product-price-admin').value;
        const imageFile = document.getElementById('product-image-file-admin').files[0];
        const category = document.getElementById('product-category-admin').value;

        if (!name || !price) {
            addProductMessage.textContent = i18n.getTranslation("admin_error_product_name_price_required", "Product Name and Price are required.");
            addProductMessage.style.color = 'red';
            return;
        }
        if (parseFloat(price) <= 0) {
            addProductMessage.textContent = i18n.getTranslation("admin_error_price_must_be_positive", "Price must be a positive number.");
            addProductMessage.style.color = 'red';
            return;
        }

        var formData = new FormData();
        formData.append('name', name);
        formData.append('description', description || '');
        formData.append('price', parseFloat(price));
        formData.append('category', category || '');     

        if (imageFile) {
            formData.append('productImage', imageFile, imageFile.name);
        }

        var fetchOptions = {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/products`, fetchOptions);
            const result = await response.json();

            if (response.ok) {
                addProductMessage.textContent = i18n.getTranslation("admin_text_product_added_success_dynamic", "Product '{productName}' (ID: {productId}) added successfully!")
                                                    .replace("{productName}", result.product.name)
                                                    .replace("{productId}", result.product.id);
                addProductMessage.style.color = 'green';
                if(addProductForm) addProductForm.reset();
            } else {
                addProductMessage.textContent = i18n.getTranslation("admin_error_product_add_reason", "Error: {reason}")
                                                    .replace("{reason}", result.message || response.statusText);
                addProductMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Failed to add product:', error);
            addProductMessage.textContent = i18n.getTranslation("admin_error_failed_to_add_product_console", "Failed to add product. See console for details.");
            addProductMessage.style.color = 'red';
        }
    }

    function handleAdminLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userName'); 
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userAvatarUrl');
        
        if (adminSidebar) {
            adminSidebar.classList.add('hidden');
            document.body.classList.remove('sidebar-content-shifted'); 
        }
        if (adminSidebarToggle) {
            adminSidebarToggle.classList.add('hidden');
            adminSidebarToggle.classList.remove('sidebar-toggle-active');
            adminSidebarToggle.setAttribute('aria-expanded', 'false');
        }
        
        var userSpecificHeaderButtonIds = [ 
            'header-credits-button', 'header-tasks-button',
            'header-cart-button', 'header-avatar-button'
        ];
        userSpecificHeaderButtonIds.forEach(function(buttonId) {
            var button = document.getElementById(buttonId);
            if (button) button.classList.add('hidden');
        });
        window.location.href = 'index.html';
    }

    initializeAdminPage();

    if (languageSelectAdmin) {
        languageSelectAdmin.addEventListener('change', (event) => {
            if (typeof i18n !== 'undefined' && typeof i18n.setLanguage === 'function') {
                i18n.setLanguage(event.target.value).then(() => {
                    // Re-translate static elements after language change
                    if (typeof i18n.translatePage === 'function') {
                        i18n.translatePage();
                    }
                    // If any dynamic content needs re-rendering (like the button list if it has translatable text from DB)
                    if (AdminFloatingButtons.listElement && !document.getElementById('admin-floating-buttons-section').classList.contains('hidden')) {
                       AdminFloatingButtons.loadExistingButtons();
                    }
                });
            }
        });
        if (typeof i18n !== 'undefined' && i18n.currentLanguage) {
            languageSelectAdmin.value = i18n.currentLanguage;
        }
    }
});
