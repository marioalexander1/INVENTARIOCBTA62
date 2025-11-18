// Archivo: interface.js

// Depende de: data.js (para acceder a inventory, activeLoans, saveData)
// Depende de: render.js (para las funciones de dibujo)
// Depende de: handlers.js (para handleAddToolSubmit, handleLoanSubmit, handleToolReturn, handleEditStockClick, handleAddUserSubmit, handleDeleteUserClick) // COMENTARIO ACTUALIZADO

console.log("El script se está ejecutando correctamente.");

document.addEventListener("DOMContentLoaded", () => {

    // --- Referencias DOM ---

    const inventoryTableBody = document.getElementById("inventory-table-body"); // Se usa en render.js, pero se mantiene la referencia
    const loansTableBody = document.getElementById("loans-table-body"); // Se usa en render.js, pero se mantiene la referencia
    const menuItems = document.querySelectorAll(".sidebar li");

    // Botones de la cabecera
    const btnRegistrarPrestamo = document.getElementById("btn-registrar-prestamo");
    const btnAddTool = document.getElementById("btn-add-tool");
    const btnAddUser = document.getElementById("btn-add-user");

    // Modales y formularios
    const loanModal = document.getElementById("loanModal");
    const closeLoanModal = document.getElementById("closeLoanModal");
    const loanForm = document.getElementById("loanForm");

    const addToolModal = document.getElementById("addToolModal");
    const closeToolModal = document.getElementById("closeToolModal");
    const addToolForm = document.getElementById("addToolForm");

    // NUEVAS Referencias para el Modal de Editar Stock
    const editStockModal = document.getElementById("edit-stock-modal");
    const closeEditStockModal = document.getElementById("closeEditStockModal"); // Asume que agregaste un span de cierre con este ID

    // NUEVAS REFERENCIAS PARA USUARIOS
    const addUserModal = document.getElementById("addUserModal");
    const closeUserModal = document.getElementById("closeUserModal");
    const addUserForm = document.getElementById("addUserForm");
    
    // NUEVA REFERENCIA: Contenedor principal de la vista de usuarios (para delegación de eventos)
    const usersViewSection = document.getElementById('users-view'); // <--- AÑADIDO

    // Inputs del modal de AÑADIR HERRAMIENTA
    const newToolNameInput = document.getElementById("new-tool-name");
    const newToolCategorySelect = document.getElementById("new-tool-category");
    const newToolBrandSelect = document.getElementById("new-tool-brand");
    const otherBrandGroup = document.getElementById("group-other-brand");
    const otherBrandInput = document.getElementById("other-brand-input");

    // NUEVAS Referencias para el selector de Añadir Lote
    const addLotToolSelect = document.getElementById("add-lot-tool-select");
    const toolDetailsGroups = document.querySelectorAll(".tool-details-group");

    // Referencias para la funcionalidad de Préstamo
    const toolSelect = document.getElementById("tool-select");
    const toolNameDisplay = document.getElementById("tool-name-display");

    // Referencia para el Filtro de Búsqueda
    const inventorySearchInput = document.getElementById("inventory-search");

    // Referencias DOM para Reportes
    const reportNotesTextarea = document.getElementById("report-notes-textarea");

    // Referencia del botón de Cerrar Sesión
    const logoutButton = document.getElementById("logout-btn");

    // --- 1. Lógica de Interfaz y Visibilidad (Queda) ---

    // Lógica para alternar visibilidad de campos de Nombre/Categoría
    if (addLotToolSelect) {

        addLotToolSelect.addEventListener('change', () => {
            const isNewTool = addLotToolSelect.value === "";
            toolDetailsGroups.forEach(group => {

                if (isNewTool) {
                    group.classList.remove('hidden');
                } else {
                    group.classList.add('hidden');

                }

            });

            // Hacemos que los campos sean requeridos SÓLO si se va a crear una herramienta nueva
            newToolNameInput.required = isNewTool;
            newToolCategorySelect.required = isNewTool;

        });

    }
    // Lógica para mostrar campo de "Otra Marca"
    newToolBrandSelect.addEventListener('change', () => {

        if (newToolBrandSelect.value === 'OTHER') {
            otherBrandGroup.classList.remove('hidden');
            otherBrandInput.setAttribute('required', 'required');

        } else {

            otherBrandGroup.classList.add('hidden');
            otherBrandInput.removeAttribute('required');
        }

    });
    // --- 1.1. Lógica de Filtrado de Inventario (Mantenida por acoplamiento al DOM) ---
    inventorySearchInput.addEventListener('input', () => {
        const searchTerm = inventorySearchInput.value.toLowerCase();
        const filteredTools = inventory.filter(tool => {
            const idString = tool.id.toString();
            const nameLower = tool.name.toLowerCase();
            const categoryLower = tool.category.toLowerCase();

            // Accede a 'inventory' (variable de data.js)
            const brandsMatch = tool.stockLots.some(lot => lot.brand.toLowerCase().includes(searchTerm));

            return (

                idString.includes(searchTerm) ||
                nameLower.includes(searchTerm) ||
                categoryLower.includes(searchTerm) ||
                brandsMatch

            );

        });
        renderInventory(filteredTools); // Llama a la función de render.js

    });

    // --- 3.1 & 3.2. Lógica de Guardado de Notas (Simplificada) ---

    function saveReportNotes() {

        if (reportNotesTextarea) {
            reportNotes = reportNotesTextarea.value; // Accede a la variable global de data.js
            saveData(); // Llama a la función de data.js
            console.log("Notas de reporte guardadas.");

        }
    }

    if (reportNotesTextarea) {
        reportNotesTextarea.addEventListener('blur', saveReportNotes);

    }
    // Función para mostrar la disponibilidad al seleccionar (Mantenida por acoplamiento al DOM)
    toolSelect.addEventListener('change', () => {
        const toolId = parseInt(toolSelect.value);
        toolNameDisplay.textContent = '';
        const foundTool = inventory.find(tool => tool.id === toolId);

        if (foundTool) {

            const availableStock = foundTool.stockLots.reduce((sum, lot) => sum + lot.available, 0);
            const totalStock = foundTool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
            toolNameDisplay.textContent = `Stock: ${availableStock}/${totalStock}`;

    
            if (availableStock <= 0) {
                toolNameDisplay.textContent = 'AGOTADO';
                toolNameDisplay.style.color = '#e74c3c';

            } else {
                toolNameDisplay.style.color = '#27ae60';
            }
        }
    });

    // --- 2. Conexión de Handlers (Reemplaza la lógica) ---
    // Referencias para pasar al handler de Añadir/Lote
    const addToolDomRefs = {
        addLotToolSelect, newToolNameInput, newToolCategorySelect,
        newToolBrandSelect, otherBrandInput
    };

    // Conecta el formulario a la función de handlers.js
    addToolForm.addEventListener("submit", (e) => handleAddToolSubmit(e, addToolDomRefs));

    // Referencias para pasar al handler de Préstamo
    const loanDomRefs = { toolSelect };

    // Conecta el formulario a la función de handlers.js
    loanForm.addEventListener("submit", (e) => handleLoanSubmit(e, loanDomRefs));
    
    // NUEVO: Conecta el formulario de Añadir Usuario a la función de handlers.js
    addUserForm.addEventListener("submit", handleAddUserSubmit); // <--- AÑADIDO

    // --- NUEVO: Listener para el botón Editar Stock (Delegación de eventos) ---
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', function(event) {

            // Usa .closest() para encontrar el botón, incluso si se hace clic en el emoji (⚙️)
            const targetBtn = event.target.closest('.edit-stock-btn');
            if (targetBtn) {
                const toolId = parseInt(targetBtn.dataset.id);

                // Llama a la función de manejo que implementarás en handlers.js
                if (typeof handleEditStockClick === 'function') {
                    handleEditStockClick(toolId);
                } else {

                    console.error("Error: La función handleEditStockClick no está definida.");

                }
            }
        });
    }

    // --- FIN NUEVO LISTENER ---

    // --- 3. Manejo de la Interfaz (Modales, Menú, Logout) (Queda) ---

    // Funciones de limpieza/cierre

    const closeLoanModalHandler = () => {
        loanModal.style.display = "none";
        loanForm.reset();
        toolNameDisplay.textContent = '';

    };

    const closeToolModalHandler = () => {
        addToolModal.style.display = "none";
        addToolForm.reset();
    
        if (toolDetailsGroups) {
            toolDetailsGroups.forEach(group => group.classList.remove('hidden'));
        }
        if (addLotToolSelect) {
            addLotToolSelect.value = "";
        }

        newToolNameInput.required = true;
        newToolCategorySelect.required = true;
        otherBrandGroup.classList.add('hidden');
    }

    // NUEVO: Función de limpieza/cierre para el modal de Editar Stock
    const closeEditStockModalHandler = () => {

        if (editStockModal) {
            editStockModal.style.display = "none";
            // Asume que el formulario de edición se reiniciará en handlers.js

        }

    }
    // NUEVA LÓGICA DE USUARIOS: Función de limpieza/cierre para el modal de Añadir Usuario
    const closeAddUserModalHandler = () => {
        if (addUserModal) {
            addUserModal.style.display = "none";
            addUserForm.reset(); 
        }
    }
    // Abrir Modales

// NUEVO: Abrir Modal de Añadir Usuario
    if (btnAddUser) {
    btnAddUser.addEventListener("click", () => {
        // Se asume que no necesita funciones de inicialización al abrir
        addUserModal.style.display = "flex";
    });
    }
    btnRegistrarPrestamo.addEventListener("click", () => {
        populateToolSelect(); // Llama a la función de render.js
        loanModal.style.display = "flex";
    });
    btnAddTool.addEventListener("click", () => {
        populateAddLotSelect(); // Asegura que el selector esté lleno al abrir
        addToolModal.style.display = "flex";
    }); 


    // Cerrar Modales
    if (closeLoanModal) {
        closeLoanModal.addEventListener("click", closeLoanModalHandler);
    }
    if (closeToolModal) {
        closeToolModal.addEventListener("click", closeToolModalHandler);
    }
    // NUEVO: Cerrar Modal de Editar Stock
    if (closeEditStockModal) {
        closeEditStockModal.addEventListener("click", closeEditStockModalHandler);
    }
    // Cerrar Modales (Click fuera)
    window.addEventListener("click", (e) => {

        if (e.target === loanModal) {
            closeLoanModalHandler();
        } else if (e.target === addToolModal) {
            closeToolModalHandler();
        } else if (e.target === editStockModal) { // NUEVO: Cerrar modal de Editar Stock al hacer clic fuera
            closeEditStockModalHandler();

        } else if (e.target === addUserModal) { // NUEVO: Cerrar modal de Añadir Usuario al hacer clic fuera
            closeAddUserModalHandler();
        }
    });
    
    // --- NUEVO: Listener para el botón ELIMINAR Usuario (Delegación) ---
    if (usersViewSection) {
        // Asume que esta función está definida en handlers.js
        usersViewSection.addEventListener('click', handleDeleteUserClick); // <--- AÑADIDO
    }
    // --- FIN NUEVO LISTENER DE ELIMINACIÓN ---
    
    // Función helper para renderizar préstamos y enlazar el botón Devolver

    const addReturnListeners = () => {

        // handleToolReturn viene de handlers.js
        document.querySelectorAll('.return-btn').forEach(button => {
            button.removeEventListener('click', handleToolReturn);
            button.addEventListener('click', handleToolReturn);
        });
    };

    const renderAndBindLoans = () => {
        renderActiveLoans(); // Llama a la función de render.js
        addReturnListeners();
    };

    // Control de Navegación (Sidebar)
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            if (item.id === 'logout-btn') {
                return;
            }

            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const target = item.dataset.section;

            document.querySelectorAll('.content').forEach(section => {
                section.classList.add('hidden');
            });
            
            if (target) {
                const sectionElement = document.getElementById(target);
                if (sectionElement) {
                    sectionElement.classList.remove('hidden');
                }
            }
            
            if (target === 'reports-view') {
                renderReports(); // Llama a la función de render.js
            } else if (target === 'loans-view') {
                renderAndBindLoans(); // Llama a la función combinada
            } else if (target === 'users-view') { // <--- ¡NUEVA LÓGICA AQUÍ!
                renderUsers(); 
            }
        });
    });
    // --- 9. Manejo de Cerrar Sesión ---
    const handleLogout = () => {

        localStorage.removeItem('loggedIn');
        alert("Sesión cerrada.");
        window.location.href = 'login.html';
    };

    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }
    // --- 10. Inicialización ---

    // Asegura que las funciones de render.js estén disponibles
    populateSelectors();
    renderInventory();
    renderReports();
    populateToolSelect();
    populateAddLotSelect();
    // Inicializa la vista de préstamos con el listener

    renderAndBindLoans();

});