document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/form.html';
        return;
    }

    // Initialize DataTables without pagination
    const usersTable = $('#usersTable').DataTable({
        paging: false,      // Disable pagination
        info: false,        // Remove "Showing X of Y entries" text
        searching: false    // Remove search box
    });
    
    const bookingsTable = $('#bookingsTable').DataTable({
        paging: false,      // Disable pagination
        info: false,        // Remove "Showing X of Y entries" text
        searching: false    // Remove search box
    });

    // Load initial data
    loadDashboardStats();
    loadUsers();
    loadBookings();

    // Event Listeners
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    // Functions to load data
    async function loadDashboardStats() {
        try {
            const response = await fetch('/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('totalBookings').textContent = data.totalBookings;
            document.getElementById('totalRevenue').textContent = new Intl.NumberFormat('ru-RU', { 
                style: 'currency', 
                currency: 'KZT' 
            }).format(data.totalRevenue);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function loadUsers() {
        try {
            const response = await fetch('/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const users = await response.json();
            
            usersTable.clear();
            users.forEach(user => {
                usersTable.row.add([
                    user.email,
                    user.role,
                    `<button class="btn btn-sm btn-primary edit-user" data-id="${user._id}">Edit</button>
                     <button class="btn btn-sm btn-danger delete-user" data-id="${user._id}">Delete</button>`
                ]);
            });
            usersTable.draw();

            // Add event listeners for edit and delete buttons
            attachUserActionListeners();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async function loadBookings() {
        try {
            const response = await fetch('/admin/bookings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const bookings = await response.json();
            console.log('Bookings received:', bookings);
            
            bookingsTable.clear();
            bookings.forEach(booking => {
                // Format the date
                const formattedDate = new Date(booking.date).toLocaleDateString('ru-RU');
                
                // Create status badge for paymentStatus with new colors
                const statusBadge = `<span class="status-badge status-${booking.paymentStatus.toLowerCase()}">${booking.paymentStatus}</span>`;
                
                bookingsTable.row.add([
                    formattedDate,
                    booking.time,
                    booking.field,
                    booking.email,
                    statusBadge
                ]).draw(false);
            });
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    async function saveUser() {
        const userId = document.getElementById('userId').value;
        const userData = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value
        };

        try {
            const url = userId ? `/admin/users/${userId}` : '/admin/users';
            const method = userId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                $('#addUserModal').modal('hide');
                loadUsers();
                loadDashboardStats();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user');
        }
    }

    function attachUserActionListeners() {
        document.querySelectorAll('.edit-user').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.id;
                // Load user data and show modal
                const response = await fetch(`/admin/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const user = await response.json();
                
                document.getElementById('userId').value = user._id;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userPassword').value = '';
                document.getElementById('userRole').value = user.role;
                
                $('#addUserModal').modal('show');
            });
        });

        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this user?')) {
                    const userId = e.target.dataset.id;
                    await fetch(`/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    loadUsers();
                    loadDashboardStats();
                }
            });
        });
    }

    function attachBookingActionListeners() {
        document.querySelectorAll('.cancel-booking').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to cancel this booking?')) {
                    const bookingId = e.target.dataset.id;
                    await fetch(`/admin/bookings/${bookingId}/cancel`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    loadBookings();
                }
            });
        });
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/form.html';
    }
}); 