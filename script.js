<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
    // Global variables
    let inventory = [];
    let currentItemToDelete = null;
    let currentItemForDetails = null;

    // Initialize the application
    document.addEventListener('DOMContentLoaded', function() {
        loadInventory();
        setupEventListeners();
        updateInventoryDisplay();
        updateCadetDisplay();
    });

    // Load inventory from localStorage
    function loadInventory() {
        const savedInventory = localStorage.getItem('capInventory');
        if (savedInventory) {
            inventory = JSON.parse(savedInventory);
        }
    }

    // Save inventory to localStorage
    function saveInventory() {
        localStorage.setItem('capInventory', JSON.stringify(inventory));
    }

    // Setup event listeners
    function setupEventListeners() {
        // Add item form
        document.getElementById('addItemForm').addEventListener('submit', addItem);
        
        // Search and filter inputs
        document.getElementById('searchInput').addEventListener('input', updateInventoryDisplay);
        document.getElementById('filterType').addEventListener('change', updateInventoryDisplay);
        document.getElementById('filterStatus').addEventListener('change', updateInventoryDisplay);
        
        // Cadet search and filter
        document.getElementById('cadetSearchInput').addEventListener('input', updateCadetDisplay);
        document.getElementById('cadetFilterType').addEventListener('change', updateCadetDisplay);
        document.getElementById('cadetFilterAvailability').addEventListener('change', updateCadetDisplay);
        
        // Status change in edit form
        document.getElementById('editItemStatus').addEventListener('change', function() {
            const assignedToField = document.getElementById('editAssignedTo');
            if (this.value === 'In Inventory') {
                assignedToField.value = '';
                assignedToField.disabled = true;
            } else {
                assignedToField.disabled = false;
            }
        });
        
        // Status change in add form
        document.getElementById('itemStatus').addEventListener('change', function() {
            const assignedToField = document.getElementById('assignedTo');
            if (this.value === 'In Inventory') {
                assignedToField.value = '';
                assignedToField.disabled = true;
            } else {
                assignedToField.disabled = false;
            }
        });
    }

    // Page navigation functions
    function showHome() {
        document.getElementById('homePage').classList.remove('hidden');
        document.getElementById('adminPage').classList.add('hidden');
        document.getElementById('cadetPage').classList.add('hidden');
        document.getElementById('homeBtn').style.display = 'none';
        document.getElementById('navTitle').textContent = 'Civil Air Patrol - Squadron Inventory';
    }

    function showAdmin() {
        document.getElementById('homePage').classList.add('hidden');
        document.getElementById('adminPage').classList.remove('hidden');
        document.getElementById('cadetPage').classList.add('hidden');
        document.getElementById('homeBtn').style.display = 'inline-block';
        document.getElementById('navTitle').textContent = 'Admin Portal';
        updateInventoryDisplay();
    }

    function showCadet() {
        document.getElementById('homePage').classList.add('hidden');
        document.getElementById('adminPage').classList.add('hidden');
        document.getElementById('cadetPage').classList.remove('hidden');
        document.getElementById('homeBtn').style.display = 'inline-block';
        document.getElementById('navTitle').textContent = 'Cadet Portal';
        updateCadetDisplay();
    }

    // Add new item
    function addItem(event) {
        event.preventDefault();
        
        const itemName = document.getElementById('itemName').value.trim();
        const itemType = document.getElementById('itemType').value;
        const serialNumber = document.getElementById('serialNumber').value.trim();
        const itemStatus = document.getElementById('itemStatus').value;
        const assignedTo = document.getElementById('assignedTo').value.trim();
        const itemDescription = document.getElementById('itemDescription').value.trim();

        // Validation
        if (!itemName || !itemType || !serialNumber || !itemStatus) {
            showAlert('Please fill in all required fields.', 'danger');
            return;
        }

        // Check for duplicate serial number
        if (inventory.some(item => item.serialNumber === serialNumber)) {
            showAlert('An item with this serial number already exists.', 'danger');
            return;
        }

        // Validate assignment
        if (itemStatus === 'Assigned' && !assignedTo) {
            showAlert('Please specify who the item is assigned to.', 'danger');
            return;
        }

        // Create new item
        const newItem = {
            id: Date.now().toString(),
            name: itemName,
            type: itemType,
            serialNumber: serialNumber,
            status: itemStatus,
            assignedTo: itemStatus === 'Assigned' ? assignedTo : '',
            description: itemDescription,
            dateAdded: new Date().toISOString()
        };

        inventory.push(newItem);
        saveInventory();
        updateInventoryDisplay();
        
        // Reset form
        document.getElementById('addItemForm').reset();
        document.getElementById('assignedTo').disabled = true;
        
        showAlert('Item added successfully!', 'success');
    }

    // Update inventory display
    function updateInventoryDisplay() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('filterType').value;
        const statusFilter = document.getElementById('filterStatus').value;

        let filteredInventory = inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                item.serialNumber.toLowerCase().includes(searchTerm) ||
                                item.assignedTo.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || item.type === typeFilter;
            const matchesStatus = !statusFilter || item.status === statusFilter;
            
            return matchesSearch && matchesType && matchesStatus;
        });

        const tableBody = document.getElementById('inventoryTableBody');
        const emptyState = document.getElementById('emptyInventory');
        const itemCount = document.getElementById('itemCount');

        if (filteredInventory.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('hidden');
            itemCount.textContent = '0 items';
        } else {
            emptyState.classList.add('hidden');
            itemCount.textContent = `${filteredInventory.length} item${filteredInventory.length !== 1 ? 's' : ''}`;
            
            tableBody.innerHTML = filteredInventory.map(item => `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td><span class="badge bg-info">${escapeHtml(item.type)}</span></td>
                    <td><code>${escapeHtml(item.serialNumber)}</code></td>
                    <td>
                        <span class="badge status-badge ${item.status === 'In Inventory' ? 'bg-success' : 'bg-warning text-dark'}">
                            ${escapeHtml(item.status)}
                        </span>
                    </td>
                    <td>${item.assignedTo ? escapeHtml(item.assignedTo) : '<span class="text-muted">-</span>'}</td>
                    <td>${item.description ? escapeHtml(item.description) : '<span class="text-muted">-</span>'}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editItem('${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteItem('${item.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Update cadet display
    function updateCadetDisplay() {
        const searchTerm = document.getElementById('cadetSearchInput').value.toLowerCase();
        const typeFilter = document.getElementById('cadetFilterType').value;
        const availabilityFilter = document.getElementById('cadetFilterAvailability').value;

        let filteredInventory = inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                item.type.toLowerCase().includes(searchTerm) ||
                                item.description.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || item.type === typeFilter;
            const matchesAvailability = !availabilityFilter || 
                                      (availabilityFilter === 'available' && item.status === 'In Inventory') ||
                                      (availabilityFilter === 'assigned' && item.status === 'Assigned');
            
            return matchesSearch && matchesType && matchesAvailability;
        });

        const itemsGrid = document.getElementById('cadetItemsGrid');
        const emptyState = document.getElementById('emptyCadetItems');

        if (filteredInventory.length === 0) {
            itemsGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            itemsGrid.innerHTML = filteredInventory.map(item => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card cadet-item-card h-100" onclick="showItemDetails('${item.id}')">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title mb-0">${escapeHtml(item.name)}</h5>
                                <span class="badge ${item.status === 'In Inventory' ? 'bg-success' : 'bg-warning text-dark'}">
                                    ${escapeHtml(item.status)}
                                </span>
                            </div>
                            <p class="text-muted mb-2">
                                <i class="fas fa-tag me-1"></i>${escapeHtml(item.type)}
                            </p>
                            <p class="text-muted mb-2">
                                <i class="fas fa-barcode me-1"></i><code>${escapeHtml(item.serialNumber)}</code>
                            </p>
                            ${item.description ? `<p class="card-text">${escapeHtml(item.description)}</p>` : ''}
                            ${item.status === 'Assigned' ? 
                                `<p class="text-warning mb-0">
                                    <i class="fas fa-user me-1"></i>Assigned to: ${escapeHtml(item.assignedTo)}
                                </p>` : 
                                `<p class="text-success mb-0">
                                    <i class="fas fa-check-circle me-1"></i>Available for request
                                </p>`
                            }
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Edit item
    function editItem(itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        // Populate edit form
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name;
        document.getElementById('editItemType').value = item.type;
        document.getElementById('editSerialNumber').value = item.serialNumber;
        document.getElementById('editItemStatus').value = item.status;
        document.getElementById('editAssignedTo').value = item.assignedTo;
        document.getElementById('editItemDescription').value = item.description;

        // Handle assigned to field state
        const assignedToField = document.getElementById('editAssignedTo');
        if (item.status === 'In Inventory') {
            assignedToField.disabled = true;
        } else {
            assignedToField.disabled = false;
        }

        const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
        modal.show();
    }

    // Save edited item
    function saveEditItem() {
        const itemId = document.getElementById('editItemId').value;
        const itemName = document.getElementById('editItemName').value.trim();
        const itemType = document.getElementById('editItemType').value;
        const serialNumber = document.getElementById('editSerialNumber').value.trim();
        const itemStatus = document.getElementById('editItemStatus').value;
        const assignedTo = document.getElementById('editAssignedTo').value.trim();
        const itemDescription = document.getElementById('editItemDescription').value.trim();

        // Validation
        if (!itemName || !itemType || !serialNumber || !itemStatus) {
            showAlert('Please fill in all required fields.', 'danger');
            return;
        }

        // Check for duplicate serial number (excluding current item)
        if (inventory.some(item => item.serialNumber === serialNumber && item.id !== itemId)) {
            showAlert('An item with this serial number already exists.', 'danger');
            return;
        }

        // Validate assignment
        if (itemStatus === 'Assigned' && !assignedTo) {
            showAlert('Please specify who the item is assigned to.', 'danger');
            return;
        }

        // Find and update item
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            inventory[itemIndex] = {
                ...inventory[itemIndex],
                name: itemName,
                type: itemType,
                serialNumber: serialNumber,
                status: itemStatus,
                assignedTo: itemStatus === 'Assigned' ? assignedTo : '',
                description: itemDescription
            };

            saveInventory();
            updateInventoryDisplay();
            updateCadetDisplay();

            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            modal.hide();

            showAlert('Item updated successfully!', 'success');
        }
    }

    // Delete item
    function deleteItem(itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        currentItemToDelete = itemId;
        const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        modal.show();

        // Set up delete confirmation
        document.getElementById('confirmDeleteBtn').onclick = function() {
            if (currentItemToDelete) {
                const itemIndex = inventory.findIndex(item => item.id === currentItemToDelete);
                if (itemIndex !== -1) {
                    inventory.splice(itemIndex, 1);
                    saveInventory();
                    updateInventoryDisplay();
                    updateCadetDisplay();
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
                    modal.hide();
                    
                    showAlert('Item deleted successfully!', 'success');
                }
                currentItemToDelete = null;
            }
        };
    }

    // Show item details for cadet view
    function showItemDetails(itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        currentItemForDetails = item;

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Item Information</h6>
                    <p><strong>Name:</strong> ${escapeHtml(item.name)}</p>
                    <p><strong>Type:</strong> <span class="badge bg-info">${escapeHtml(item.type)}</span></p>
                    <p><strong>Serial/ID:</strong> <code>${escapeHtml(item.serialNumber)}</code></p>
                    <p><strong>Status:</strong> 
                        <span class="badge ${item.status === 'In Inventory' ? 'bg-success' : 'bg-warning text-dark'}">
                            ${escapeHtml(item.status)}
                        </span>
                    </p>
                </div>
                <div class="col-md-6">
                    <h6>Availability</h6>
                    ${item.status === 'Assigned' ? 
                        `<p><strong>Currently assigned to:</strong> ${escapeHtml(item.assignedTo)}</p>
                         <p class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>This item is not currently available.</p>` :
                        `<p class="text-success"><i class="fas fa-check-circle me-1"></i>This item is available for assignment.</p>`
                    }
                    ${item.description ? `<p><strong>Description:</strong> ${escapeHtml(item.description)}</p>` : ''}
                </div>
            </div>
        `;

        document.getElementById('itemDetailsContent').innerHTML = content;

        // Show/hide request button based on availability
        const requestBtn = document.getElementById('requestItemBtn');
        if (item.status === 'In Inventory') {
            requestBtn.style.display = 'inline-block';
        } else {
            requestBtn.style.display = 'none';
        }

        const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
        modal.show();
    }

    // Request item - show the request form modal
    function requestItem() {
        if (!currentItemForDetails || currentItemForDetails.status !== 'In Inventory') return;

        // Populate the item information in the request modal
        const itemInfo = `
            <strong>Item:</strong> ${escapeHtml(currentItemForDetails.name)}<br>
            <strong>Type:</strong> <span class="badge bg-info">${escapeHtml(currentItemForDetails.type)}</span><br>
            <strong>Serial/ID:</strong> <code>${escapeHtml(currentItemForDetails.serialNumber)}</code>
            ${currentItemForDetails.description ? `<br><strong>Description:</strong> ${escapeHtml(currentItemForDetails.description)}` : ''}
        `;
        
        document.getElementById('requestItemInfo').innerHTML = itemInfo;
        document.getElementById('requestItemId').value = currentItemForDetails.id;
        
        // Clear the form
        document.getElementById('cadetName').value = '';
        document.getElementById('cadetId').value = '';
        
        // Hide the item details modal
        const itemDetailsModal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
        itemDetailsModal.hide();
        
        // Show the request modal
        const requestModal = new bootstrap.Modal(document.getElementById('requestItemModal'));
        requestModal.show();
    }

    // Submit the item request
    function submitItemRequest() {
        const itemId = document.getElementById('requestItemId').value;
        const cadetName = document.getElementById('cadetName').value.trim();
        const cadetId = document.getElementById('cadetId').value.trim();
        
        // Validation
        if (!cadetName || !cadetId) {
            showAlert('Please fill in both your name and CAP ID.', 'danger');
            return;
        }
        
        // Find the item
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            showAlert('Item not found.', 'danger');
            return;
        }
        
        const item = inventory[itemIndex];
        
        // Check if item is still available
        if (item.status !== 'In Inventory') {
            showAlert('This item is no longer available for request.', 'warning');
            return;
        }
        
        // Update the item status
        inventory[itemIndex].status = 'Assigned';
        inventory[itemIndex].assignedTo = `${cadetName} (${cadetId})`;
        inventory[itemIndex].dateAssigned = new Date().toISOString();
        
        // Save to localStorage
        saveInventory();
        
        // Update all displays
        updateInventoryDisplay();
        updateCadetDisplay();
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestItemModal'));
        modal.hide();
        
        // Show success message
        showAlert(`Request submitted successfully! "${item.name}" has been assigned to ${cadetName}.`, 'success');
    }

    // Clear filters
    function clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterStatus').value = '';
        updateInventoryDisplay();
    }

    // Clear cadet filters
    function clearCadetFilters() {
        document.getElementById('cadetSearchInput').value = '';
        document.getElementById('cadetFilterType').value = '';
        document.getElementById('cadetFilterAvailability').value = '';
        updateCadetDisplay();
    }

    // Show alert messages
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${escapeHtml(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = bootstrap.Alert.getInstance(alert);
                if (bsAlert) {
                    bsAlert.close();
                }
            }
        }, 5000);
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
</script>
</body>
</html>
