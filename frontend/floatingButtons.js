// frontend/floatingButtons.js
console.log('floatingButtons.js loaded');

window.FloatingButtons = {
    container: null,
    imageContainer: null, // Added reference to the image container
    apiBaseUrl: window.API_BASE_URL || '/api',

    init: function() {
        this.container = document.getElementById('floating-buttons-container');
        this.imageContainer = document.getElementById('main-image-container'); // Initialize image container
        
        if (!this.container || !this.imageContainer) {
            console.error('Required containers (#floating-buttons-container or #main-image-container) not found.');
            return;
        }
        this.fetchAndRender();
    },

    fetchAndRender: async function() {
        if (!this.container) return;
        this.container.innerHTML = ''; // Limpiar por si se llama varias veces

        try {
            const response = await fetch(`${this.apiBaseUrl}/floating-buttons`);
            if (!response.ok) {
                throw new Error(`Failed to fetch floating buttons: ${response.status}`);
            }
            const buttonsData = await response.json();

            if (buttonsData.length === 0) {
                console.log('No floating buttons to display.');
                return;
            }

            buttonsData.forEach((buttonData, index) => {
                const buttonElement = document.createElement('button');
                buttonElement.classList.add('floating-button');
                buttonElement.id = `floating-button-${buttonData.id || index}`;
                buttonElement.dataset.targetTag = buttonData.target_tag;
                
                if (buttonData.tooltip_text) {
                    buttonElement.title = buttonData.tooltip_text;
                }

                buttonElement.style.backgroundImage = `url('${buttonData.button_image_url}')`;
                
                buttonElement.addEventListener('click', this.handleButtonClick.bind(this));

                this.container.appendChild(buttonElement);
            });
            
            console.log(`${buttonsData.length} floating buttons rendered.`);

            // Position buttons after they are rendered and in the DOM
            if (buttonsData && buttonsData.length > 0) {
                 setTimeout(() => {
                    this.positionButtons();
                 }, 0); // Timeout 0 to allow browser repaint/reflow
            }

        } catch (error) {
            console.error('Error fetching or rendering floating buttons:', error);
            if (this.container) { 
                this.container.innerHTML = `<p style="color:red; text-align:center;">Error al cargar botones flotantes.</p>`;
            }
            if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function' && typeof i18n !== 'undefined') {
                 UI.showNotification(i18n.getTranslation('error_loading_floating_buttons', 'Could not load special buttons.'), 'error');
            }
        }
    },
    
    positionButtons: function() {
        if (!this.container || !this.imageContainer) {
            console.warn('Cannot position buttons: container or imageContainer not found/initialized.');
            return;
        }

        const buttons = this.container.querySelectorAll('.floating-button');
        if (buttons.length === 0) {
            // console.log('No buttons to position.'); // Not necessarily an error, can be logged if needed during dev
            return;
        }

        const containerWidth = this.imageContainer.offsetWidth;
        const containerHeight = this.imageContainer.offsetHeight;
        
        if (containerWidth === 0 || containerHeight === 0) {
            console.warn('Image container has no dimensions. Cannot position floating buttons yet. Retrying in 100ms.');
            // Retry once after a short delay, maybe image wasn't fully loaded/displayed
            // Clear any existing timeout to avoid multiple retries stacking up if called rapidly
            if (this.positionRetryTimeout) clearTimeout(this.positionRetryTimeout);
            this.positionRetryTimeout = setTimeout(() => this.positionButtons(), 100);
            return;
        }
        if (this.positionRetryTimeout) clearTimeout(this.positionRetryTimeout); // Clear retry if successful

        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        
        // Radius: 80% of the semi-minor axis for an elliptical distribution within the image.
        // Or a fixed value. For now, let's use a percentage of the container.
        let radiusX = centerX * 0.80; 
        let radiusY = centerY * 0.80;

        const totalButtons = buttons.length;

        buttons.forEach((button, index) => {
            const angle = (index / totalButtons) * 2 * Math.PI; // Angle in radians

            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);

            // Ensure button has dimensions. If not, log and skip (or use default like 80x80)
            let buttonWidth = button.offsetWidth;
            let buttonHeight = button.offsetHeight;

            if(buttonWidth === 0 || buttonHeight === 0) {
                // Fallback if offsetWidth/Height is 0 (e.g. display:none, though CSS is position:absolute)
                // This might happen if called too early or CSS issues.
                // Let's assume 80px as per CSS if not available.
                // console.warn(`Button ${button.id} has no dimensions, using default 80px for positioning.`);
                buttonWidth = 80; 
                buttonHeight = 80;
            }

            button.style.left = (x - buttonWidth / 2) + 'px';
            button.style.top = (y - buttonHeight / 2) + 'px';
        });
        // console.log(`${totalButtons} floating buttons positioned.`); // Can be too verbose for resize
    },

    handleButtonClick: function(event) {
        event.preventDefault(); 
        const buttonElement = event.currentTarget;
        const targetTag = buttonElement.dataset.targetTag;

        if (targetTag) {
            console.log(`Floating button clicked! Redirecting to tag: ${targetTag}`);
            let targetPage = "index.html"; 
            const newUrl = `${targetPage}?tag=${encodeURIComponent(targetTag)}`;
            window.location.href = newUrl;
        } else {
            console.warn('Floating button clicked, but no targetTag found on dataset.');
        }
    }
};
