// Archivo: login.js

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    // Aseguramos que data.js se haya cargado antes de intentar usar validateUser
    // (Esto asume que data.js se carga en el HTML antes que login.js)
    if (typeof validateUser !== 'function') {
        console.error("Error: La función 'validateUser' de data.js no está disponible.");
        // Opcionalmente, puedes alertar al usuario o manejar el error aquí.
    }


    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            // --- LÓGICA CORREGIDA: Usar la función de data.js ---
            // validateUser está disponible globalmente porque fue exportada en data.js
            
            if (typeof validateUser === 'function' && validateUser(user, pass)) { // <--- CAMBIO CRÍTICO AQUÍ
                
                // Si la validación es exitosa (usuario encontrado en localStorage)
                localStorage.setItem('loggedIn', 'true'); 
                
                // Redirige a la página principal del inventario
                window.location.href = 'index.html'; 
            } else {
                // Validación fallida
                errorMessage.textContent = 'Usuario o contraseña incorrectos.';
                localStorage.setItem('loggedIn', 'false');
            }
        });
    }
    
    // Al cargar la página de login, forzamos la eliminación de la sesión activa
    // para que no se pueda acceder a index.html sin autenticación.
    localStorage.removeItem('loggedIn');
    
    // (Opcional): Si quieres cargar los usuarios para asegurar que estén listos antes de que el usuario intente loguearse
    if (typeof users !== 'undefined') {
        console.log("Usuarios cargados:", users);
    }
});