const auth = {
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        if(!email || !password) return alert("Please fill all fields.");

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

    async register() {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const role = document.getElementById('regRole').value;

        if(!name || !email || !password) return alert("Please fill all fields.");

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
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('user-display-role').innerText = user.role.toUpperCase();
        
        // Dynamic content placeholder
        const content = document.getElementById('role-content');
        if(user.role === 'donor') {
            content.innerHTML = "<h3>Donor Panel</h3><p>Here you can list your surplus food.</p>";
        } else if(user.role === 'receiver') {
            content.innerHTML = "<h3>Receiver Panel</h3><p>Browse available food listings near you.</p>";
        } else if(user.role === 'admin') {
            content.innerHTML = "<h3>Admin Panel</h3><p>System oversight and user management.</p>";
        }
    },

    logout() {
        location.reload(); // Simple way to clear session for now
    }
};

function toggleAuth() {
    const l = document.getElementById('loginForm');
    const r = document.getElementById('registerForm');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}