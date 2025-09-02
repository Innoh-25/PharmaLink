// Admin-specific JavaScript

$(document).ready(function() {
    // Check if user is logged in and has admin role
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update logout link
    $('#logoutLink').text('Logout').attr('href', '#').click(function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Sample data
    const subscriptions = [
        { id: 1, pharmacy: "Goodlife Pharmacy Westlands", plan: "Premium", frequency: "Monthly", status: "active", endDate: "2023-12-15" },
        { id: 2, pharmacy: "Pharmaceutical Access Ltd", plan: "Basic", frequency: "Annual", status: "active", endDate: "2024-03-10" },
        { id: 3, pharmacy: "Mediheal Pharmacy", plan: "Premium", frequency: "Monthly", status: "expiring", endDate: "2023-06-30" }
    ];
    
    const advertisements = [
        { id: 1, title: "HealthPlus Vitamin Campaign", impressions: 12542, clicks: 842, ctr: 6.7 },
        { id: 2, title: "Mediheal Wellness Package", impressions: 8765, clicks: 523, ctr: 6.0 },
        { id: 3, title: "PharmaCare Discount Offer", impressions: 15234, clicks: 1243, ctr: 8.2 }
    ];
    
    const users = [
        { id: 1, name: "John Patient", email: "patient@example.com", role: "patient", status: "active" },
        { id: 2, name: "Sarah Pharmacist", email: "pharmacist@example.com", role: "pharmacist", status: "active" },
        { id: 3, name: "Admin User", email: "admin@example.com", role: "admin", status: "active" },
        { id: 4, name: "David Kimani", email: "david@example.com", role: "patient", status: "inactive" }
    ];
    
    // Analytics data
    const analytics = {
        searchRequests: 1243,
        reservations: 324,
        newUsers: 187,
        revenue: 42350
    };
    
    // Load dashboard data
    loadDashboard();
    
    // Refresh button
    $('#refreshBtn').click(function() {
        showNotification('Admin data refreshed', 'success');
        loadDashboard();
    });
    
    // Add user button
    $('#addUserBtn').click(function() {
        showNotification('User creation form would open here', 'info');
    });
    
    // Load dashboard data
    function loadDashboard() {
        // Update stats
        $('#totalPharmacies').text('42');
        $('#premiumSubscriptions').text('18');
        $('#totalRevenue').text('KES 125,800');
        $('#totalUsers').text('3,542');
        
        // Load subscriptions
        loadSubscriptions();
        
        // Load advertisement performance
        loadAdPerformance();
        
        // Load analytics
        loadAnalytics();
        
        // Load users
        loadUsers();
    }
    
    // Load subscriptions
    function loadSubscriptions() {
        const subscriptionsList = $('#subscriptionsList');
        subscriptionsList.empty();
        
        subscriptions.forEach(sub => {
            let badgeClass = '';
            switch(sub.status) {
                case 'active': badgeClass = 'bg-success'; break;
                case 'expiring': badgeClass = 'bg-warning'; break;
                case 'cancelled': badgeClass = 'bg-danger'; break;
                default: badgeClass = 'bg-secondary';
            }
            
            subscriptionsList.append(`
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${sub.pharmacy}</h6>
                            <small class="text-muted">${sub.plan} Plan - ${sub.frequency}</small>
                        </div>
                        <span class="badge ${badgeClass}">${sub.status}</span>
                    </div>
                    <small class="text-muted">Renews on: ${sub.endDate}</small>
                </div>
            `);
        });
    }
    
    // Load advertisement performance
    function loadAdPerformance() {
        const adPerformanceList = $('#adPerformanceList');
        adPerformanceList.empty();
        
        advertisements.forEach(ad => {
            adPerformanceList.append(`
                <div class="list-group-item">
                    <h6 class="mb-1">${ad.title}</h6>
                    <small class="text-muted">Impressions: ${ad.impressions.toLocaleString()} | Clicks: ${ad.clicks} | CTR: ${ad.ctr}%</small>
                    <div class="progress mt-2" style="height: 10px;">
                        <div class="progress-bar bg-success" style="width: ${ad.ctr * 10}%"></div>
                    </div>
                </div>
            `);
        });
    }
    
    // Load analytics
    function loadAnalytics() {
        const analyticsData = $('#analyticsData');
        analyticsData.empty();
        
        analyticsData.append(`
            <div class="col-md-3 col-6 mb-3">
                <h6>Search Requests</h6>
                <div class="display-4 text-primary">${analytics.searchRequests.toLocaleString()}</div>
                <small class="text-muted">Today</small>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <h6>Reservations</h6>
                <div class="display-4 text-success">${analytics.reservations}</div>
                <small class="text-muted">This Week</small>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <h6>New Users</h6>
                <div class="display-4 text-info">${analytics.newUsers}</div>
                <small class="text-muted">This Month</small>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <h6>Revenue</h6>
                <div class="display-4 text-warning">KES ${analytics.revenue.toLocaleString()}</div>
                <small class="text-muted">Current Month</small>
            </div>
        `);
    }
    
    // Load users
    function loadUsers() {
        const usersTable = $('#usersTable tbody');
        usersTable.empty();
        
        users.forEach(user => {
            let badgeClass = user.status === 'active' ? 'bg-success' : 'bg-secondary';
            
            usersTable.append(`
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><span class="badge ${badgeClass}">${user.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 edit-user-btn" data-id="${user.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `);
        });
        
        // Add event handlers for edit and delete buttons
        $('.edit-user-btn').click(function() {
            const id = $(this).data('id');
            const user = users.find(u => u.id === id);
            if (user) {
                showNotification(`Edit user functionality would open for ${user.name}`, 'info');
            }
        });
        
        $('.delete-user-btn').click(function() {
            const id = $(this).data('id');
            const user = users.find(u => u.id === id);
            if (user) {
                if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                    showNotification(`User ${user.name} would be deleted`, 'info');
                }
            }
        });
    }
});
