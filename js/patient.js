// Patient-specific JavaScript

$(document).ready(function() {
    // Check if user is logged in and has patient role
    const user = getCurrentUser();
    if (!user || user.role !== 'patient') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update logout link
    $('#logoutLink').text('Logout').attr('href', '#').click(function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Medication search suggestions
    $('#medication').on('input', function() {
        const query = $(this).val().toLowerCase();
        if (query.length > 1) {
            const filteredMeds = medications.filter(med => 
                med.toLowerCase().includes(query)
            );
            
            const suggestions = $('#medication-suggestions');
            suggestions.empty();
            
            if (filteredMeds.length > 0) {
                suggestions.show();
                filteredMeds.forEach(med => {
                    suggestions.append(
                        `<a href="#" class="list-group-item list-group-item-action">${med}</a>`
                    );
                });
                
                // Click suggestion to autocomplete
                $('.list-group-item', suggestions).click(function(e) {
                    e.preventDefault();
                    $('#medication').val($(this).text());
                    suggestions.hide();
                });
            } else {
                suggestions.hide();
            }
        } else {
            $('#medication-suggestions').hide();
        }
    });
    
    // Hide suggestions when clicking elsewhere
    $(document).click(function(e) {
        if (!$(e.target).closest('#medication, #medication-suggestions').length) {
            $('#medication-suggestions').hide();
        }
    });
    
    // Get current location
    $('#current-location').click(function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    $('#location').val('Current Location');
                    showNotification('Location detected! Searching for nearby pharmacies...', 'success');
                    
                    // Simulate search after getting location
                    setTimeout(() => {
                        performSearch($('#medication').val(), 'Current Location');
                    }, 1500);
                },
                function(error) {
                    showNotification('Unable to retrieve your location. Please enter it manually.', 'warning');
                }
            );
        } else {
            showNotification('Geolocation is not supported by your browser. Please enter your location manually.', 'warning');
        }
    });
    
    // Form submission
    $('#medication-search').submit(function(e) {
        e.preventDefault();
        const medication = $('#medication').val();
        const location = $('#location').val();
        
        if (!medication || !location) {
            showNotification('Please enter both medication and location to search.', 'warning');
            return;
        }
        
        performSearch(medication, location);
    });
    
    // Perform search function
    function performSearch(medication, location) {
        showNotification(`Searching for "${medication}" near "${location}"...`, 'info');
        
        // Simulate API call delay
        setTimeout(() => {
            // Filter pharmacies that have the medication
            const results = pharmacies.filter(pharmacy => 
                pharmacy.medications[medication] && pharmacy.medications[medication].stock > 0
            );
            
            if (results.length === 0) {
                showNotification(`No pharmacies found with ${medication} in stock.`, 'warning');
                $('#pharmacy-results').html(`
                    <div class="alert alert-warning">
                        No pharmacies found with "${medication}" in stock. Please try a different medication.
                    </div>
                `);
                return;
            }
            
            // Update map display
            $('#map-container').html(`
                <div class="text-center p-4">
                    <i class="fas fa-map-marked-alt fa-3x mb-3 text-success"></i>
                    <p>Found ${results.length} pharmacies with "${medication}" near "${location}"</p>
                    <small class="text-muted">Actual Google Maps would show locations of these pharmacies</small>
                </div>
            `);
            
            // Display results
            let resultsHtml = '';
            results.forEach(pharmacy => {
                const medInfo = pharmacy.medications[medication];
                const stockStatus = medInfo.stock < 10 ? 'warning' : 'success';
                const stockText = medInfo.stock < 10 ? 'Low Stock' : 'In Stock';
                
                resultsHtml += `
                    <div class="card pharmacy-card" data-pharmacy-id="${pharmacy.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h5>${pharmacy.name}</h5>
                                    <p class="text-muted">${pharmacy.address}</p>
                                    <p><i class="fas fa-phone me-2"></i>${pharmacy.phone}</p>
                                    <p class="text-${stockStatus}"><i class="fas fa-cubes me-2"></i>${stockText}: ${medInfo.stock} units</p>
                                </div>
                                <div class="text-end">
                                    <p class="text-success fw-bold">KES ${medInfo.price}</p>
                                    <p class="text-muted">Approx. 2.5km away</p>
                                    <button class="btn btn-sm btn-outline-primary reserve-btn" data-pharmacy-id="${pharmacy.id}" data-medication="${medication}">Reserve Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            $('#pharmacy-results').html(resultsHtml);
            
            // Add click event to reserve buttons
            $('.reserve-btn').click(function() {
                const pharmacyId = $(this).data('pharmacy-id');
                const medication = $(this).data('medication');
                
                // Set modal values
                $('#reserve-pharmacy-id').val(pharmacyId);
                $('#reserve-medication').val(medication);
                $('#reserve-name').val(user.name);
                
                // Show modal
                $('#reservationModal').modal('show');
            });
            
            showNotification(`Found ${results.length} pharmacies with ${medication} in stock.`, 'success');
        }, 2000);
    }
    
    // Confirm reservation
    $('#confirm-reservation').click(function() {
        const pharmacyId = $('#reserve-pharmacy-id').val();
        const medication = $('#reserve-medication').val();
        const quantity = $('#reserve-quantity').val();
        const name = $('#reserve-name').val();
        const phone = $('#reserve-phone').val();
        const notes = $('#reserve-notes').val();
        
        if (!name || !phone) {
            showNotification('Please provide your name and phone number.', 'warning');
            return;
        }
        
        // Find pharmacy
        const pharmacy = pharmacies.find(p => p.id == pharmacyId);
        if (!pharmacy) {
            showNotification('Pharmacy not found.', 'error');
            return;
        }
        
        // Check stock
        if (pharmacy.medications[medication].stock < quantity) {
            showNotification(`Not enough stock. Only ${pharmacy.medications[medication].stock} units available.`, 'warning');
            return;
        }
        
        // Create reservation (simulate)
        const newReservation = {
            id: reservations.length + 1,
            userId: user.id,
            pharmacyId: pharmacyId,
            medication: medication,
            quantity: quantity,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            customerName: name,
            customerPhone: phone,
            notes: notes
        };
        
        reservations.push(newReservation);
        
        // Update stock (simulate)
        pharmacy.medications[medication].stock -= quantity;
        
        // Close modal
        $('#reservationModal').modal('hide');
        
        // Show success message
        showNotification(`Reservation confirmed for ${quantity} ${medication} at ${pharmacy.name}.`, 'success');
        
        // Update UI
        $(`.pharmacy-card[data-pharmacy-id="${pharmacyId}"] .text-warning, .pharmacy-card[data-pharmacy-id="${pharmacyId}"] .text-success`)
            .html(`<i class="fas fa-cubes me-2"></i>In Stock: ${pharmacy.medications[medication].stock} units`);
    });
});