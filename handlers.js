// Archivo: handlers.js

// --- Referencias DOM 
const editStockModal = document.getElementById('edit-stock-modal');
const currentStockInput = document.getElementById('current-stock-total'); 
const editStockInput = document.getElementById('new-stock-total'); 
const currentToolIdInput = document.getElementById('edit-tool-id-hidden'); 

// Variable global para guardar el ID de la herramienta que se está editando
// ...
// Variable global para guardar el ID de la herramienta que se está editando
let toolIdToEdit = null;

// --- Funciones de Handlers (Asumen que las funciones de data.js y render.js son globales) ---

// 1. Manejo de Registro de NUEVA HERRAMIENTA / AÑADIR LOTE
const handleAddToolSubmit = (e, domRefs) => {
    e.preventDefault();
    
    // Desestructurar referencias DOM (que se pasarán desde interface.js)
    const { 
        addLotToolSelect, newToolNameInput, newToolCategorySelect, 
        newToolBrandSelect, otherBrandInput 
    } = domRefs;
    
    // Obtenemos el ID del selector. Será "" si se elige 'crear nueva herramienta'.
    const toolId = addLotToolSelect ? addLotToolSelect.value : "";
    
    const name = newToolNameInput.value.trim(); 
    const category = newToolCategorySelect.value;
    let brand = newToolBrandSelect.value;
    const quantityInput = document.getElementById("new-tool-quantity");
    const quantity = quantityInput ? parseInt(quantityInput.value) : NaN;


    if (brand === 'OTHER') {
        brand = otherBrandInput.value.trim();
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        alert("La cantidad debe ser un número entero mayor a cero.");
        return;
    }

    if (toolId !== "") {
        // --- LÓGICA: AÑADIR NUEVO LOTE A HERRAMIENTA EXISTENTE ---
        const existingTool = inventory.find(t => t.id === parseInt(toolId));
        
        if (!existingTool) {
            alert("❌ Error: Herramienta seleccionada no existe en el inventario.");
            return;
        }

        // Crear el nuevo lote
        const newLot = {
            lotId: nextLotId++, 
            brand: brand,
            total: quantity,
            available: quantity,
        };
        
        existingTool.stockLots.push(newLot);

        alert(`✅ Éxito: Se añadieron ${quantity} unidades (Marca: ${brand}) a "${existingTool.name}".`);

    } else {
        // --- LÓGICA: CREAR NUEVA HERRAMIENTA COMPLETA ---
        if (!name || !category) {
            alert("Por favor, complete el Nombre y la Categoría para registrar una nueva herramienta.");
            return;
        }
        
        const newTool = {
            id: nextToolId++, 
            name: name,
            category: category,
            location: 'N/A', 
            stockLots: [{
                lotId: nextLotId++, 
                brand: brand,
                total: quantity,
                available: quantity,
            }]
        };

        inventory.push(newTool); // Modifica la variable global de data.js
        alert(`✅ Éxito: Nueva herramienta "${name}" (ID: ${newTool.id}) registrada con ${quantity} unidades de la marca "${brand}".`);
    }

    // Guardar, cerrar y repintar
    saveData();
    closeToolModalHandler(); 
    renderInventory(); 
    renderReports(); 
    populateToolSelect(); 
    populateAddLotSelect(); 
};


// 2. Manejo de Préstamo
const handleLoanSubmit = (e, domRefs) => {
    e.preventDefault(); 
    
    const { toolSelect } = domRefs;
    
    // OBTENER ID DEL SELECTOR
    const toolId = parseInt(toolSelect.value);
    const borrower = document.getElementById("borrower").value.trim();
    const loanDate = document.getElementById("loan-date").value;
    
    if (isNaN(toolId) || toolId <= 0 || !borrower || borrower.length === 0 || !loanDate || loanDate.length === 0) {
        alert("⚠️ Atención: Debe seleccionar una herramienta y completar correctamente el prestatario y la fecha."); 
        return; 
    }

    const toolIndex = inventory.findIndex(t => t.id === toolId);
    if (toolIndex === -1) {
        alert("❌ Error: ID de herramienta no existe.");
        return;
    }
    
    const toolToLoan = inventory[toolIndex];
    const availableStock = toolToLoan.stockLots.reduce((sum, lot) => sum + lot.available, 0);

    if (availableStock <= 0) {
        alert(`⚠️ Error: La herramienta "${toolToLoan.name}" está agotada.`);
        return;
    }
    
    // Encuentra el primer lote disponible para prestar (FIFO simple)
    const availableLot = toolToLoan.stockLots.find(lot => lot.available > 0);

    if (!availableLot) {
           alert("Error interno: No se encontró un lote disponible.");
           return;
    }
    
    availableLot.available -= 1; 
    
    const newLoan = {
        loanId: activeLoans.length + 1, 
        id: toolToLoan.id,
        name: toolToLoan.name,
        brand: availableLot.brand, 
        lotId: availableLot.lotId,  
        borrower: borrower,
        loanDate: loanDate,
        loanedOn: new Date().toLocaleDateString('es-MX'),
    };

    activeLoans.push(newLoan); // Modifica la variable global
    alert(`✅ Éxito: 1 unidad de "${toolToLoan.name}" (Marca: ${availableLot.brand}) prestada a ${borrower}.`);

    // Guardar, cerrar y repintar
    saveData();
    closeLoanModalHandler(); 
    renderInventory(); 
    renderActiveLoans(); 
    renderReports(); 
    populateToolSelect(); 
};


// 3. Manejo de Devolución
const handleToolReturn = (e) => {
    // Usamos data-loan-id si hiciste la corrección en render.js, si no, usa data-loan-index
    const loanIndex = parseInt(e.target.dataset.loanIndex); // Usando index como estaba originalmente
    const loan = activeLoans[loanIndex]; 

    const tool = inventory.find(t => t.id === loan.id); 
    
    if (tool) {
        const lot = tool.stockLots.find(l => l.lotId === loan.lotId);
        // Se incrementa el stock disponible si no excede el stock total del lote
        if (lot && lot.available < lot.total) { 
            lot.available += 1; 
        } 
    }

    activeLoans.splice(loanIndex, 1); // Elimina el préstamo activo

    alert(`Herramienta "${loan.name}" (Marca: ${loan.brand}) devuelta y reincorporada al inventario.`);

    // Guardar y repintar
    saveData();
    renderInventory(); 
    renderActiveLoans(); 
    renderReports(); 
    populateToolSelect(); 
};


// 4. Manejo de Edición de Stock (PREPARAR MODAL)
window.handleEditStockClick = (toolId) => {
    const tool = inventory.find(t => t.id === toolId);
    if (!tool) {
        alert("❌ Error: Herramienta no encontrada.");
        return;
    }

    // 1. Guardar la ID para usarla en el submit
    toolIdToEdit = toolId;
    currentToolIdInput.value = toolId; 
    
    // 2. Calcular y mostrar el stock total actual
    const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
    currentStockInput.value = totalStock;
    editStockInput.value = totalStock;
    
    // 3. Abrir el modal
    editStockModal.style.display = 'flex';
};


// 5. Manejo de Edición de Stock (SUBMIT - LÓGICA DE REEMPLAZO CORREGIDA)
window.handleEditStockSubmit = (e) => {
    e.preventDefault();

    // 1. Obtener el NUEVO TOTAL DESEADO desde el input
    const newTotalDeseado = parseInt(editStockInput.value);
    
    // 2. Obtener el ID de la herramienta
    const toolId = toolIdToEdit || parseInt(currentToolIdInput.value);

    if (toolId === null || isNaN(toolId)) {
        alert("Error: No hay una herramienta seleccionada para editar.");
        return;
    }

    const tool = inventory.find(t => t.id === toolId);
    
    // 3. Validación de entrada
    if (!tool || isNaN(newTotalDeseado) || newTotalDeseado < 0) {
        alert("Por favor, ingrese un número de stock total válido (cero o más).");
        return;
    }
    
    // 4. Obtener el stock PRESTADO (lo que no está disponible)
    const loanedStock = tool.stockLots.reduce((sum, lot) => sum + (lot.total - lot.available), 0);
    
    // 5. Validación de stock prestado (CRÍTICO)
    if (newTotalDeseado < loanedStock) {
        alert(`❌ Error: No puedes reducir el stock total a ${newTotalDeseado}. Hay ${loanedStock} unidades PRESTADAS.`);
        return;
    }
    
    // 6. Llamar a la función de data.js para actualizar con el NUEVO VALOR TOTAL
    // (Esta función de data.js maneja la distribución del stock disponible)
    updateToolStock(toolId, newTotalDeseado);

    // 7. Cierre y Repintado
    closeEditStockModalHandler(); 
    renderInventory();
    renderReports();
    populateToolSelect();
    
    // Limpiar la variable global
    toolIdToEdit = null;
    
    console.log(`Stock de herramienta ${toolId} ajustado. Nuevo Total: ${newTotalDeseado}.`);
};

// ------------------------------------------------------------------
// --- NUEVAS FUNCIONES PARA GESTIÓN DE USUARIOS ---
// ------------------------------------------------------------------

/**
 * Maneja el envío del formulario para crear un nuevo usuario.
 * @param {Event} e - Evento de envío del formulario.
 */
 const handleAddUserSubmit = (e) => { 
    e.preventDefault();

    const usernameInput = document.getElementById("new-username");
    const passwordInput = document.getElementById("new-password");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password || password.length < 4) {
        alert("⚠️ Por favor, ingrese un nombre de usuario y una contraseña de al menos 4 caracteres.");
        return;
    }

    // Llama a la función de data.js para añadir el usuario.
    const success = addUser(username, password); // addUser está en data.js

    if (success) {
        alert(`✅ Éxito: Usuario "${username}" creado.`);
    } else {
        alert(`❌ Error: El usuario "${username}" ya existe.`);
    }

    // Cerrar y repintar
    closeAddUserModalHandler(); // Función definida en interface.js
    renderUsers(); // Función definida en render.js
};

/**
 * Maneja el clic en el botón 'Eliminar' de un usuario.
 * @param {Event} e - Evento de clic.
 */
const handleDeleteUserClick = (e) => {
    // Asegurarse de que el clic provenga de un botón de eliminación
    const targetBtn = e.target.closest('.delete-user-btn');
    if (!targetBtn) return;
    
    const userIdToDelete = parseInt(targetBtn.dataset.userId);
    
    if (confirm(`¿Está seguro de que desea eliminar al usuario con ID ${userIdToDelete}?`)) {
        
        const userIndex = users.findIndex(u => u.id === userIdToDelete);

        if (userIndex === -1) {
            alert("❌ Error: Usuario no encontrado.");
            return;
        }
        
        // Prevención: No permitir eliminar al usuario 'admin' (ID 1 por defecto si se usó la inicialización)
        if (users[userIndex].username.toLowerCase() === 'admin') {
            alert("❌ No se puede eliminar al usuario administrador principal.");
            return;
        }
        
        users.splice(userIndex, 1); // Elimina el usuario del array
        saveUsers(); // Guarda los cambios
        
        alert(`✅ Éxito: Usuario eliminado.`);
        renderUsers(); // Repintar la tabla de usuarios
    }
};

// --- Exportar Funciones Públicas (Si no usas módulos, se asume que las funciones son globales con 'window.') ---
window.handleAddToolSubmit = handleAddToolSubmit;
window.handleLoanSubmit = handleLoanSubmit;
window.handleToolReturn = handleToolReturn;
window.handleAddUserSubmit = handleAddUserSubmit; 
window.handleDeleteUserClick = handleDeleteUserClick;
window.handleEditStockSubmit = handleEditStockSubmit; // Asume que agregaste esta exportación también