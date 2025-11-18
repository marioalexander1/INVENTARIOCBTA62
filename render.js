
// --- Funciones de Inicialización de Selectores (Paso 1) ---
const populateSelectors = () => {
    // Estas variables de referencia DOM deben ser pasadas a la función o ser accesibles globalmente si es necesario, 
    // pero por ahora, las definiremos dentro del DOMContentLoaded de interface.js y aquí las usaremos asumiendo que existen.
    const newToolCategorySelect = document.getElementById("new-tool-category");
    const newToolBrandSelect = document.getElementById("new-tool-brand");

    if (!newToolCategorySelect || !newToolBrandSelect) return; 

    newToolCategorySelect.innerHTML = '<option value="" disabled selected>Seleccione una Categoría</option>';
    availableCategories.forEach(cat => {
        newToolCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    newToolBrandSelect.innerHTML = '<option value="" disabled selected>Seleccione una Marca</option>';
    commonBrands.forEach(brand => {
        newToolBrandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
    newToolBrandSelect.innerHTML += '<option value="OTHER">Otra...</option>';
};

// --- 1. Renderizar Inventario (Muestra la tabla) ---
const renderInventory = (toolsArray = inventory) => {
    const inventoryTableBody = document.getElementById("inventory-table-body");
    if (!inventoryTableBody) return;

    // Usaremos un fragmento de documento para mejorar el rendimiento
    const fragment = document.createDocumentFragment();
    
    if (toolsArray.length === 0) {
        inventoryTableBody.innerHTML = '<tr><td colspan="5">No hay herramientas registradas que coincidan con la búsqueda.</td></tr>'; 
        saveData(); 
        return;
    }

    toolsArray.forEach(tool => {
        const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
        const availableStock = tool.stockLots.reduce((sum, lot) => sum + lot.available, 0);

        // STOCK
        let statusClass;
        if (availableStock === 0) {
            statusClass = 'loaned'; // Rojo: Agotado
        } else if (availableStock < totalStock) { 
            statusClass = 'low-stock'; // Naranja: Falta Stock
        } else {
            statusClass = 'stock'; // Verde: Stock COMPLETO
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${tool.name}</td>
            <td>${tool.category}</td>
            <td>${tool.location || 'N/A'}</td> 
            <td><span class="status ${statusClass}">${availableStock}</span></td>
            <td>
                ${totalStock}
                <button class="edit-stock-btn" data-id="${tool.id}" title="Editar Stock Total">
                    ⚙️
                </button>
            </td>
        `;
        // Usamos el fragmento en lugar de inventoryTableBody directo
        fragment.appendChild(row); 
    });
    
    // Limpiar y añadir el fragmento al DOM
    inventoryTableBody.innerHTML = '';
    inventoryTableBody.appendChild(fragment);

    // ✅ PASO CRÍTICO: Conectar los botones de edición después de que se crean
    connectEditButtons(); 
    
    saveData(); 
};

const connectEditButtons = () => {
    const editButtons = document.querySelectorAll('.edit-stock-btn');

    editButtons.forEach(button => {
        // Obtenemos el ID del botón
        const toolId = parseInt(button.dataset.id);
        
        // CONEXIÓN CORREGIDA: Asignamos el listener a la función global.
        // Usamos una función anónima para pasar el ID a la función global.
        button.addEventListener('click', (e) => {
            // Aseguramos que la función global exista y la llamamos
            if (window.handleEditStockClick) {
                window.handleEditStockClick(toolId); 
            } else {
                 console.error("handleEditStockClick no está accesible globalmente.");
            }
        });
    });
};

// ... (El resto de tus funciones como renderActiveLoans, renderReports, etc., quedan igual) ...

// --- 2. Renderizar Préstamos Activos ---
const renderActiveLoans = () => {
    const loansTableBody = document.getElementById("loans-table-body");
    if (!loansTableBody) return;

    loansTableBody.innerHTML = ''; 

    if (activeLoans.length === 0) {
        loansTableBody.innerHTML = '<tr><td colspan="6">No hay préstamos activos.</td></tr>';
        saveData();
        return;
    }

    activeLoans.forEach((loan, index) => {
        const row = document.createElement("tr");
        // Nota: El botón Devolver usará el 'handleToolReturn' que estará en handlers.js
        row.innerHTML = `
            <td>${loan.loanId}</td>
            <td>${loan.name} (ID: ${loan.id})</td>
            <td>${loan.brand}</td> 
            <td>${loan.borrower}</td>
            <td>${loan.loanDate}</td>
            <td><button class="return-btn" data-loan-index="${index}">Devolver</button></td>
        `;
        loansTableBody.appendChild(row);
    });

    // IMPORTANTE: Los listeners del botón 'Devolver' deben ser manejados fuera de esta función 
    // y se moverán al archivo 'handlers.js' en el siguiente paso. 
    // Por ahora, borra el código: document.querySelectorAll('.return-btn')...

    saveData();
};


// --- 3. Renderizar Reportes (Incluye Notas) ---
const renderReports = () => {
    const reportNotesTextarea = document.getElementById("report-notes-textarea");
    const reportTotalTools = document.getElementById("report-total-tools");
    const reportAvailableStock = document.getElementById("report-available-stock");
    const reportActiveLoans = document.getElementById("report-active-loans");
    const reportUniqueCategories = document.getElementById("report-unique-categories");
    const mostLoanedBody = document.getElementById("most-loaned-body"); 

    // 3.1. Rellenar Textarea de Notas
    if (reportNotesTextarea) {
        // 'reportNotes' viene de data.js
        reportNotesTextarea.value = reportNotes;
        
        // El Listener 'blur' se maneja en 'interface.js' o 'handlers.js' para modularidad
    }

    // 3.2. Cálculos de Indicadores Clave (Key Metrics) ---
    const totalTools = inventory.length;
    const availableStock = inventory.reduce((total, tool) => {
        return total + tool.stockLots.reduce((sum, lot) => sum + lot.available, 0);
    }, 0);
    const activeLoansCount = activeLoans.length;
    const uniqueCategories = new Set(inventory.map(t => t.category)).size;

    // 3.3. Rellenar Tarjetas de Reporte
    if (reportTotalTools) reportTotalTools.textContent = totalTools;
    if (reportAvailableStock) reportAvailableStock.textContent = availableStock;
    if (reportActiveLoans) reportActiveLoans.textContent = activeLoansCount;
    if (reportUniqueCategories) reportUniqueCategories.textContent = uniqueCategories;

    // --- 3.4. Reporte de Herramientas Más Prestadas ---
    const loanCountMap = {};
    activeLoans.forEach(loan => {
        const toolKey = `${loan.id} - ${loan.name}`; 
        loanCountMap[toolKey] = (loanCountMap[toolKey] || 0) + 1;
    });

    const mostLoanedData = Object.keys(loanCountMap).map(toolKey => {
        const [toolId] = toolKey.split(' - ');
        const tool = inventory.find(t => t.id == toolId);
        const totalStock = tool ? tool.stockLots.reduce((sum, lot) => sum + lot.total, 0) : 0; 
        
        return {
            name: toolKey.split(' - ')[1],
            loanCount: loanCountMap[toolKey],
            totalStock: totalStock
        };
    }).sort((a, b) => b.loanCount - a.loanCount) 
        .slice(0, 5); 

    // 3.5. Renderizar la tabla
    if (mostLoanedBody) {
        mostLoanedBody.innerHTML = '';
        
        if (mostLoanedData.length === 0) {
            mostLoanedBody.innerHTML = '<tr><td colspan="3">No hay datos de préstamos activos para analizar.</td></tr>';
        } else {
            mostLoanedData.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td style="font-weight: bold;">${item.loanCount}</td>
                    <td>${item.totalStock}</td>
                `;
                mostLoanedBody.appendChild(row);
            });
        }
    }
};


// Función para poblar el selector de AÑADIR LOTE
const populateAddLotSelect = () => {
    const addLotToolSelect = document.getElementById("add-lot-tool-select");
    if (!addLotToolSelect) return;
    
    addLotToolSelect.innerHTML = '<option value="" selected>--- Crear Nueva Herramienta ---</option>';

    inventory.forEach(tool => {
        const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
        
        addLotToolSelect.innerHTML += `<option value="${tool.id}">✅ ${tool.name} (Stock: ${totalStock})</option>`;
    });
};


// Función para poblar el selector con herramientas disponibles (PRÉSTAMO)
const populateToolSelect = () => {
    const toolSelect = document.getElementById("tool-select"); 
    const toolNameDisplay = document.getElementById("tool-name-display");

    if (!toolSelect) return; 
    
    toolSelect.innerHTML = '<option value="" disabled selected>Seleccione una Herramienta</option>';
    if(toolNameDisplay) toolNameDisplay.textContent = '';
    
    inventory.forEach(tool => {
        const availableStock = tool.stockLots.reduce((sum, lot) => sum + lot.available, 0);
        const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);

        if (availableStock > 0) {
            toolSelect.innerHTML += `<option value="${tool.id}">🛠️ ${tool.name} (${tool.category}) [Stock: ${availableStock}/${totalStock}]</option>`;
        }
    });
    
    if (toolSelect.options.length === 1) {
           toolSelect.innerHTML += '<option value="" disabled>No hay herramientas disponibles para préstamo.</option>';
    }
};
// --- 4. Renderizar Gestión de Usuarios ---
const renderUsers = () => {
    const usersTableBody = document.getElementById("users-table-body");
    if (!usersTableBody) return;

    // Limpia la tabla antes de renderizar
    usersTableBody.innerHTML = '';
    
    // Si no hay usuarios (nunca debería pasar si 'admin' existe, pero como defensa)
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="3">No hay usuarios registrados.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.username}</td>
            <td>********</td> <td>
                ${user.username === 'admin' ? '<span style="color: gray;">(Admin principal)</span>' : '<button class="delete-user-btn" data-user-id="${user.id}">Eliminar</button>'}
            </td>
        `;
        usersTableBody.appendChild(row);
    });
    
    // Conectar el listener para los botones de eliminación de usuarios (si existen)
    connectDeleteUserButtons();
};

// Función auxiliar para conectar botones de eliminar usuario
const connectDeleteUserButtons = () => {
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        // Removemos el listener anterior si existe para evitar duplicados
        button.removeEventListener('click', handleDeleteUserClick);
        // Asignamos el nuevo listener, asumiendo que esta función estará en handlers.js
        button.addEventListener('click', handleDeleteUserClick);
    });
};

// Hacemos la función disponible globalmente
window.renderUsers = renderUsers;
window.connectDeleteUserButtons = connectDeleteUserButtons;