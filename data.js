// Archivo: data.js

// --- Data Fija para Selectores ---
const availableCategories = ['Manual', 'Eléctrica', 'Medición', 'Protección (EPP)', 'Jardinería', 'Consumible'];
const commonBrands = ['Truper', 'DeWalt', 'Makita', 'Fluke', 'Urrea', 'Stanley', 'Genérica'];

// Las variables globales serán inicializadas al cargar la aplicación
window.inventory = [];
window.activeLoans = [];
window.reportNotes = '';
window.users = [];
window.nextToolId = 1;
window.nextLotId = 1;

/**
 * Genera un hash simple (Base64) de la contraseña.
 * Usamos esto para evitar guardar la contraseña en texto plano.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña.
 */
const defaultPasswordHash = (username, password) => btoa(`${username}:${password}`);

/**
 * Función robusta para calcular el próximo ID de lote
 */
function getNextLotId() {
    let maxLotId = 0;
    // Debemos intentar cargar el inventario guardado antes de calcular
    const savedInventory = JSON.parse(localStorage.getItem('inventory')) || [];
    
    if (savedInventory && savedInventory.length > 0) {
        savedInventory.forEach(tool => {
            if (tool.stockLots && Array.isArray(tool.stockLots)) { 
                tool.stockLots.forEach(lot => {
                    if (lot.lotId > maxLotId) maxLotId = lot.lotId;
                });
            }
        });
    }
    return maxLotId + 1;
}


/**
 * Función para cargar los datos del LocalStorage o inicializar con datos por defecto.
 * ESTA FUNCIÓN RESUELVE EL PROBLEMA DE COMPARTIR USUARIOS.
 */
window.loadData = () => {
    // ------------------------------------------------------------------
    // 1. DATOS POR DEFECTO (HARDCODEADOS)
    // Estos datos se usarán si el LocalStorage está vacío (alguien nuevo accede)
    // ------------------------------------------------------------------
    const defaultData = {
        users: [
            // USUARIO ADMINISTRADOR PERMANENTE
            { 
                username: 'admin', 
                passwordHash: defaultPasswordHash('admin', '123'), 
                role: 'admin' 
            },
            // USUARIO NELSON PERMANENTE PARA COMPARTIR
            { 
                username: 'NELSON', 
                passwordHash: defaultPasswordHash('NELSON', '1234'), 
                role: 'regular' 
            },
            // OTRO USUARIO REGULAR DE PRUEBA
            { 
                username: 'user1', 
                passwordHash: defaultPasswordHash('user1', 'pass'), 
                role: 'regular' 
            },
        ],
        inventory: [],
        activeLoans: [],
        reportNotes: 'Escriba aquí sus comentarios sobre el inventario...',
        nextToolId: 1,
        nextLotId: getNextLotId()
    };
    // ------------------------------------------------------------------
    
    // 2. Intenta cargar datos del localStorage
    const savedInventory = localStorage.getItem('inventory');
    const savedActiveLoans = localStorage.getItem('activeLoans');
    const savedUsers = localStorage.getItem('users');
    const savedReportNotes = localStorage.getItem('reportNotes');

    // 3. Carga los datos: guardados o por defecto
    window.inventory = savedInventory ? JSON.parse(savedInventory) : defaultData.inventory;
    window.activeLoans = savedActiveLoans ? JSON.parse(savedActiveLoans) : defaultData.activeLoans;
    window.reportNotes = savedReportNotes || defaultData.reportNotes;
    
    // Carga de usuarios: Si NO hay usuarios guardados, carga la lista por defecto
    window.users = savedUsers ? JSON.parse(savedUsers) : defaultData.users;

    // Cargar o inicializar IDs
    window.nextToolId = parseInt(localStorage.getItem('nextToolId')) || defaultData.nextToolId;
    window.nextLotId = parseInt(localStorage.getItem('nextLotId')) || defaultData.nextLotId;
    
    // 4. Asegurar la presencia de usuarios por defecto (defensa extra)
    // Si un usuario borra "admin" pero ya tiene otros datos, lo reintroducimos.
    defaultData.users.forEach(defaultUser => {
        const userExists = window.users.some(u => u.username === defaultUser.username);
        if (!userExists) {
            window.users.push(defaultUser);
        }
    });
    
    // 5. Guardar los datos iniciales si no existían
    window.saveData(); 
};

/**
 * Función para guardar todos los datos en el LocalStorage.
 */
window.saveData = () => {
    try {
        localStorage.setItem('inventory', JSON.stringify(window.inventory));
        localStorage.setItem('activeLoans', JSON.stringify(window.activeLoans));
        localStorage.setItem('reportNotes', window.reportNotes);
        localStorage.setItem('users', JSON.stringify(window.users)); 

        localStorage.setItem('nextToolId', window.nextToolId.toString());
        localStorage.setItem('nextLotId', window.nextLotId.toString());

    } catch (error) {
        console.error("Error al guardar en LocalStorage:", error);
    }
};

/**
 * Función para añadir un nuevo usuario.
 */
window.addUser = (username, password) => {
    // Busca el usuario de forma insensible a mayúsculas/minúsculas
    const userExists = window.users.some(user => user.username.toLowerCase() === username.toLowerCase());
    
    if (userExists) {
        return false;
    }
    
    // Hash para guardar la contraseña
    const passwordHash = defaultPasswordHash(username, password);

    const newUser = {
        username: username,
        passwordHash: passwordHash,
        role: 'regular' 
    };
    
    window.users.push(newUser);
    window.saveData();
    return true;
};

/**
 * Función para validar el usuario en el login.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña en texto plano.
 * @returns {boolean} True si las credenciales son válidas.
 */
window.validateUser = (username, password) => {
    // 1. Generar el hash que se debería haber guardado
    const checkHash = defaultPasswordHash(username, password);
    
    // 2. Buscar el usuario y verificar el hash (insensible a mayúsculas/minúsculas)
    const user = window.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // 3. Comprobar si existe el usuario y si el hash coincide
    return user && user.passwordHash === checkHash;
};


// --- Asignación al Objeto 'window' ---
window.availableCategories = availableCategories;
window.commonBrands = commonBrands;

// Se inicializan todas las variables globales al cargar el script
window.loadData();