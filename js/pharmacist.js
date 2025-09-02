// Pharmacist-specific JavaScript

$(document).ready(function() {
    // Check if user is logged in and has pharmacist role
    const user = getCurrentUser();
    if (!user || user.role !== 'pharmacist') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update logout link
    $('#logoutLink').text('Logout').attr('href', '#').click(function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Sample inventory data
    const inventory = [
        { id: 1, name: "Panadol Extra", category: "Pain Relief", stock: 45, price: 450 },
        { id: 2, name: "Amoxicillin 500mg", category: "Antibiotic", stock: 32, price: 620 },
        { id: 3, name: "Metformin 850mg", category: "Diabetes", stock: 28, price: 550 },
        { id: 4, name: "Augmentin 625mg", category: "Antibiotic", stock: 3, price: 750 },
        { id: 5, name: "Ventolin Inhaler", category: "Asthma", stock: 5, price: 850 },
        { id: 6, name: "Omeprazole 40mg", category: "Acid Reflux", stock: 7, price: 480 },
        { id: 7, name: "Losartan 50mg", category: "Blood Pressure", stock: 22, price: 600 },
        { id: 8, name: "Atorvastatin 20mg", category: "Cholesterol", stock: 18, price: 720 }
    ];
    
    // Sample reservations data
    const reservations = [
        { id: 1, customer: "John Mwangi", medication: "Panadol Extra", quantity: 2, status: "pending", date: "2023-06-15" },
        { id: 2, customer: "Sarah Ochieng", medication: "Amoxicillin 500mg", quantity: 1, status: "completed", date: "2023-06-10" },
        { id: 3, customer: "David Kimani", medication: "Metformin 850mg", quantity: 3, status: "ready", date: "2023-06-14" },
        { id: 4, customer: "Grace Auma", medication: "Losartan 50mg", quantity: 1, status: "pending", date: "2023-06-13" }
    ];
    
    // Load dashboard data
    loadDashboard();
    
    // Refresh button
    $('#refreshBtn').click(function() {
        showNotification('Dashboard data refreshed', 'success');
        loadDashboard();
    });
    
    // Add medication button
    $('#addMedicationBtn').click(function() {
        $('#add-medication-form')[0].reset();
        $('#addMedicationModal').modal('show');
    });
    
    // Save medication
    $('#save-medication').click(function() {
        const name = $('#med-name').val();
        const category = $('#med-category').val();
        const stock = $('#med-stock').val();
        const price = $('#med-price').val();
        
        if (!name || !category || !stock || !price) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }
        
        // Add to inventory (simulate)
        const newMed = {
            id: inventory.length + 1,
            name: name,
            category: category,
            stock: parseInt(stock),
            price: parseFloat(price)
        };
        
        inventory.push(newMed);
        
        // Close modal
        $('#addMedicationModal').modal('hide');
        
        // Show success message
        showNotification(`Added ${name} to inventory`, 'success');
        
        // Reload inventory
        loadInventory();
        loadDashboard();
    });
    
    // Inventory search
    $('#inventorySearch').on('input', function() {
        const query = $(this).val().toLowerCase();
        filterInventory(query);
    });
    
    // Clear search
    $('#clearSearch').click(function() {
        $('#inventorySearch').val('');
        filterInventory('');
    });
    
    // Load dashboard data
    function loadDashboard() {
        // Calculate stats
        const pendingReservations = reservations.filter(r => r.status === 'pending').length;
        const lowStockItems = inventory.filter(i => i.stock < 10).length;
        
        // Update stats
        $('#pendingReservations').text(pendingReservations);
        $('#totalMedications').text(inventory.length);
        $('#lowStockItems').text(lowStockItems);
        
        // Load reservations
        loadReservations();
        
        // Load low stock items
        loadLowStockItems();
        
        // Load inventory
        loadInventory();
    }
    
    // Load reservations
    function loadReservations() {
        const reservationsList = $('#reservationsList');
        reservationsList.empty();
        
        // Show only recent 3 reservations
        const recentReservations = reservations.slice(0, 3);
        
        recentReservations.forEach(reservation => {
            let badgeClass = '';
            switch(reservation.status) {
                case 'pending': badgeClass = 'bg-warning'; break;
                case 'ready': badgeClass = 'bg-primary'; break;
                case 'completed': badgeClass = 'bg-success'; break;
                default: badgeClass = 'bg-secondary';
            }
            
            reservationsList.append(`
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${reservation.customer}</h6>
                        <small class="text-muted">${reservation.medication} - ${reservation.quantity} pack(s)</small>
                    </div>
                    <span class="badge ${badgeClass}">${reservation.status}</span>
                </div>
            `);
        });
    }
    
    // Load low stock items
    function loadLowStockItems() {
        const lowStockList = $('#lowStockList');
        lowStockList.empty();
        
        const lowStockItems = inventory.filter(i => i.stock < 10);
        
        if (lowStockItems.length === 0) {
            lowStockList.append(`
                <div class="text-center py-3 text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p>All items are well stocked</p>
                </div>
            `);
            return;
        }
        
        // Show only top 3 low stock items
        const topLowStock = lowStockItems.slice(0, 3);
        
        topLowStock.forEach(item => {
            let urgency = item.stock < 5 ? 'Urgent' : 'Low';
            let badgeClass = item.stock < 5 ? 'bg-danger' : 'bg-warning';
            
            lowStockList.append(`
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">Only ${item.stock} units left</small>
                    </div>
                    <span class="badge ${badgeClass}">${urgency}</span>
                </div>
            `);
        });
    }
    
    // Load inventory
    function loadInventory() {
        const inventoryTable = $('#inventoryTable tbody');
        inventoryTable.empty();
        
        inventory.forEach(item => {
            let stockClass = item.stock < 10 ? 'text-danger' : '';
            let stockText = item.stock < 10 ? `${item.stock} (Low)` : item.stock;
            
            inventoryTable.append(`
                <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td class="${stockClass}">${stockText}</td>
                    <td>${item.price}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}">Delete</button>
                    </td>
                </tr>
            `);
        });
        
        // Add event handlers for edit and delete buttons
        $('.edit-btn').click(function() {
            const id = $(this).data('id');
            const item = inventory.find(i => i.id === id);
            if (item) {
                // In a real app, this would open an edit modal
                showNotification(`Edit functionality would open for ${item.name}`, 'info');
            }
        });
        
        $('.delete-btn').click(function() {
            const id = $(this).data('id');
            const item = inventory.find(i => i.id === id);
            if (item) {
                if (confirm(`Are you sure you want to delete ${item.name} from inventory?`)) {
                    // In a real app, this would make an API call
                    const index = inventory.findIndex(i => i.id === id);
                    if (index !== -1) {
                        inventory.splice(index, 1);
                        loadInventory();
                        loadDashboard();
                        showNotification(`${item.name} deleted from inventory`, 'success');
                    }
                }
            }
        });
    }
    
    // Filter inventory
    function filterInventory(query) {
        const rows = $('#inventoryTable tbody tr');
        
        if (!query) {
            rows.show();
            return;
        }
        
        rows.each(function() {
            const name = $(this).find('td:first').text().toLowerCase();
            const category = $(this).find('td:nth-child(2)').text().toLowerCase();
            
            if (name.includes(query) || category.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }
});