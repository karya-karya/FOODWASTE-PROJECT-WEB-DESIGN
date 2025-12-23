/* =========================
   Business side
   ========================= */
function togglePriceInputs() {
  const type = document.getElementById("newProductType").value;
  const priceDiv = document.getElementById("priceInputs");
  const oldPriceInput = document.getElementById("oldPrice");
  const newPriceInput = document.getElementById("newPrice");

  if (type === "Donation") {
    priceDiv.classList.add("hidden");
    oldPriceInput.value = "";
    newPriceInput.value = 0;
    newPriceInput.disabled = true;
  } else {
    priceDiv.classList.remove("hidden");
    newPriceInput.value = "";
    newPriceInput.disabled = false;
  }
}

// --- Add Product ---
function addProduct() {
  if (activeRole !== "business") return;

  const b = businesses[activeUser];
  const businessName = b.businessName;

  const descriptionInput = document.getElementById("newProductName");
  const stockInput = document.getElementById("newProductStock");
  const typeInput = document.getElementById("newProductType");
  const fileInput = document.getElementById("newProductImage");
  const errorDiv = document.getElementById("businessError");

  const description = descriptionInput.value.trim();
  const stockRaw = stockInput.value.trim();
  const type = typeInput.value;
  const file = fileInput.files[0];

  errorDiv.innerText = "";

  if (!description || description.length < 2) {
    errorDiv.innerText = "Product name must be at least 2 characters.";
    return;
  }

  const stock = parseInt(stockRaw);
  if (isNaN(stock) || stock < 1 || !file) {
    errorDiv.innerText = "Please fill stock (min 1) and select an IMAGE.";
    return;
  }

  let oldPrice = 0;
  let price = 0;

  if (type === "Discounted") {
    const oldPriceRaw = document.getElementById("oldPrice").value.trim();
    const newPriceRaw = document.getElementById("newPrice").value.trim();

    if (!oldPriceRaw || !newPriceRaw || isNaN(parseFloat(oldPriceRaw)) || isNaN(parseFloat(newPriceRaw))) {
      errorDiv.innerText = "For discounted sale, please enter both old and new price.";
      return;
    }
    oldPrice = parseFloat(oldPriceRaw);
    price = parseFloat(newPriceRaw);
    if (price >= oldPrice) {
      errorDiv.innerText = "Discounted price must be lower than old price.";
      return;
    }
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;

    products.push({
      id: nextProductId++,
      businessName,
      city: b.city,
      district: b.district,
      description,
      imageUrl: base64Image,
      oldPrice,
      price,
      type,
      stock,
      businessUsername: activeUser,
    });

    descriptionInput.value = "";
    stockInput.value = "";
    fileInput.value = "";
    document.getElementById("oldPrice").value = "";
    document.getElementById("newPrice").value = "";
    togglePriceInputs();

    renderBusinessProducts();
    renderActiveReservations();

    // Success message (auto-clear)
    errorDiv.innerText = "Product added successfully!";
    setTimeout(() => {
      if (errorDiv.innerText === "Product added successfully!") {
        errorDiv.innerText = "";
      }
    }, 3000);
  };

  reader.readAsDataURL(file);
}

function renderBusinessProducts() {
  const listDiv = document.getElementById("businessProductList");
  listDiv.innerHTML = "";

  const businessProducts = products.filter((p) => p.businessUsername === activeUser);

  if (businessProducts.length === 0) {
    listDiv.innerHTML = `<p>You have not added any products yet.</p>`;
    return;
  }

  businessProducts.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product");

    const priceHtml =
      p.type === "Donation"
        ? `<span class="fiyat-grup">DONATION (Free)</span>`
        : `<span class="eski-fiyat">${p.oldPrice} TL</span> <span class="fiyat-grup">${p.price} TL</span>`;

    card.innerHTML = `
      <h4>${p.description}</h4>
      <img src="${p.imageUrl}" alt="${p.description}" style="width:100%; border-radius:8px; margin:10px 0;">
      <p>Location: ${p.city}/${p.district}</p>
      <p>Stock: <span class="stock-info">${p.stock}</span> | Price: ${priceHtml}</p>

      <div class="product-action-group">
        <button style="background:#0ea5e9;" onclick="openEditProductModal(${p.id})">Edit</button>
        <button style="background:#f44336;" onclick="removeProduct(${p.id})">Remove</button>
      </div>
    `;
    listDiv.appendChild(card);
  });
}

let editingProductId = null;

function createEditProductModalIfNeeded() {
  if (document.getElementById("editProductModal")) return;

  const modal = document.createElement("div");
  modal.id = "editProductModal";
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content edit-modal">
      <span class="close-btn" onclick="closeEditProductModal()">&times;</span>
      <h3 style="margin-top:0;">Edit Product</h3>

      <div id="editProductError" class="error"></div>

      <input type="text" id="editProductName" placeholder="Product name">
      <input type="number" id="editProductStock" placeholder="Stock" min="1">

      <select id="editProductType" onchange="toggleEditPriceInputs()">
        <option value="Donation">Donation</option>
        <option value="Discounted">Discounted</option>
      </select>

      <div id="editPriceInputs">
        <input type="number" id="editOldPrice" placeholder="Old price (TL)" min="0" step="0.01">
        <input type="number" id="editNewPrice" placeholder="New price (TL)" min="0" step="0.01">
      </div>

      <div class="edit-image-row">
        <div class="muted-note">Optional: change image</div>
        <input type="file" id="editProductImage" accept="image/*">
        <img id="editImagePreview" class="edit-image-preview" alt="preview">
      </div>

      <div class="modal-actions">
        <button style="background:#0ea5e9;" onclick="saveEditedProduct()">Save</button>
        <button style="background:#64748b;" onclick="closeEditProductModal()">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // dışarı tıklayınca kapansın
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeEditProductModal();
  });

  // image preview
  const fileInput = modal.querySelector("#editProductImage");
  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    const img = document.getElementById("editImagePreview");
    if (!f) {
      img.src = "";
      img.style.display = "none";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
      img.style.display = "block";
    };
    reader.readAsDataURL(f);
  });
}

function openEditProductModal(productId) {
  if (activeRole !== "business") return;

  createEditProductModalIfNeeded();

  const p = products.find(x => x.id === productId && x.businessUsername === activeUser);
  if (!p) return alert("Product not found for this business.");

  editingProductId = productId;

  document.getElementById("editProductError").innerText = "";

  document.getElementById("editProductName").value = p.description || "";
  document.getElementById("editProductStock").value = p.stock ?? 1;
  document.getElementById("editProductType").value = p.type || "Donation";

  document.getElementById("editOldPrice").value = p.oldPrice ?? 0;
  document.getElementById("editNewPrice").value = p.type === "Donation" ? 0 : (p.price ?? 0);

  // preview current image
  const img = document.getElementById("editImagePreview");
  if (p.imageUrl) {
    img.src = p.imageUrl;
    img.style.display = "block";
  } else {
    img.src = "";
    img.style.display = "none";
  }

  // reset file input
  const fileInput = document.getElementById("editProductImage");
  if (fileInput) fileInput.value = "";

  toggleEditPriceInputs();

  document.getElementById("editProductModal").style.display = "block";
}

function closeEditProductModal() {
  const modal = document.getElementById("editProductModal");
  if (modal) modal.style.display = "none";
  editingProductId = null;
}

function toggleEditPriceInputs() {
  const type = document.getElementById("editProductType")?.value;
  const priceDiv = document.getElementById("editPriceInputs");
  const oldPriceInput = document.getElementById("editOldPrice");
  const newPriceInput = document.getElementById("editNewPrice");

  if (!priceDiv || !oldPriceInput || !newPriceInput) return;

  if (type === "Donation") {
    priceDiv.classList.add("hidden");
    oldPriceInput.value = "";
    newPriceInput.value = 0;
    newPriceInput.disabled = true;
  } else {
    priceDiv.classList.remove("hidden");
    newPriceInput.disabled = false;
  }
}

function saveEditedProduct() {
  if (activeRole !== "business") return;
  if (!editingProductId) return;

  const err = document.getElementById("editProductError");
  err.innerText = "";

  const p = products.find(x => x.id === editingProductId && x.businessUsername === activeUser);
  if (!p) {
    err.innerText = "Product not found.";
    return;
  }

  const name = document.getElementById("editProductName").value.trim();
  const stockRaw = document.getElementById("editProductStock").value.trim();
  const type = document.getElementById("editProductType").value;

  if (!name || name.length < 2) {
    err.innerText = "Product name must be at least 2 characters.";
    return;
  }

  const stock = parseInt(stockRaw);
  if (isNaN(stock) || stock < 1) {
    err.innerText = "Stock must be at least 1.";
    return;
  }

  let oldPrice = 0;
  let price = 0;

  if (type === "Discounted") {
    const oldPriceRaw = document.getElementById("editOldPrice").value.trim();
    const newPriceRaw = document.getElementById("editNewPrice").value.trim();

    if (!oldPriceRaw || !newPriceRaw || isNaN(parseFloat(oldPriceRaw)) || isNaN(parseFloat(newPriceRaw))) {
      err.innerText = "For discounted sale, please enter both old and new price.";
      return;
    }

    oldPrice = parseFloat(oldPriceRaw);
    price = parseFloat(newPriceRaw);

    if (price >= oldPrice) {
      err.innerText = "Discounted price must be lower than old price.";
      return;
    }
  }

  // update fields (image optional)
  p.description = name;
  p.stock = stock;
  p.type = type;
  p.oldPrice = type === "Donation" ? 0 : oldPrice;
  p.price = type === "Donation" ? 0 : price;

  const file = document.getElementById("editProductImage")?.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      p.imageUrl = e.target.result;
      finalizeProductEditUI();
    };
    reader.readAsDataURL(file);
    return;
  }

  finalizeProductEditUI();
}

function finalizeProductEditUI() {
  closeEditProductModal();
  renderBusinessProducts();
  renderActiveReservations();
  renderBusinessHistory();

  // kullanıcı tarafı açık olursa, ürün listesi de güncellensin
  if (typeof renderProducts === "function") renderProducts();
  if (typeof renderCart === "function") renderCart();
  if (typeof renderUserHistory === "function") renderUserHistory();
}

// modal DOM'a garanti eklensin
document.addEventListener("DOMContentLoaded", () => {
  createEditProductModalIfNeeded();
});


function removeProduct(id) {
  // remove product
  products = products.filter((p) => p.id !== id);

  // also remove the item from ACTIVE orders (or mark them as needing attention)
  orders = orders.map(o => {
    if (o.status !== "ACTIVE") return o;
    const newItems = o.items.filter(it => it.productId !== id);
    return { ...o, items: newItems };
  }).filter(o => !(o.status === "ACTIVE" && o.items.length === 0)); // drop empty active orders

  renderBusinessProducts();
  renderActiveReservations();
  renderBusinessHistory();
  if (activeRole === "user") {
    renderProducts();
    renderUserHistory();
  }
}

/* =========================
   Orders: Active reservations + histories
   ========================= */
function renderActiveReservations() {
  const container = document.getElementById("activeReservations");
  container.innerHTML = "";

  const myActiveOrders = orders.filter(o => o.businessUsername === activeUser && o.status === "ACTIVE");

  if (myActiveOrders.length === 0) {
    container.innerHTML = `<p>There are no active reservations for your products.</p>`;
    return;
  }

  let html = "";
  myActiveOrders.forEach((o) => {
    const userName = users[o.userUsername]?.name || o.userUsername;

    html += `<div class="reservation-list">
      <strong>Order #${o.orderId} — User: ${userName} (${o.userUsername})</strong>
      <div style="font-size:12px; margin-top:6px; color:#334155; font-weight:800;">Created: ${formatDate(o.createdAt)}</div>
      <ul style="margin-top:8px;">`;

    o.items.forEach((it) => {
      html += `<li>- ${it.description} (x${it.quantity})</li>`;
    });

    html += `</ul>
      <button style="background:#00838f;" onclick="confirmDeliveredManual(${o.orderId})">Delivered</button>
      <button style="background:#f59e0b;" onclick="rejectOrderByBusiness(${o.orderId})">Reject</button>
      <button style="background:#ef4444;" onclick="cancelOrderByBusiness(${o.orderId})">Cancel</button>
    </div>`;
  });

  container.innerHTML = html;
}

function renderBusinessHistory() {
  const container = document.getElementById("businessOrderHistory");
  if (!container) return;
  container.innerHTML = "";

  const myHistory = orders
    .filter(o => o.businessUsername === activeUser && o.status === "DELIVERED")
    .sort((a,b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));

  if (myHistory.length === 0) {
    container.innerHTML = `<p>No delivered orders yet.</p>`;
    return;
  }

  let html = "";
  myHistory.forEach(o => {
    const userName = users[o.userUsername]?.name || o.userUsername;
    html += `<div class="reservation-list" style="border-color: rgba(34,197,94,.25); background: rgba(34,197,94,.08);">
      <strong>Order #${o.orderId} — ${userName} (${o.userUsername})</strong>
      <div style="font-size:12px; margin-top:6px; color:#334155; font-weight:800;">
        Delivered: ${formatDate(o.deliveredAt)}
      </div>
      <ul style="margin-top:8px;">`;
    o.items.forEach(it => {
      html += `<li>- ${it.description} (x${it.quantity})</li>`;
    });
    html += `</ul></div>`;
  });

  container.innerHTML = html;
}

function renderUserHistory() {
  const container = document.getElementById("userOrderHistory");
  if (!container) return;
  container.innerHTML = "";

  const myOrders = orders
    .filter(o => o.userUsername === activeUser)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (myOrders.length === 0) {
    container.innerHTML = `<p>No past orders yet.</p>`;
    return;
  }

  let html = "";
  myOrders.forEach(o => {
    let statusText = "UNKNOWN";
    let statusColor = "#334155";

    switch (o.status) {
      case "ACTIVE":
        statusText = "ACTIVE (Waiting pickup)";
        statusColor = "#b45309";
        break;
      case "DELIVERED":
        statusText = "DELIVERED";
        statusColor = "#166534";
        break;
      case "CANCELLED_USER":
        statusText = "CANCELLED (User)";
        statusColor = "#9f1239";
        break;
      case "CANCELLED_BUSINESS":
        statusText = "CANCELLED (Business)";
        statusColor = "#9f1239";
        break;
      case "REJECTED":
        statusText = "REJECTED (Business)";
        statusColor = "#9f1239";
        break;
      default:
        break;
    }

    const cancelBtn = o.status === "ACTIVE"
      ? `<button style="margin-top:10px;background:#ef4444;" onclick="cancelOrderByUser(${o.orderId})">Cancel Order</button>`
      : "";

    html += `<div class="reservation-list" style="border-color: rgba(15,23,42,.12); background: rgba(2,6,23,.03);">
      <strong>Order #${o.orderId} — ${o.businessName}</strong>
      <div style="font-size:12px; margin-top:6px; color:#334155; font-weight:800;">
        Created: ${formatDate(o.createdAt)}<br>
        Status: <span style="color:${statusColor}; font-weight:900;">${statusText}</span>${cancelBtn}
      </div>
      <ul style="margin-top:8px;">`;
    o.items.forEach(it => {
      html += `<li>- ${it.description} (x${it.quantity})</li>`;
    });
    html += `</ul></div>`;
  });

  container.innerHTML = html;
}

function confirmDeliveredManual(orderId) {
  const o = orders.find(x => x.orderId === orderId && x.businessUsername === activeUser);
  if (!o) return alert("Order not found for this business.");

  const ok = confirm(`Confirm delivery for Order #${orderId}?`);
  if (!ok) return;

  o.status = "DELIVERED";
  o.deliveredAt = new Date().toISOString();

  alert(`Order #${orderId} marked as DELIVERED.`);
  renderActiveReservations();
  renderBusinessHistory();
  if (activeRole === "user") renderUserHistory();
}

/* =========================
   Business: Reject / Cancel orders (restore stock)
   ========================= */
function rejectOrderByBusiness(orderId) {
  if (activeRole !== "business") return;

  const o = orders.find((x) => x.orderId === orderId && x.businessUsername === activeUser);
  if (!o) return alert("Order not found for this business.");
  if (o.status !== "ACTIVE") return alert("Only ACTIVE orders can be rejected.");

  const ok = confirm(`Reject Order #${orderId}? Stock will be restored.`);
  if (!ok) return;

  o.status = "REJECTED";
  o.rejectedAt = new Date().toISOString();

  restoreStockForOrder(o);

  alert(`Order #${orderId} rejected. Stock restored.`);
  renderActiveReservations();
  renderBusinessHistory();
  renderProducts?.();
  renderUserHistory?.();
}

function cancelOrderByBusiness(orderId) {
  if (activeRole !== "business") return;

  const o = orders.find((x) => x.orderId === orderId && x.businessUsername === activeUser);
  if (!o) return alert("Order not found for this business.");
  if (o.status !== "ACTIVE") return alert("Only ACTIVE orders can be cancelled.");

  const ok = confirm(`Cancel Order #${orderId}? Stock will be restored.`);
  if (!ok) return;

  o.status = "CANCELLED_BUSINESS";
  o.cancelledAt = new Date().toISOString();

  restoreStockForOrder(o);

  alert(`Order #${orderId} cancelled. Stock restored.`);
  renderActiveReservations();
  renderBusinessHistory();
  renderProducts?.();
  renderUserHistory?.();
}
