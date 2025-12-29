const auth = {
    // KULLANICI GİRİŞİ
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
                console.log("Login successful:", result.user);
                this.showDashboard(result.user);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Auth Error:", error);
            alert("Connection error! Check XAMPP and Console.");
        }
    },

    // KULLANICI KAYDI
    async register() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const role = document.getElementById('regRole').value;

        if (!name || !email || !password) return alert("Please fill all fields.");

        try {
            const response = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const result = await response.json();

            alert(result.message);
            if (result.status === 'success') toggleAuth();
        } catch (error) {
            console.error("Register Error:", error);
        }
    },

    // DASHBOARD EKRANINI GÖSTERME
    showDashboard(user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-role').innerText = user.role.toUpperCase();

        const content = document.getElementById('role-content');

        // Eğer kullanıcı Donor ise Ürün Ekleme Formunu Göster
        if (user.role === 'donor') {
            content.innerHTML = `
                <div class="donor-panel">
                    <h3>Add New Surplus Food</h3>
                    <div class="listing-form">
                        <label>Item Name</label>
                        <input type="text" id="itemName" placeholder="e.g. Fresh Bread">
                        
                        <label>Quantity</label>
                        <input type="number" id="itemQty" placeholder="Amount">
                        
                        <label>Pickup Location</label>
                        <input type="text" id="location" placeholder="Address">
                        
                        <label>Expiration Date</label>
                        <input type="date" id="expDate">
                        
                        <label>Price (0 for donation)</label>
                        <input type="number" step="0.01" id="itemPrice" placeholder="0.00">
                        
                        <button type="button" onclick="donor.createListing()">Post Listing</button>
                    </div>
                </div>
            `;
        } else {
            // Eğer kullanıcı Receiver ise İlanları Görme Paneli
            content.innerHTML = `
                <div class="receiver-panel">
                    <h3>Available Food Near You</h3>
                    <p>Fetching active listings...</p>
                </div>
            `;
        }
    },

    // ÇIKIŞ YAP
    logout() {
        location.reload();
    }
};

const donor = {
    // YENİ İLAN OLUŞTURMA
    async createListing() {
        console.log("Post Listing button clicked!"); // Konsolda kontrol için

        const data = {
            name: document.getElementById('itemName').value,
            quantity: document.getElementById('itemQty').value,
            location: document.getElementById('location').value,
            expiration_date: document.getElementById('expDate').value,
            price: document.getElementById('itemPrice').value || 0
        };

        // Alanların boş olup olmadığını kontrol et
        if(!data.name || !data.quantity || !data.location || !data.expiration_date) {
            return alert("Please fill all listing details.");
        }

        try {
            const response = await fetch('api/listings.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            alert(result.message);
            
            if (result.status === 'success') {
                location.reload(); // Başarılıysa sayfayı yenile ve listeyi güncelle
            }
        } catch (error) {
            console.error("Listing Error:", error);
            alert("Could not post listing. Check Console.");
        }
    }
};

// GİRİŞ VE KAYIT EKRANI ARASINDA GEÇİŞ
function toggleAuth() {
    const l = document.getElementById('loginForm');
    const r = document.getElementById('registerForm');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}