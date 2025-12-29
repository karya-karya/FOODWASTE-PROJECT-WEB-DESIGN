const auth = {
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;
        const response = await fetch('api/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.status === 'success') {
            this.showDashboard(result.user);
        } else {
            alert(result.message);
        }
    },

    showDashboard(user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-role').innerText = user.role.toUpperCase();

        const content = document.getElementById('role-content');
        if (user.role === 'donor') {
            content.innerHTML = `
                <div class="donor-panel">
                    <h3>Add New Surplus Food</h3>
                    <div class="listing-form">
                        <input type="text" id="itemName" placeholder="Item Name">
                        <input type="number" id="itemQty" placeholder="Quantity">
                        <input type="text" id="location" placeholder="Pickup Location">
                        <input type="date" id="expDate">
                        <input type="number" step="0.01" id="itemPrice" placeholder="Price (0 for donation)">
                        <button type="button" onclick="donor.createListing()">Post Listing</button>
                    </div>
                    <hr>
                    <h3>My Active Listings</h3>
                    <div id="my-listings">Loading...</div>
                </div>
            `;
            donor.loadMyListings();
        } else {
            content.innerHTML = `<h3>Receiver Panel</h3><p>Welcome! Browse available food.</p>`;
        }
    },

    logout() { location.reload(); }
};

const donor = {
    async createListing() {
        const data = {
            name: document.getElementById('itemName').value,
            quantity: document.getElementById('itemQty').value,
            location: document.getElementById('location').value,
            expiration_date: document.getElementById('expDate').value,
            price: document.getElementById('itemPrice').value || 0
        };

        const response = await fetch('api/listings.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        alert(result.message);
        if (result.status === 'success') this.loadMyListings(); // Sayfayı yenilemeden tabloyu güncelle
    },

    async loadMyListings() {
        const response = await fetch('api/listings.php');
        const result = await response.json();
        const container = document.getElementById('my-listings');
        
        if (result.listings && result.listings.length > 0) {
            let html = `<table class="listing-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Location</th><th>Exp. Date</th><th>Status</th></tr></thead>
                <tbody>`;
            result.listings.forEach(item => {
                html += `<tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.location}</td>
                    <td>${item.expiration_date}</td>
                    <td><span class="badge ${item.status}">${item.status}</span></td>
                </tr>`;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = "<p>No listings found.</p>";
        }
    }
};

function toggleAuth() {
    const l = document.getElementById('loginForm');
    const r = document.getElementById('registerForm');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}