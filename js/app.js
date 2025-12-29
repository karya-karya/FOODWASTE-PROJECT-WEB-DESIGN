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
                console.log("Login success, showing dashboard for:", result.user.name);
                this.showDashboard(result.user);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Auth Error:", error);
            alert("Connection error! Check XAMPP and Console.");
        }
    },

    async register() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const role = document.getElementById('regRole').value;

        if (!name || !email || !password) return alert("Please fill all fields.");

        const response = await fetch('api/auth.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const result = await response.json();

        alert(result.message);
        if (result.status === 'success') toggleAuth();
    },

    showDashboard(user) {
        // Form alanlarını gizle
        const authSection = document.getElementById('auth-section');
        const dashSection = document.getElementById('dashboard-section');
        
        if (authSection) authSection.style.display = 'none';
        if (dashSection) dashSection.style.display = 'block';

        // Kullanıcı bilgilerini yazdır
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-role').innerText = user.role.toUpperCase();

        const content = document.getElementById('role-content');

        if (user.role === 'donor') {
            content.innerHTML = `
                <div class="donor-panel">
                    <h3>Add New Surplus Food</h3>
                    <div class="listing-form">
                        <input type="text" id="itemName" placeholder="Item Name (e.g. Fresh Bread)">
                        <input type="number" id="itemQty" placeholder="Quantity">
                        <input type="text" id="location" placeholder="Pickup Location">
                        <label>Expiration Date:</label>
                        <input type="date" id="expDate">
                        <input type="number" step="0.01" id="itemPrice" placeholder="Price (0 for donation)">
                        <button onclick="donor.createListing()">Post Listing</button>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `<h3>Receiver Panel</h3><p>Welcome! Browse available food near you.</p>`;
        }
    },

    logout() {
        location.reload();
    }
};

const donor = {
    async createListing() {
        const data = {
            name: document.getElementById('itemName').value,
            quantity: document.getElementById('itemQty').value,
            location: document.getElementById('location').value,
            expiration_date: document.getElementById('expDate').value,
            price: document.getElementById('itemPrice').value || 0,
            type: 'food'
        };

        const response = await fetch('api/listings.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        alert(result.message);
        if (result.status === 'success') location.reload();
    }
};

function toggleAuth() {
    const l = document.getElementById('loginForm');
    const r = document.getElementById('registerForm');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}