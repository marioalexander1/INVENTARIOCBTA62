// login.js

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            // Credenciales de ejemplo (puedes cambiarlas después)
            const validUser = 'admin';
            const validPass = '1234'; 

            if (user === validUser && pass === validPass) {
                // Guarda el indicador de sesión exitosa
                localStorage.setItem('loggedIn', 'true'); 
                
                // Redirige a la página principal del inventario
                window.location.href = 'index.html'; 
            } else {
                errorMessage.textContent = 'Usuario o contraseña incorrectos.';
                localStorage.setItem('loggedIn', 'false');
            }
        });
    }
});