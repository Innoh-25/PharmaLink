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