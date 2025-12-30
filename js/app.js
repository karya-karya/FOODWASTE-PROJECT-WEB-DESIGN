const auth = {
  async login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    if (!email || !password) return alert("Please fill all fields.");

    const response = await fetch('api/auth.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.status === 'success') this.showDashboard(result.user);
    else alert(result.message);
  },

  async register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;

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

    const content = document.getElementById('role-content');

    if (user.role === 'donor') {
      content.innerHTML = `
        <div class="donor-panel">
          <div class="card-form">
            <h3>Add New Surplus Food</h3>
            <div class="listing-form">
              <input type="text" id="itemName" placeholder="Item Name">
              <input type="number" id="itemQty" placeholder="Quantity">
              <input type="text" id="location" placeholder="Pickup Location">
              <input type="date" id="expDate">
              <input type="number" step="0.01" id="itemPrice" placeholder="Price (0 for free)">
              <input type="file" id="itemImage" accept="image/*">
              <button type="button" onclick="donor.createListing()">Post Listing</button>
            </div>
          </div>

          <h3 class="mt-4">My Listings</h3>
          <div id="active-listings"></div>

          <hr>
          <h3>Pending Requests</h3>
          <p style="margin-top:-6px; color:#666;">
            Approve a request to generate a QR for the receiver. Then confirm delivery by scanning on the QR Scanner page.
          </p>

          <a href="scan.html" style="display:inline-block; margin-bottom:10px;">
            <button type="button">Open QR Scanner</button>
          </a>

          <div id="pending-requests"></div>
        </div>
      `;
      donor.loadMyListings();
      donor.loadPending();
    } else {
      content.innerHTML = `
        <div class="receiver-panel">
          <h3>Available Food Market</h3>
          <p>Help reduce food waste by reserving items!</p>
          <div id="market-listings" class="market-grid"></div>

          <hr>
          <h3>My Cart</h3>
          <ul id="my-cart"></ul>
        </div>
      `;
      receiver.loadMarket();
      receiver.loadCartUI();
    }
  },

  logout() { location.reload(); }
};

const donor = {
  async createListing() {
    const fd = new FormData();
    fd.append('name', document.getElementById('itemName').value);
    fd.append('quantity', document.getElementById('itemQty').value);
    fd.append('location', document.getElementById('location').value);
    fd.append('expiration_date', document.getElementById('expDate').value);
    fd.append('price', document.getElementById('itemPrice').value || 0);

    const img = document.getElementById('itemImage').files[0];
    if (img) fd.append('image', img);

    const response = await fetch('api/listings.php?action=create', {
      method: 'POST',
      body: fd
    });

    const result = await response.json();
    alert(result.message);
    if (result.status === 'success') {
      this.loadMyListings();
    }
  },

  async loadMyListings() {
    const response = await fetch('api/listings.php');
    const result = await response.json();
    const activeDiv = document.getElementById('active-listings');

    if (!result.listings || result.listings.length === 0) {
      activeDiv.innerHTML = "<p>No items yet.</p>";
      return;
    }

    let html = `<table class="listing-table"><thead>
      <tr><th>Item</th><th>Qty</th><th>Status</th></tr>
    </thead><tbody>`;

    result.listings.forEach(item => {
      html += `<tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td><span class="badge ${item.status}">${item.status}</span></td>
      </tr>`;
    });

    activeDiv.innerHTML = html + `</tbody></table>`;
  },

  async loadPending() {
    const r = await fetch('api/reservations.php?action=donor_pending');
    const res = await r.json();

    const div = document.getElementById('pending-requests');
    if (!res.items || res.items.length === 0) {
      div.innerHTML = "<p>No pending requests.</p>";
      return;
    }

    div.innerHTML = res.items.map(x => `
      <div style="margin:8px 0;">
        <b>${x.name}</b> × ${x.reserved_amount}
        <button type="button" onclick="donor.approve(${x.reservation_id})">Approve</button>
      </div>
    `).join('');
  },

  async approve(reservationId) {
    const r = await fetch('api/reservations.php?action=approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId })
    });
    const res = await r.json();
    alert(res.message);
    this.loadPending();
  }
};

const receiver = {
  async loadMarket() {
    const response = await fetch('api/listings.php');
    const result = await response.json();
    const container = document.getElementById('market-listings');

    if (!result.listings || result.listings.length === 0) {
      container.innerHTML = "<p>No items available right now.</p>";
      return;
    }

    let html = '';
    result.listings.forEach(item => {
      html += `
      <div class="food-card">
        <div class="card-badge">ACTIVE</div>

        <img src="uploads/${item.image_path || 'default_food.jpeg'}"
          style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:10px;">

        <h4>${item.name}</h4>
        <p>📍 ${item.location || '-'}</p>
        <p><b>Available:</b> ${item.quantity}</p>
        <p class="card-price">${item.price > 0 ? '$' + item.price : 'FREE'}</p>

        <input type="number" min="1" max="${item.quantity}" value="1" id="qty_${item.id}">
        <button type="button" class="btn-claim" onclick="receiver.addToCart(${item.id})">
          Add to Cart
        </button>
      </div>`;
    });

    container.innerHTML = html;
  },

  async addToCart(listingId) {
    const qty = parseInt(document.getElementById('qty_' + listingId).value, 10);

    const response = await fetch('api/reservations.php?action=add_to_cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, quantity: qty })
    });

    const result = await response.json();
    alert(result.message);

    if (result.status === 'success') {
      this.loadMarket();
      this.loadCartUI();
    }
  },

  async loadCartUI() {
    const r = await fetch('api/reservations.php?action=cart');
    const res = await r.json();

    const ul = document.getElementById('my-cart');
    if (!res.items || res.items.length === 0) {
      ul.innerHTML = "<li>Your cart is empty.</li>";
      return;
    }

    ul.innerHTML = res.items.map(it => {
      const badge =
        it.status === 'delivered' ? `<span style="color:green;font-weight:700;">Delivered ✅</span>` :
        it.status === 'approved'  ? `<span style="color:#2c3e50;font-weight:700;">Approved</span>` :
                                   `<span style="color:#e67e22;font-weight:700;">Pending</span>`;

      return `
      <li style="margin:10px 0; padding:10px; border:1px solid #eee; border-radius:8px;">
        <div style="display:flex; gap:10px; align-items:flex-start; flex-wrap:wrap;">
          <img src="uploads/${it.image_path || 'default_food.jpeg'}"
            style="width:90px;height:70px;object-fit:cover;border-radius:6px;">
          <div style="flex:1; min-width:200px;">
            <b>${it.name}</b><br>
            Qty: ${it.reserved_amount} ${badge}

            ${it.status === 'pending'
              ? `<div style="margin-top:6px;">
                   <button onclick="receiver.removeFromCart(${it.reservation_id})">Remove</button>
                 </div>`
              : ``}
          </div>
        </div>

        ${it.status === 'approved' && it.qr_code
          ? `<div style="margin-top:10px;">
               <div><b>Your Pickup QR</b></div>
               <div id="qr_${it.reservation_id}" style="margin-top:8px;"></div>
               <div style="margin-top:8px; font-size:12px; color:#555;">${it.qr_code}</div>
             </div>`
          : ``}
      </li>`;
    }).join('');

    this.renderQrImages(res.items);
  },

  renderQrImages(items) {
    if (typeof QRCode === "undefined") return;

    items.forEach(it => {
      if (it.status === 'approved' && it.qr_code) {
        const el = document.getElementById(`qr_${it.reservation_id}`);
        if (!el) return;
        el.innerHTML = "";
        new QRCode(el, {
          text: it.qr_code,
          width: 160,
          height: 160
        });
      }
    });
  },

  async removeFromCart(reservationId) {
    const r = await fetch('api/reservations.php?action=remove_from_cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId })
    });
    const res = await r.json();
    alert(res.message);
    this.loadMarket();
    this.loadCartUI();
  }
};

function toggleAuth() {
  const l = document.getElementById('loginForm');
  const r = document.getElementById('registerForm');
  l.style.display = l.style.display === 'none' ? 'block' : 'none';
  r.style.display = r.style.display === 'none' ? 'block' : 'none';
}
