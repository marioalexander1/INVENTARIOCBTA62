// Archivo: data.js

// --- Data Fija para Selectores ---
const availableCategories = ['Manual', 'Eléctrica', 'Medición', 'Protección (EPP)', 'Jardinería', 'Consumible'];
const commonBrands = ['Truper', 'DeWalt', 'Makita', 'Fluke', 'Urrea', 'Stanley', 'Genérica'];

// --- Data Base (Estructura Modular con stockLots) ---
// Estas variables se inicializan desde localStorage.
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let activeLoans = JSON.parse(localStorage.getItem('activeLoans')) || [];

// ------------------------------------------------------------------
// --- NUEVO: Data Base para Usuarios y Login ---
// ------------------------------------------------------------------
let users = JSON.parse(localStorage.getItem('users')) || [{ username: 'admin', password: '123' }]; // Un usuario inicial por defecto
let nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
// ------------------------------------------------------------------


// Almacenamiento de notas de reporte
let reportNotes = localStorage.getItem('reportNotes') || "Escriba aquí sus comentarios sobre el inventario...";

// IDs y Contadores
let nextToolId = inventory.length > 0 ? Math.max(...inventory.map(t => t.id)) + 1 : 104;
let nextLotId = getNextLotId(); 

// --- Funciones de Guardado y Ayuda de Data ---

// Función robusta para calcular el próximo ID de lote
function getNextLotId() {
    let maxLotId = 0;
    if (inventory && inventory.length > 0) {
        inventory.forEach(tool => {
            if (tool.stockLots && Array.isArray(tool.stockLots)) { 
                tool.stockLots.forEach(lot => {
                    if (lot.lotId > maxLotId) maxLotId = lot.lotId;
                });
            }
        });
    }
    return maxLotId + 1;
}

// Función para guardar los datos PRINCIPALES en localStorage
const saveData = () => {
    // Intentamos obtener la referencia al textarea para guardar las notas. 
    const notesTextarea = document.getElementById('report-notes-textarea');
    
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('activeLoans', JSON.stringify(activeLoans));
    
    // Guardamos las notas del textarea o la variable global reportNotes si el DOM aún no está listo
    if (notesTextarea) {
        localStorage.setItem('reportNotes', notesTextarea.value); 
    } else {
        localStorage.setItem('reportNotes', reportNotes); 
    }
};

// ------------------------------------------------------------------
// --- NUEVA FUNCIÓN: Guardar solo Usuarios ---
// ------------------------------------------------------------------
const saveUsers = () => {
    localStorage.setItem('users', JSON.stringify(users));
}
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// --- NUEVA FUNCIÓN: Agregar Usuario ---
// ------------------------------------------------------------------
const addUser = (username, password) => {
    // Verificar si el usuario ya existe (insensible a mayúsculas/minúsculas)
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return false; // Retorna falso si ya existe
    }

    const newUser = {
        id: nextUserId++, // Asigna el ID y lo incrementa
        username: username,
        password: password // NOTA: En una app real, la contraseña DEBE ser hasheada.
    };

    users.push(newUser);
    saveUsers();
    return true; // Retorna verdadero si se agregó correctamente
};
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// --- NUEVA FUNCIÓN: Validar Usuario para Login ---
// ------------------------------------------------------------------
const validateUser = (username, password) => {
    // 1. Busca el usuario por nombre (insensible a mayúsculas/minúsculas)
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    // 2. Comprueba si el usuario existe y si la contraseña coincide
    // (NOTA: Esto solo funciona si NO hasheaste la contraseña. Si lo hiciste, 
    // debes usar una librería de comparación de hash aquí.)
    if (user && user.password === password) {
        return true; 
    }
    return false;
};
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// --- Lógica de Negocio Específica (FUNCIÓN DE EDICIÓN DE STOCK) ---
// ------------------------------------------------------------------

/**
 * Actualiza el stock total de una herramienta, ajustando el último lote para reflejar el newTotal.
 * @param {number} toolId - ID de la herramienta.
 * @param {number} newTotal - El stock total deseado.
 */
const updateToolStock = (toolId, newTotal) => {
    const tool = inventory.find(t => t.id === toolId);
    if (!tool) {
        console.error(`Herramienta o lotes de la herramienta con ID ${toolId} no encontrados.`);
        return;
    }

    // 1. Calcular el stock actualmente prestado (unidades no disponibles)
    const loanedStock = tool.stockLots.reduce((sum, lot) => sum + (lot.total - lot.available), 0);
    
    // 2. Nueva cantidad DISPONIBLE deseada (debe ser el total menos lo prestado)
    const newAvailableTotal = newTotal - loanedStock;
    
    // Si el nuevo total es menor al stock prestado, detenemos (Defensa)
    if (newTotal < loanedStock) {
        console.error("No se puede establecer el stock total por debajo del stock prestado.");
        return;
    }

    // 3. Ajustamos el TOTAL en el último lote
    const currentTotal = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
    const difference = newTotal - currentTotal;
    
    if (difference !== 0) {
        const lastLotIndex = tool.stockLots.length - 1;
        
        // Simplemente ajustamos el total del último lote para alcanzar newTotal
        tool.stockLots[lastLotIndex].total += difference;
        
        // Manejamos el caso de que el último lote se vuelva 0 o negativo (lo eliminamos)
        if (tool.stockLots[lastLotIndex].total <= 0) {
            tool.stockLots.splice(lastLotIndex, 1);
        }
    }
    
    // 4. Distribuir el NUEVO DISPONIBLE (newAvailableTotal)
    let remainingAvailable = newAvailableTotal;
    
    for (let i = 0; i < tool.stockLots.length; i++) {
        const lot = tool.stockLots[i];
        const lotLoaned = lot.total - lot.available; // Unidades prestadas que deben permanecer prestadas
        
        if (i < tool.stockLots.length - 1) {
            lot.available = lot.total - lotLoaned;
            remainingAvailable -= lot.available;
            
        } else {
            lot.available = remainingAvailable;
            
            if (lot.available > lot.total) {
                lot.available = lot.total; 
            }
        }
    }

    console.log(`Stock total de herramienta ${toolId} consolidado y actualizado a ${newTotal}.`);

    // Finalmente, guardar los datos en el almacenamiento local
    saveData();
};
// ----------------------------------------------------
// --- Asignación al Objeto 'window' (Para evitar problemas de Scope sin Módulos ES6) ---
// ----------------------------------------------------
window.availableCategories = availableCategories;
window.commonBrands = commonBrands;
window.inventory = inventory;
window.activeLoans = activeLoans;

// NUEVAS VARIABLES DE USUARIO
window.users = users; 
window.nextUserId = nextUserId; 

window.reportNotes = reportNotes;
window.nextToolId = nextToolId;
window.nextLotId = nextLotId;

// Funciones
window.saveData = saveData;
window.saveUsers = saveUsers; // NUEVA FUNCIÓN
window.addUser = addUser; // NUEVA FUNCIÓN
window.validateUser = validateUser; // <--- FUNCIÓN DE VALIDACIÓN AÑADIDA
window.updateToolStock = updateToolStock;