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
       if (!this.container || !this.imageContainer) return;

       const buttons = this.container.querySelectorAll('.floating-button');
       if (buttons.length === 0) return;

       const containerWidth = this.imageContainer.offsetWidth;
       const containerHeight = this.imageContainer.offsetHeight;

       // Obtén el tamaño real del botón (ya adaptado por CSS/media query)
       let sampleButton = buttons[0];
       let actualButtonSize = sampleButton.offsetWidth;

       let effectivePadding;
       // actualButtonSize es leído de buttons[0].offsetWidth.
       // El CSS define width: 44px para containerWidth <= 600px, y 100px para > 600px.
       if (actualButtonSize <= 44) { // Aproximadamente containerWidth <= 600px
           effectivePadding = -10;
       } else if (containerWidth <= 1023) { // Pantallas medianas (donde actualButtonSize es 100px)
           effectivePadding = -75;
       } else { // Pantallas grandes (donde actualButtonSize es 100px)
           effectivePadding = -65;
       }
       
       const centerX = containerWidth / 2;
       const centerY = containerHeight / 2;
       
       // Calcula el radio para que los botones nunca se salgan
       let radiusX = (containerWidth / 2) - (actualButtonSize / 2) - effectivePadding;
       let radiusY = (containerHeight / 2) - (actualButtonSize / 2) - effectivePadding;

       if (radiusX < 0) radiusX = 0;
       if (radiusY < 0) radiusY = 0;

       const totalButtons = buttons.length;

       buttons.forEach((button, index) => {
           // Usa el tamaño real del botón
           button.style.width = actualButtonSize + 'px';
           button.style.height = actualButtonSize + 'px';

           // Distribución circular
           const angle = (index / totalButtons) * 2 * Math.PI;
           const x = centerX + radiusX * Math.cos(angle);
           const y = centerY + radiusY * Math.sin(angle);

           button.style.left = (x - actualButtonSize / 2) + 'px';
           button.style.top = (y - actualButtonSize / 2) + 'px';
       });
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
