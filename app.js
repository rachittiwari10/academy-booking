// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // App state
    const state = {
        selectedDate: null,
        selectedTimeSlot: null,
        bookings: loadBookings(),
        isAdmin: false
    };

    // DOM Elements
    const dateSelector = document.getElementById('booking-date');
    const timeSlots = document.querySelectorAll('.time-slot');
    const bookingForm = document.getElementById('booking-form');
    const adminSection = document.getElementById('admin-section');
    const adminLogin = document.getElementById('admin-login');
    const bookingTimeDisplay = document.getElementById('booking-time-display');
    const bookingDateDisplay = document.getElementById('booking-date-display');
    const courtBookingForm = document.getElementById('court-booking-form');
    const viewBookingsBtn = document.getElementById('view-bookings-btn');
    const bookingsList = document.getElementById('bookings-list');

    // Set minimum date to today
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    dateSelector.min = formattedDate;
    dateSelector.value = formattedDate;
    
    // Initial state update
    updateState('selectedDate', formattedDate);
    updateAvailability();

    // Event Listeners
    dateSelector.addEventListener('change', function(e) {
        updateState('selectedDate', e.target.value);
        updateAvailability();
    });

    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            if (this.classList.contains('booked') || 
                this.querySelector('.availability').textContent === '(0/5 available)') {
                return; // Slot is fully booked
            }

            // Deselect all time slots
            timeSlots.forEach(s => s.classList.remove('selected'));
            
            // Select this time slot
            this.classList.add('selected');
            
            // Update state
            updateState('selectedTimeSlot', this.dataset.time);
            
            // Show booking form
            bookingForm.classList.remove('hidden');
            
            // Update booking summary
            bookingTimeDisplay.textContent = this.dataset.time;
            bookingDateDisplay.textContent = formatDateForDisplay(state.selectedDate);
            
            // Scroll to booking form
            bookingForm.scrollIntoView({ behavior: 'smooth' });
        });
    });

    courtBookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            memberId: document.getElementById('member-id').value,
            date: state.selectedDate,
            timeSlot: state.selectedTimeSlot,
            bookingId: generateBookingId(),
            timestamp: new Date().toISOString()
        };
        
        // Save booking
        saveBooking(formData);
        
        // Reset form and state
        courtBookingForm.reset();
        timeSlots.forEach(s => s.classList.remove('selected'));
        updateState('selectedTimeSlot', null);
        
        // Update availability
        updateAvailability();
        
        // Hide booking form and show confirmation
        bookingForm.classList.add('hidden');
        
        // Show confirmation message
        alert(`Booking confirmed!\nDate: ${formatDateForDisplay(formData.date)}\nTime: ${formData.timeSlot}\nBooking ID: ${formData.bookingId}`);
    });

    adminLogin.addEventListener('click', function(e) {
        e.preventDefault();
        const password = prompt('Enter admin password:');
        
        // Very simple authentication - in a real app, use proper authentication
        if (password === 'admin123') {
            state.isAdmin = true;
            adminSection.classList.remove('hidden');
            adminLogin.textContent = 'Logout';
            displayAllBookings();
        } else if (state.isAdmin) {
            // Logout
            state.isAdmin = false;
            adminSection.classList.add('hidden');
            adminLogin.textContent = 'Admin Login';
        } else {
            alert('Incorrect password!');
        }
    });

    viewBookingsBtn.addEventListener('click', function() {
        displayAllBookings();
    });

    // Helper Functions
    function updateState(key, value) {
        state[key] = value;
    }

    function formatDateForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function generateBookingId() {
        // Simple booking ID generator
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    function saveBooking(booking) {
        const bookings = loadBookings();
        bookings.push(booking);
        localStorage.setItem('academyBookings', JSON.stringify(bookings));
        state.bookings = bookings;
    }

    function loadBookings() {
        const savedBookings = localStorage.getItem('academyBookings');
        return savedBookings ? JSON.parse(savedBookings) : [];
    }

    function updateAvailability() {
        const date = state.selectedDate;
        const bookings = state.bookings.filter(b => b.date === date);
        
        timeSlots.forEach(slot => {
            const timeSlot = slot.dataset.time;
            const slotBookings = bookings.filter(b => b.timeSlot === timeSlot);
            const available = 5 - slotBookings.length;
            
            slot.querySelector('.availability').textContent = `(${available}/5 available)`;
            
            if (available <= 0) {
                slot.classList.add('booked');
            } else {
                slot.classList.remove('booked');
            }
        });
    }

    function displayAllBookings() {
        if (!state.isAdmin) return;
        
        const bookings = state.bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let html = '<h3>All Bookings</h3>';
        
        if (bookings.length === 0) {
            html += '<p>No bookings found.</p>';
        } else {
            html += '<table style="width:100%; border-collapse: collapse;">';
            html += '<tr><th style="border:1px solid #ddd; padding:8px;">Date</th><th style="border:1px solid #ddd; padding:8px;">Time</th><th style="border:1px solid #ddd; padding:8px;">Name</th><th style="border:1px solid #ddd; padding:8px;">Member ID</th><th style="border:1px solid #ddd; padding:8px;">Actions</th></tr>';
            
            bookings.forEach(booking => {
                html += `<tr>
                    <td style="border:1px solid #ddd; padding:8px;">${formatDateForDisplay(booking.date)}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${booking.timeSlot}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${booking.name}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${booking.memberId}</td>
                    <td style="border:1px solid #ddd; padding:8px;">
                        <button onclick="verifyBooking('${booking.bookingId}')">Verify</button>
                        <button onclick="cancelBooking('${booking.bookingId}')">Cancel</button>
                    </td>
                </tr>`;
            });
            
            html += '</table>';
        }
        
        bookingsList.innerHTML = html;
    }
});

// Global functions for admin actions
function verifyBooking(bookingId) {
    alert(`Booking ${bookingId} verified!`);
    // In a real app, you would update the booking status in the database
}

function cancelBooking(bookingId) {
    if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        const bookings = JSON.parse(localStorage.getItem('academyBookings') || '[]');
        const updatedBookings = bookings.filter(b => b.bookingId !== bookingId);
        localStorage.setItem('academyBookings', JSON.stringify(updatedBookings));
        alert(`Booking ${bookingId} cancelled!`);
        // Refresh the page to update the booking list
        location.reload();
    }
}
