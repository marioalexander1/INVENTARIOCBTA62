// AÑADIDO: Lógica de protección de Login. Se ejecuta ANTES de que el DOM cargue.
const isLoggedIn = localStorage.getItem('loggedIn');

// Si no hay indicador de sesión o no es 'true', redirige a la página de login
if (isLoggedIn !== 'true') {
    // Si estás usando una página de login, descomenta la siguiente línea:
    // window.location.href = 'login.html'; 
}
// -------------------------------------------------------------


// --- VERIFICACIÓN CRÍTICA DE CARGA ---
console.log("El script se está ejecutando correctamente."); 
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    // --- Data Fija para Selectores ---
    const availableCategories = ['Manual', 'Eléctrica', 'Medición', 'Protección (EPP)', 'Jardinería', 'Consumible'];
    const commonBrands = ['Truper', 'DeWalt', 'Makita', 'Fluke', 'Urrea', 'Stanley', 'Genérica'];
    
    // --- Data Base (Estructura Modular con stockLots) ---
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [
        { 
            id: 101, 
            name: "Taladro Inalámbrico", 
            category: "Eléctrica", 
            location: "Taller A", 
            stockLots: [
                { lotId: 1, brand: "DeWalt", total: 2, available: 1 }, // Stock bajo
                { lotId: 2, brand: "Makita", total: 1, available: 1 }
            ]
        },
        { 
            id: 102, 
            name: "Pala Cuadrada", 
            category: "Jardinería", 
            location: "Bodega Ext.", 
            stockLots: [
                { lotId: 3, brand: "Truper", total: 5, available: 4 }, // Stock normal
                { lotId: 4, brand: "Ferca", total: 3, available: 0 } // Stock agotado en un lote
            ]
        },
        { 
            id: 103, 
            name: "Multímetro Digital", 
            category: "Medición", 
            location: "Laboratorio", 
            stockLots: [
                { lotId: 5, brand: "Fluke", total: 1, available: 0 }, // Stock agotado
            ]
        },
    ];

    let activeLoans = JSON.parse(localStorage.getItem('activeLoans')) || [
        { loanId: 1, id: 101, name: "Taladro Inalámbrico", brand: "DeWalt", lotId: 1, borrower: "Taller Mecánica", loanDate: "2025-11-01", loanedOn: "01/11/2025" },
        { loanId: 2, id: 103, name: "Multímetro Digital", brand: "Fluke", lotId: 5, borrower: "Laboratorio", loanDate: "2025-11-03", loanedOn: "03/11/2025" }
    ];

    // NUEVO: Almacenamiento de notas de reporte
    let reportNotes = localStorage.getItem('reportNotes') || "Escriba aquí sus comentarios sobre el inventario...";

    let nextToolId = inventory.length > 0 ? Math.max(...inventory.map(t => t.id)) + 1 : 104;
    let nextLotId = getNextLotId(); 

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

    // --- Referencias DOM ---
    const inventoryTableBody = document.getElementById("inventory-table-body");
    const loansTableBody = document.getElementById("loans-table-body");
    const menuItems = document.querySelectorAll(".sidebar li");
    
    // Botones de la cabecera
    const btnRegistrarPrestamo = document.getElementById("btn-registrar-prestamo");
    const btnAddTool = document.getElementById("btn-add-tool");

    // Modales y formularios
    const loanModal = document.getElementById("loanModal");
    const closeLoanModal = document.getElementById("closeLoanModal"); 
    const loanForm = document.getElementById("loanForm");
    
    const addToolModal = document.getElementById("addToolModal");
    const closeToolModal = document.getElementById("closeToolModal"); 
    const addToolForm = document.getElementById("addToolForm");

    // Inputs del modal de AÑADIR HERRAMIENTA
    const newToolNameInput = document.getElementById("new-tool-name");
    const newToolCategorySelect = document.getElementById("new-tool-category");
    const newToolBrandSelect = document.getElementById("new-tool-brand");
    const otherBrandGroup = document.getElementById("group-other-brand");
    const otherBrandInput = document.getElementById("other-brand-input");
    const newToolGroups = document.querySelectorAll(".new-tool-group"); // Se mantiene, aunque ya no ocultamos nada
    
    // Referencias para la funcionalidad de Préstamo
    const toolSelect = document.getElementById("tool-select"); 
    const toolNameDisplay = document.getElementById("tool-name-display");

    // Referencia para el Filtro de Búsqueda
    const inventorySearchInput = document.getElementById("inventory-search");
    
    // Referencias DOM para Reportes
    const reportTotalTools = document.getElementById("report-total-tools");
    const reportAvailableStock = document.getElementById("report-available-stock");
    const reportActiveLoans = document.getElementById("report-active-loans");
    const reportUniqueCategories = document.getElementById("report-unique-categories");
    const mostLoanedBody = document.getElementById("most-loaned-body"); 
    
    // NUEVO: Referencia para el textarea de notas
    const reportNotesTextarea = document.getElementById("report-notes-textarea");

    // Referencia del botón de Cerrar Sesión
    const logoutButton = document.getElementById("logout-btn");


    // Función para guardar los datos en localStorage
    const saveData = () => {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('activeLoans', JSON.stringify(activeLoans));
        // NUEVO: Guardar notas
        if (reportNotesTextarea) {
            localStorage.setItem('reportNotes', reportNotesTextarea.value); 
        }
    };

    // --- Funciones de Inicialización de Selectores ---
    const populateSelectors = () => {
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
    populateSelectors();

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
    // --- 1. Renderizar Inventario (Muestra la tabla) ---
    const renderInventory = (toolsArray = inventory) => {
        inventoryTableBody.innerHTML = ''; 
        
        if (toolsArray.length === 0) {
            // Se ajusta el colspan a 4 (de 5) ya que eliminamos la columna ID
            inventoryTableBody.innerHTML = '<tr><td colspan="4">No hay herramientas registradas que coincidan con la búsqueda.</td></tr>'; 
            saveData(); 
            return;
        }

        toolsArray.forEach(tool => {
            const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);
            const availableStock = tool.stockLots.reduce((sum, lot) => sum + lot.available, 0);

            // NUEVO: Lógica de cambio de color
            let statusClass;
            if (availableStock === 0) {
                statusClass = 'loaned'; // Rojo: Agotado
            } else if (availableStock <= 2) {
                statusClass = 'low-stock'; // Naranja: Stock bajo (<= 2)
            } else {
                statusClass = 'stock'; // Verde: Disponible
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${tool.name}</td>
                <td>${tool.category}</td>
                <td>${tool.location || 'N/A'}</td> 
                <td><span class="status ${statusClass}">${availableStock}</span></td>
                <td>${totalStock}</td>
            `;
            inventoryTableBody.appendChild(row);
        });
        saveData(); 
    };
    
    // --- 1.1. Lógica de Filtrado de Inventario ---
    inventorySearchInput.addEventListener('input', () => {
        const searchTerm = inventorySearchInput.value.toLowerCase();
        
        const filteredTools = inventory.filter(tool => {
            const idString = tool.id.toString();
            const nameLower = tool.name.toLowerCase();
            const categoryLower = tool.category.toLowerCase();
            const brandsMatch = tool.stockLots.some(lot => lot.brand.toLowerCase().includes(searchTerm));

            // Permite seguir buscando por ID aunque no se muestre
            return (
                idString.includes(searchTerm) ||
                nameLower.includes(searchTerm) ||
                categoryLower.includes(searchTerm) ||
                brandsMatch
            );
        });
        
        renderInventory(filteredTools);
    });

    // --- 2. Renderizar Préstamos Activos ---
    const renderActiveLoans = () => {
        loansTableBody.innerHTML = ''; 

        if (activeLoans.length === 0) {
            loansTableBody.innerHTML = '<tr><td colspan="6">No hay préstamos activos.</td></tr>';
            saveData();
            return;
        }

        activeLoans.forEach((loan, index) => {
            const row = document.createElement("tr");
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

        document.querySelectorAll('.return-btn').forEach(button => {
            button.addEventListener('click', handleToolReturn);
        });
        saveData();
    };
    
    // --- 3. Renderizar Reportes (Incluye Notas) ---
    const renderReports = () => {
        
        // 3.1. Rellenar Textarea de Notas
        if (reportNotesTextarea) {
            reportNotesTextarea.value = reportNotes;
            // Listener para guardar automáticamente al salir del campo
            reportNotesTextarea.removeEventListener('blur', saveReportNotes); // Evita duplicar listeners
            reportNotesTextarea.addEventListener('blur', saveReportNotes);
        }

        // Función para guardar las notas
        function saveReportNotes() {
            reportNotes = reportNotesTextarea.value;
            saveData();
            console.log("Notas de reporte guardadas.");
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
            // Se usa el ID para agrupar, ya que es único para la herramienta
            const toolKey = `${loan.id} - ${loan.name}`; 
            loanCountMap[toolKey] = (loanCountMap[toolKey] || 0) + 1;
        });

        const mostLoanedData = Object.keys(loanCountMap).map(toolKey => {
            const [toolId] = toolKey.split(' - ');
            const tool = inventory.find(t => t.id == toolId);
            // Se añade una comprobación simple para evitar errores si la herramienta no se encuentra (raro, pero posible si la base de datos se manipula manualmente)
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

// --- 4. Registro de NUEVA HERRAMIENTA ---
addToolForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newToolNameInput.value.trim(); 
    const category = newToolCategorySelect.value;
    let brand = newToolBrandSelect.value;
    // Se valida que el input exista antes de intentar obtener su valor.
    const quantityInput = document.getElementById("new-tool-quantity");
    const quantity = quantityInput ? parseInt(quantityInput.value) : NaN;


    if (brand === 'OTHER') {
        brand = otherBrandInput.value.trim();
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        alert("La cantidad debe ser un número entero mayor a cero.");
        return;
    }    
    // Validamos el nombre/categoría solo por precaución, aunque el HTML los marca como required.
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

    inventory.push(newTool);
    alert(`✅ Éxito: Nueva herramienta "${name}" (ID: ${newTool.id}) registrada con ${quantity} unidades de la marca "${brand}".`);
    
    closeToolModalHandler();
    renderInventory(); 
    renderReports(); 
    populateToolSelect(); // IMPORTANTE: Recargar el selector de préstamo con la nueva herramienta
});

    // --- 5. Funciones de Selector y Validación de Stock ---
    
    // Función para poblar el selector con herramientas disponibles
    const populateToolSelect = () => {
        if (!toolSelect) return; 
        
        // Reiniciar el selector
        toolSelect.innerHTML = '<option value="" disabled selected>Seleccione una Herramienta</option>';
        toolNameDisplay.textContent = '';
        
        inventory.forEach(tool => {
            const availableStock = tool.stockLots.reduce((sum, lot) => sum + lot.available, 0);
            const totalStock = tool.stockLots.reduce((sum, lot) => sum + lot.total, 0);

            // Solo agrega herramientas con stock disponible
            if (availableStock > 0) {
                // El valor del option es el ID de la herramienta
                toolSelect.innerHTML += `<option value="${tool.id}">🛠️ ${tool.name} (${tool.category}) [Stock: ${availableStock}/${totalStock}]</option>`;
            }
        });
        
        if (toolSelect.options.length === 1) {
             toolSelect.innerHTML += '<option value="" disabled>No hay herramientas disponibles para préstamo.</option>';
        }
    };
    
    // Función para mostrar la disponibilidad al seleccionar
    toolSelect.addEventListener('change', () => {
        const toolId = parseInt(toolSelect.value);
        toolNameDisplay.textContent = ''; 
        
        const foundTool = inventory.find(tool => tool.id === toolId);
        
        if (foundTool) {
            const availableStock = foundTool.stockLots.reduce((sum, lot) => sum + lot.available, 0);
            const totalStock = foundTool.stockLots.reduce((sum, lot) => sum + lot.total, 0);

            toolNameDisplay.textContent = `Stock: ${availableStock}/${totalStock}`;
            
            if (availableStock <= 0) {
                // Esto no debería pasar, pero como doble chequeo
                toolNameDisplay.textContent = 'AGOTADO';
                toolNameDisplay.style.color = '#e74c3c'; 
            } else {
                toolNameDisplay.style.color = '#27ae60'; 
            }
        }
    });
    
    // --- 6. Manejo de Préstamo ---
    loanForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        
        // OBTENER ID DEL SELECTOR
        const toolId = parseInt(document.getElementById("tool-select").value);
        const borrower = document.getElementById("borrower").value.trim();
        const loanDate = document.getElementById("loan-date").value;
        
        // Se valida el toolId, que será NaN si no se seleccionó nada
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

        activeLoans.push(newLoan);
        alert(`✅ Éxito: 1 unidad de "${toolToLoan.name}" (Marca: ${availableLot.brand}) prestada a ${borrower}.`);

        closeLoanModalHandler();
        renderInventory(); 
        renderActiveLoans(); 
        renderReports();
        populateToolSelect(); // Recargar el selector para reflejar la reducción de stock
    });

    // --- 7. Manejo de Devolución ---
    const handleToolReturn = (e) => {
        const loanIndex = parseInt(e.target.dataset.loanIndex);
        const loan = activeLoans[loanIndex];

        const tool = inventory.find(t => t.id === loan.id);
        
        if (tool) {
            const lot = tool.stockLots.find(l => l.lotId === loan.lotId);
            // Se añade una comprobación para no aumentar el stock total por error
            if (lot && lot.available < lot.total) { 
                lot.available += 1; 
            } else if (lot) {
                // Mensaje de advertencia si se intenta devolver más del total
                 console.warn(`Advertencia: Intento de devolución de lote que ya estaba en stock total (ID: ${loan.id}, Lote: ${loan.lotId}). No se incrementó el stock disponible.`)
            }
        }

        activeLoans.splice(loanIndex, 1);

        alert(`Herramienta "${loan.name}" (Marca: ${loan.brand}) devuelta y reincorporada al inventario.`);

        renderInventory();
        renderActiveLoans();
        renderReports(); 
        populateToolSelect(); // Recargar el selector para reflejar el aumento de stock
    };

    // --- 8. Manejo de la Interfaz (Modales y Menú) ---
    
    // Funciones de limpieza/cierre
    const closeLoanModalHandler = () => {
        loanModal.style.display = "none";
        loanForm.reset();
        toolNameDisplay.textContent = '';
    };

    const closeToolModalHandler = () => {
        addToolModal.style.display = "none";
        addToolForm.reset();
        otherBrandGroup.classList.add('hidden');
        newToolGroups.forEach(group => group.classList.remove('hidden')); 
        newToolNameInput.setAttribute('required', 'required');
        newToolCategorySelect.setAttribute('required', 'required');
    }
    
    // Abrir Modales
    btnRegistrarPrestamo.addEventListener("click", () => {
        populateToolSelect(); // Asegura que el selector esté actualizado antes de abrir
        loanModal.style.display = "flex";
    });

    btnAddTool.addEventListener("click", () => {
        addToolModal.style.display = "flex";
    });

    // Cerrar Modales al hacer click en la X
    if (closeLoanModal) {
        closeLoanModal.addEventListener("click", closeLoanModalHandler);
    }
    
    if (closeToolModal) {
        closeToolModal.addEventListener("click", closeToolModalHandler);
    }

    // Cerrar Modales (Click fuera)
    window.addEventListener("click", (e) => {
        if (e.target === loanModal) {
            closeLoanModalHandler();
        } else if (e.target === addToolModal) {
            closeToolModalHandler();
        }
    });

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
                renderReports();
            }
        });
    });

    // --- 9. Manejo de Cerrar Sesión ---
    const handleLogout = () => {
        localStorage.removeItem('loggedIn'); 
        // Si hay un login.html, la siguiente línea te redirigirá.
        // window.location.href = 'login.html'; 
        alert("Sesión cerrada.");
        window.location.href = 'login.html';
    };

    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }
    
    // --- 10. Inicialización ---
    renderInventory();
    renderActiveLoans();
    renderReports(); 
    populateToolSelect(); // Inicializa el selector al cargar la página.
});