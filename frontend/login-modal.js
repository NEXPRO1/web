// Contenido para frontend/login-modal.js
// Este script maneja la animación interna del modal de autenticación.
// Se asumirá que este script se carga después de que el HTML del modal esté en el DOM.

function initializeAuthModalAnimation() {
    const signUpButton = document.getElementById('modalSignUp');
    const signInButton = document.getElementById('modalSignIn');
    const container = document.getElementById('modal-auth-container'); // ID del contenedor principal del modal

    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add('right-panel-active');
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove('right-panel-active');
        });
        console.log('Auth modal animation listeners attached.');
    } else {
        console.error('Could not find elements for modal animation:', signUpButton, signInButton, container);
    }
}

// La función initializeAuthModalAnimation() deberá ser llamada
// después de que el contenido de login-modal.html se cargue en la página principal.
// Esto podría ser en ui.js o main.js después de cargar el HTML del modal.
