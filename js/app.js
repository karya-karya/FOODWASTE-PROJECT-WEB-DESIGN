const auth = {
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;
        if (!email || !password) return alert("Please fill all fields.");

        try {
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
        } catch (error) {
            alert("Login connection error.");
        }
    },

    async register() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const role = document.getElementById('regRole').value;

        if (!name || !email || !password || !role) {
            return alert("Please fill all registration fields.");
        }

        try {
            const response = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const result = await response.json();

            alert(result.message);
            if (result.status === 'success') {
                toggleAuth(); // Switch to login view
            }
        } catch (error) {
            alert("Registration failed.");
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
                        <input type="number" step="0.01" id="itemPrice" placeholder="Price (0 for free)">
                        <button type="button" onclick="donor.createListing()">Post Listing</button>
                    </div>
                    <hr>
                    <h3>My Active Listings</h3>
                    <div id="my-listings">Loading...</div>
                </div>`;
            donor.loadMyListings();
        } else {
            content.innerHTML = `
                <div class="receiver-panel">
                    <h3>Available Food Market</h3>
                    <p>Help reduce waste by claiming food near you!</p>
                    <div id="market-listings" class="market-grid">Loading market items...</div>
                </div>`;
            receiver.loadMarket();
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

        if(!data.name || !data.quantity || !data.location) return alert("Fill all required fields.");

        const response = await fetch('api/listings.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        alert(result.message);
        if (result.status === 'success') this.loadMyListings();
    },

    async loadMyListings() {
        const response = await fetch('api/listings.php');
        const result = await response.json();
        const container = document.getElementById('my-listings');
        if (result.listings && result.listings.length > 0) {
            let html = `<table class="listing-table"><thead><tr><th>Item</th><th>Qty</th><th>Status</th></tr></thead><tbody>`;
            result.listings.forEach(item => {
                html += `<tr><td>${item.name}</td><td>${item.quantity}</td><td><span class="badge active">${item.status}</span></td></tr>`;
            });
            container.innerHTML = html + `</tbody></table>`;
        } else {
            container.innerHTML = "<p>No listings found.</p>";
        }
    }
};

const receiver = {
    async loadMarket() {
        const response = await fetch('api/listings.php');
        const result = await response.json();
        const container = document.getElementById('market-listings');
        if (result.listings && result.listings.length > 0) {
            let html = '';
            result.listings.forEach(item => {
                html += `
                <div class="food-card">
                    <div class="card-badge">NEW</div>
                    <h4>${item.name}</h4>
                    <p>📍 ${item.location}</p>
                    <p>📦 Qty: ${item.quantity}</p>
                    <p class="card-price">${item.price > 0 ? '$' + item.price : 'FREE'}</p>
                    <button type="button" onclick="alert('Claimed ${item.name}!')" class="btn-claim">Claim Now</button>
                </div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = "<p>The market is currently empty.</p>";
        }
    }
};

function toggleAuth() {
    const l = document.getElementById('loginForm');
    const r = document.getElementById('registerForm');
    if (l.style.display === 'none') {
        l.style.display = 'block';
        r.style.display = 'none';
    } else {
        l.style.display = 'none';
        r.style.display = 'block';
    }
}