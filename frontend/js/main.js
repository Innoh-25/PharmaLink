// Main JavaScript for PharmaLink

// Initialize tooltips
$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Handle navigation active state
    const currentPage = window.location.pathname.split('/').pop();
    $('.nav-link').each(function() {
        const linkPage = $(this).attr('href');
        if (linkPage === currentPage) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
    
    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });
});

// Medication data
const medications = [
    "Panadol", "Augmentin", "Metformin", "Amlodipine", 
    "Omeprazole", "Amoxicillin", "Ventolin", "Losartan",
    "Atorvastatin", "Salbutamol", "Paracetamol", "Ibuprofen",
    "Cetirizine", "Aspirin", "Insulin", "Prednisone"
];

// Pharmacy data
const pharmacies = [
    {
        id: 1,
        name: "Goodlife Pharmacy Westlands",
        address: "ABC Place, Waiyaki Way, Nairobi",
        phone: "+254 711 123456",
        latitude: -1.265590,
        longitude: 36.807350,
        medications: {
            "Panadol": { price: 450, stock: 25 },
            "Amoxicillin": { price: 620, stock: 15 },
            "Metformin": { price: 550, stock: 30 }
        }
    },
    {
        id: 2,
        name: "Pharmaceutical Access Ltd",
        address: "Kimathi Street, CBD, Nairobi",
        phone: "+254 722 789012",
        latitude: -1.285270,
        longitude: 36.821350,
        medications: {
            "Panadol": { price: 420, stock: 18 },
            "Augmentin": { price: 750, stock: 12 },
            "Omeprazole": { price: 480, stock: 22 }
        }
    },
    {
        id: 3,
        name: "Mediheal Pharmacy",
        address: "Mombasa Road, Nairobi",
        phone: "+254 733 456789",
        latitude: -1.319240,
        longitude: 36.854870,
        medications: {
            "Panadol": { price: 480, stock: 5 },
            "Ventolin": { price: 850, stock: 8 },
            "Losartan": { price: 600, stock: 14 }
        }
    }
];

// User data (simulated)
let currentUser = null;
const users = [
    { id: 1, email: "patient@example.com", password: "password", role: "patient", name: "John Patient" },
    { id: 2, email: "pharmacist@example.com", password: "password", role: "pharmacist", name: "Sarah Pharmacist" },
    { id: 3, email: "admin@example.com", password: "password", role: "admin", name: "Admin User" }
];

// Reservation data
let reservations = [
    { id: 1, userId: 1, pharmacyId: 1, medication: "Panadol", quantity: 2, status: "pending", date: "2023-06-15" },
    { id: 2, userId: 1, pharmacyId: 2, medication: "Augmentin", quantity: 1, status: "completed", date: "2023-06-10" }
];

// Function to get user by credentials
function getUserByCredentials(email, password) {
    return users.find(user => user.email === email && user.password === password);
}

// Function to set current user
function setCurrentUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Function to get current user
function getCurrentUser() {
    if (!currentUser && localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }
    return currentUser;
}

// Function to logout user
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Function to check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Function to check user role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Function to redirect based on role
function redirectBasedOnRole() {
    const user = getCurrentUser();
    if (user) {
        switch(user.role) {
            case 'patient':
                window.location.href = 'patient.html';
                break;
            case 'pharmacist':
                window.location.href = 'pharmacist.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
        }
    }
}

// Function to show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    $('.alert-notification').remove();
    
    // Create notification
    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show alert-notification" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    
    // Add to page
    $('body').prepend(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}

// Updated main.js with API integration

const API_BASE_URL = 'http://localhost:5000/api';

// Authentication functions
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        throw error;
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        throw error;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function apiRequest(url, options = {}) {
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers,
            ...options
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logoutUser();
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Medication search
async function searchMedications(query) {
    return await apiRequest(`/patient/medications/search?q=${encodeURIComponent(query)}`);
}

// Pharmacy search
async function searchPharmacies(medication, location, lat, lng) {
    let url = `/patient/pharmacies/search?medication=${encodeURIComponent(medication)}`;
    
    if (location) {
        url += `&location=${encodeURIComponent(location)}`;
    }
    
    if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
    }
    
    return await apiRequest(url);
}

// Reservation functions
async function createReservation(reservationData) {
    return await apiRequest('/patient/reservations', {
        method: 'POST',
        body: JSON.stringify(reservationData)
    });
}

async function getReservations(page = 1, perPage = 10) {
    return await apiRequest(`/patient/reservations?page=${page}&per_page=${perPage}`);
}

async function cancelReservation(reservationId) {
    return await apiRequest(`/patient/reservations/${reservationId}/cancel`, {
        method: 'PUT'
    });
}

// Pharmacist functions
async function getPharmacistDashboard() {
    return await apiRequest('/pharmacist/dashboard');
}

async function getInventory(search = '', page = 1, perPage = 10) {
    let url = `/pharmacist/inventory?page=${page}&per_page=${perPage}`;
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    return await apiRequest(url);
}

async function updateInventoryItem(inventoryId, data) {
    return await apiRequest(`/pharmacist/inventory/${inventoryId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function addInventoryItem(data) {
    return await apiRequest('/pharmacist/inventory', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getPharmacyReservations(status = '', page = 1, perPage = 10) {
    let url = `/pharmacist/reservations?page=${page}&per_page=${perPage}`;
    
    if (status) {
        url += `&status=${status}`;
    }
    
    return await apiRequest(url);
}

async function updateReservationStatus(reservationId, status) {
    return await apiRequest(`/pharmacist/reservations/${reservationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

// Admin functions
async function getAdminDashboard() {
    return await apiRequest('/admin/dashboard');
}

async function getUsers(role = '', search = '', page = 1, perPage = 10) {
    let url = `/admin/users?page=${page}&per_page=${perPage}`;
    
    if (role) {
        url += `&role=${role}`;
    }
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    return await apiRequest(url);
}

async function updateUser(userId, data) {
    return await apiRequest(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function getPharmacies(subscriptionStatus = '', search = '', page = 1, perPage = 10) {
    let url = `/admin/pharmacies?page=${page}&per_page=${perPage}`;
    
    if (subscriptionStatus) {
        url += `&subscription_status=${subscriptionStatus}`;
    }
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    return await apiRequest(url);
}

async function getSubscriptions(status = '', page = 1, perPage = 10) {
    let url = `/admin/subscriptions?page=${page}&per_page=${perPage}`;
    
    if (status) {
        url += `&status=${status}`;
    }
    
    return await apiRequest(url);
}

async function getAdvertisements(active = null, page = 1, perPage = 10) {
    let url = `/admin/advertisements?page=${page}&per_page=${perPage}`;
    
    if (active !== null) {
        url += `&active=${active}`;
    }
    
    return await apiRequest(url);
}

async function createAdvertisement(data) {
    return await apiRequest('/admin/advertisements', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getAnalytics() {
    return await apiRequest('/admin/analytics');
}

// User management functions
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
}

function isLoggedIn() {
    return !!localStorage.getItem('accessToken');
}

function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

function redirectBasedOnRole() {
    const user = getCurrentUser();
    if (user) {
        switch(user.role) {
            case 'patient':
                window.location.href = 'patient.html';
                break;
            case 'pharmacist':
                window.location.href = 'pharmacist.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
        }
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    $('.alert-notification').remove();
    
    // Create notification
    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show alert-notification" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    
    // Add to page
    $('body').prepend(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}