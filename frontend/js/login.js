// Login-specific JavaScript

$(document).ready(function() {
    // If user is already logged in, redirect to appropriate page
    const user = getCurrentUser();
    if (user) {
        redirectBasedOnRole();
    }
    
    // Demo login buttons
    $('.demo-login').click(function() {
        const email = $(this).data('email');
        const password = $(this).data('password');
        
        $('#login-email').val(email);
        $('#login-password').val(password);
        
        // Auto-submit the form
        $('#login-form').submit();
    });
    
    // Form submission
    $('#login-form').submit(function(e) {
        e.preventDefault();
        
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        
        if (!email || !password) {
            showNotification('Please enter both email and password', 'warning');
            return;
        }
        
        // Check credentials
        const user = getUserByCredentials(email, password);
        
        if (user) {
            // Set current user
            setCurrentUser(user);
            
            // Show success message
            showNotification(`Welcome back, ${user.name}!`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                redirectBasedOnRole();
            }, 1000);
        } else {
            showNotification('Invalid email or password', 'error');
        }
    });
});
