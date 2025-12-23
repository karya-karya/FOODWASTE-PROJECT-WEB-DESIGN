/* =========================
   Dynamic Filtering
   ========================= */
function fillFilterCities() {
  const citySelect = document.getElementById("filterCity");
  if (!citySelect) return;

  citySelect.innerHTML = '<option value="">Select City</option>';

  const existingCities = new Set();
  for (const key in businesses) {
    if (businesses[key].city) existingCities.add(businesses[key].city.toUpperCase());
  }

  Array.from(existingCities).sort().forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.innerText = city;
    citySelect.appendChild(opt);
  });

  const dist = document.getElementById("filterDistrict");
  if (dist) dist.innerHTML = '<option value="">Select District</option>';
}

function loadDistricts() {
  const selectedCity = document.getElementById("filterCity").value;
  const districtSelect = document.getElementById("filterDistrict");
  districtSelect.innerHTML = '<option value="">Select District</option>';
  if (!selectedCity) return;

  const existingDistricts = new Set();
  for (const key in businesses) {
    if (businesses[key].city?.toUpperCase() === selectedCity) {
      existingDistricts.add(businesses[key].district.toUpperCase());
    }
  }

  Array.from(existingDistricts).sort().forEach((district) => {
    const opt = document.createElement("option");
    opt.value = district;
    opt.innerText = district;
    districtSelect.appendChild(opt);
  });
}

/* =========================
   Business Profile
   ========================= */
function showBusinessProfile(businessUsername) {
  const b = businesses[businessUsername];
  if (!b) {
    alert("Business info not found!");
    return;
  }

  document.getElementById("profileBusinessName").innerText = b.businessName;
  document.getElementById("profileCityDistrict").innerText = `${b.city}/${b.district} (${b.neighborhood || "-"})`;
  document.getElementById("profileAddress").innerText = `${b.addressDetail}`;
  document.getElementById("profilePhone").innerText = b.phone;

  const otherDiv = document.getElementById("profileOtherProducts");
  otherDiv.innerHTML = "";

  const businessProducts = products.filter(
    (p) => p.businessUsername === businessUsername && p.stock > 0
  );

  if (businessProducts.length === 0) {
    otherDiv.innerHTML = `<p>${b.businessName} has no active products.</p>`;
  } else {
    businessProducts.forEach((p) => {
      const card = document.createElement("div");
      card.classList.add("product");

      const priceHtml =
        p.type === "Donation"
          ? `<span class="fiyat-grup">DONATION (Free)</span>`
          : `<span class="eski-fiyat">${p.oldPrice} TL</span> <span class="fiyat-grup">${p.price} TL</span>`;

      const cartQty = cart.find((o) => o.id === p.id)?.quantity || 0;
      const remaining = p.stock - cartQty;

      card.innerHTML = `
        <h4>${p.description}</h4>
        <img src="${p.imageUrl}" alt="${p.description}" style="width:100%; border-radius:8px; margin:10px 0;">
        <p>Price: ${priceHtml}</p>
        <p>Remaining Stock: <span class="stock-info">${remaining}</span></p>
        <div class="product-action-group">
          <input type="number" id="profileQty-${p.id}" value="1" min="1" max="${remaining}">
          <button onclick="addToCart(${p.id}, document.getElementById('profileQty-${p.id}').value)">Add to Cart</button>
        </div>
      `;
      otherDiv.appendChild(card);
    });
  }

  showPage("businessProfileSection");
}

function showUserSectionOnly() {
  const name = users[activeUser]?.name || "User";
  showUserSection(name);
}

/* =========================
   User: Product Listing & Cart
   ========================= */
function renderProducts() {
  const listDiv = document.getElementById("productList");
  listDiv.innerHTML = "";

  const filterCity = document.getElementById("filterCity").value;
  const filterDistrict = document.getElementById("filterDistrict").value;

  const activeProducts = products.filter((p) => {
    if (p.stock <= 0) return false;
    if (filterCity && p.city !== filterCity) return false;
    if (filterDistrict && p.district !== filterDistrict) return false;
    return true;
  });

  if (activeProducts.length === 0) {
    listDiv.innerHTML = `<p>No products available matching your filters.</p>`;
    return;
  }

  activeProducts.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("product");

    const cartQty = cart.find((o) => o.id === p.id)?.quantity || 0;
    const remaining = p.stock - cartQty;

    const priceHtml =
      p.type === "Donation"
        ? `<span class="fiyat-grup">DONATION (Free)</span>`
        : `<span class="eski-fiyat">${p.oldPrice} TL</span> <span class="fiyat-grup">${p.price} TL</span>`;

    const canAdd = remaining > 0;
    const buttonHtml = canAdd
      ? `
        <div class="product-action-group">
          <input type="number" id="qtyInput-${p.id}" value="1" min="1" max="${remaining}">
          <button onclick="addToCart(${p.id}, document.getElementById('qtyInput-${p.id}').value)">Add to Cart</button>
        </div>`
      : `<button disabled style="background:#ccc;">Out of Stock / In Cart</button>`;

    card.innerHTML = `
      <h4><a onclick="showBusinessProfile('${p.businessUsername}')">${p.businessName}</a></h4>
      <p>Location: ${p.city}/${p.district}</p>
      <p>${p.description} - ${priceHtml}</p>
      <p>Remaining Stock: <span class="stock-info">${remaining}</span></p>
      ${buttonHtml}
      <img src="${p.imageUrl}" alt="${p.description}" style="width:100%; border-radius:8px; margin:10px 0; object-fit:cover; display:block;">
    `;
    listDiv.appendChild(card);
  });
}

function addToCart(productId, qtyInput) {
  const quantity = parseInt(qtyInput);
  if (isNaN(quantity) || quantity <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  const p = products.find((x) => x.id === productId);
  if (!p || p.stock <= 0) return;

  const item = cart.find((o) => o.id === productId);
  const currentQty = item ? item.quantity : 0;
  const newTotalQty = currentQty + quantity;

  if (newTotalQty > p.stock) {
    alert(`Not enough stock! You can add max ${p.stock - currentQty} more.`);
    return;
  }

  if (item) item.quantity = newTotalQty;
  else {
    cart.push({
      id: p.id,
      businessName: p.businessName,
      businessUsername: p.businessUsername,
      description: p.description,
      price: p.price,
      type: p.type,
      quantity,
    });
  }

  renderCart();
  renderProducts();
}

function renderCart() {
  const list = document.getElementById("cartItems");
  list.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    list.innerHTML = "<li>Your cart is empty.</li>";
    return;
  }

  cart.forEach((item, index) => {
    const priceText = item.price === 0 ? "DONATION" : item.price + " TL";
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.businessName} - ${item.description} (x${item.quantity}) - ${priceText}</span>
      <button onclick="removeFromCart(${index})">X</button>
    `;
    list.appendChild(li);
  });

  const totalLi = document.createElement("li");
  totalLi.style.fontWeight = "bold";
  totalLi.innerHTML = `<span>TOTAL:</span> <span>${total.toFixed(2)} TL</span>`;
  list.appendChild(totalLi);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  renderProducts();
}

function clearCart() {
  cart = [];
  renderCart();
  renderProducts();
}

// --- QR reservation (UPDATED to create ORDERs) ---
function reserveProducts() {
  if (cart.length === 0) {
    alert("Your cart is empty. Please add products first.");
    return;
  }

  // Validate stock again + group cart items by business
  const groupedByBusiness = {};
  for (const item of cart) {
    const p = products.find(x => x.id === item.id);
    if (!p) {
      alert("Some products in your cart no longer exist.");
      return;
    }
    if (p.stock < item.quantity) {
      alert(`Error: Not enough stock for ${p.businessName} - ${p.description}.`);
      return;
    }

    if (!groupedByBusiness[p.businessUsername]) groupedByBusiness[p.businessUsername] = [];
    groupedByBusiness[p.businessUsername].push({ item, product: p });
  }

  // Deduct stock + create orders
  const createdOrders = [];
  const userEmail = users[activeUser]?.email || "no-email";
  const createdAt = new Date().toISOString();

  Object.keys(groupedByBusiness).forEach((businessUsername) => {
    const items = groupedByBusiness[businessUsername];

    // deduct stock
    items.forEach(({ item, product }) => {
      product.stock -= item.quantity;
    });

    const businessName = businesses[businessUsername]?.businessName || "Business";

    const order = {
      orderId: nextOrderId++,
      userUsername: activeUser,
      userEmail,
      businessUsername,
      businessName,
      status: "ACTIVE",
      createdAt,
      deliveredAt: null,
      items: items.map(({ item, product }) => ({
        productId: product.id,
        description: product.description,
        quantity: item.quantity,
        price: product.price,
        type: product.type
      }))
    };

    orders.push(order);
    createdOrders.push(order);
  });

  // Create a single QR payload containing all orders (supports multi-business cart)
  const qrPayload = {
    v: 1,
    type: "ORDER_BUNDLE",
    userUsername: activeUser,
    email: userEmail,
    orders: createdOrders.map(o => ({
      orderId: o.orderId,
      businessUsername: o.businessUsername,
      businessName: o.businessName,
      items: o.items.map(it => ({ productId: it.productId, quantity: it.quantity }))
    }))
  };

  // Show alert + QR image
  alert("Order successful! Your reservation has been created.");

  const qrData = JSON.stringify(qrPayload);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

  document.getElementById("qrCodeContainer").innerHTML = `<img src="${qrApiUrl}" alt="QR Code">`;

  const orderIdsText = createdOrders.map(o => `#${o.orderId} (${o.businessName})`).join(" • ");
  document.getElementById("qrOrderDetails").innerText =
    `Orders: ${orderIdsText}\nShow this code to pickup.`;

  document.getElementById("qrModal").style.display = "block";

  clearCart();
  renderProducts();
  renderUserHistory();
  if (activeRole === "business") {
    renderActiveReservations();
    renderBusinessHistory();
  }
}

function closeModal() {
  document.getElementById("qrModal").style.display = "none";
}

window.onclick = function(event) {
  const qrModal = document.getElementById("qrModal");
  const scanModal = document.getElementById("scanModal");
  if (event.target == qrModal) qrModal.style.display = "none";
  if (event.target == scanModal) closeScanModal();
};

/* =========================
   BUSINESS QR SCANNING (BarcodeDetector)
   ========================= */
function openScanModal() {
  if (activeRole !== "business") return;

  const modal = document.getElementById("scanModal");
  const status = document.getElementById("scanStatus");
  const resultBox = document.getElementById("scanResult");
  const confirmBtn = document.getElementById("confirmDeliveredBtn");

  lastScannedPayload = null;
  lastMatchedOrderIds = [];
  confirmBtn.disabled = true;

  status.innerText = "Starting camera...";
  resultBox.classList.add("hidden");
  modal.style.display = "block";

  startScanning();
}

function closeScanModal() {
  const modal = document.getElementById("scanModal");
  if (modal) modal.style.display = "none";
  stopScanning();
}

async function startScanning() {
  const video = document.getElementById("scanVideo");
  const status = document.getElementById("scanStatus");
  const resultBox = document.getElementById("scanResult");
  const resultText = document.getElementById("scanResultText");
  const confirmBtn = document.getElementById("confirmDeliveredBtn");

  // BarcodeDetector support check
  if (!("BarcodeDetector" in window)) {
    status.innerText = "Your browser does not support QR scanning (BarcodeDetector). Try Chrome/Edge.";
    return;
  }

  let detector = null;
  try {
    detector = new BarcodeDetector({ formats: ["qr_code"] });
  } catch (e) {
    status.innerText = "QR scanner init failed. Try another browser.";
    return;
  }

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = scanStream;
    await video.play();
  } catch (e) {
    status.innerText = "Camera permission denied or camera not available.";
    return;
  }

  status.innerText = "Scanning... (point the QR code to the camera)";
  resultBox.classList.add("hidden");
  confirmBtn.disabled = true;

  // scanning loop
  stopScanLoopOnly();
  scanLoopTimer = setInterval(async () => {
    if (!video || video.readyState < 2) return;

    try {
      const bitmap = await createImageBitmap(video);
      const barcodes = await detector.detect(bitmap);
      bitmap.close?.();

      if (barcodes && barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue || "";
        if (!rawValue) return;

        // prevent spamming same QR
        if (lastScannedPayload && lastScannedPayload._raw === rawValue) return;

        const parsed = tryParseQrPayload(rawValue);
        if (!parsed) {
          status.innerText = "QR detected but payload is not recognized.";
          return;
        }

        // match only orders for THIS business
        const matchedOrderIds = findMatchingOrdersForBusiness(parsed, activeUser);

        lastScannedPayload = { ...parsed, _raw: rawValue };
        lastMatchedOrderIds = matchedOrderIds;

        if (matchedOrderIds.length === 0) {
          status.innerText = "QR scanned. No active order found for this business.";
          resultText.innerText = buildReadableScanText(parsed, matchedOrderIds);
          resultBox.classList.remove("hidden");
          confirmBtn.disabled = true;
          return;
        }

        // show details
        status.innerText = `QR scanned. Found order(s): ${matchedOrderIds.map(id => "#" + id).join(", ")}`;
        resultText.innerText = buildReadableScanText(parsed, matchedOrderIds);
        resultBox.classList.remove("hidden");
        confirmBtn.disabled = false;
      }
    } catch (e) {
      // ignore intermittent detection errors
    }
  }, 500);
}

function stopScanLoopOnly() {
  if (scanLoopTimer) {
    clearInterval(scanLoopTimer);
    scanLoopTimer = null;
  }
}

function stopScanning() {
  stopScanLoopOnly();

  const video = document.getElementById("scanVideo");
  if (video) {
    video.pause?.();
    video.srcObject = null;
  }

  if (scanStream) {
    scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
  }

  const status = document.getElementById("scanStatus");
  if (status) status.innerText = "Camera is off.";
}

function tryParseQrPayload(raw) {
  // new JSON payload (recommended)
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.v === 1 && obj.type === "ORDER_BUNDLE" && Array.isArray(obj.orders)) return obj;
  } catch {}

  // old text payload fallback (your previous format)
  // Order:123 | User:xx | Email:yy | Items:a,b,c
  if (/Order\s*:/i.test(raw) && /User\s*:/i.test(raw)) {
    return { v: 0, type: "LEGACY", rawText: raw };
  }

  return null;
}

function findMatchingOrdersForBusiness(payload, businessUsername) {
  const matched = [];

  if (payload.type === "ORDER_BUNDLE" && Array.isArray(payload.orders)) {
    payload.orders.forEach(o => {
      if (!o || !o.orderId) return;
      if (o.businessUsername !== businessUsername) return;

      // check in our local orders list
      const local = orders.find(x => x.orderId === o.orderId && x.businessUsername === businessUsername);
      if (local && local.status === "ACTIVE") matched.push(o.orderId);
    });
  }

  if (payload.type === "LEGACY") {
    // Can't reliably match legacy payload to local order IDs
    // so we don't auto-enable confirm
  }

  return matched;
}

function buildReadableScanText(payload, matchedOrderIds) {
  if (payload.type === "LEGACY") {
    return `LEGACY QR PAYLOAD:\n${payload.rawText}\n\n(For legacy QR, delivery confirmation is disabled.)`;
  }

  // For ORDER_BUNDLE, show matched orders with details from local orders
  let text = `User: ${payload.userUsername || "-"}\nEmail: ${payload.email || "-"}\n\n`;
  if (matchedOrderIds.length === 0) {
    text += `No ACTIVE order found for this business.\n`;
    return text;
  }

  matchedOrderIds.forEach((id) => {
    const o = orders.find(x => x.orderId === id);
    text += `Order #${id} — ${o?.businessName || payload.orders.find(x=>x.orderId===id)?.businessName || "Business"}\n`;
    text += `Created: ${formatDate(o?.createdAt)}\n`;
    text += `Items:\n`;
    (o?.items || []).forEach(it => {
      text += `- ${it.description} (x${it.quantity})\n`;
    });
    text += `\n`;
  });

  return text.trim();
}

function confirmDeliveredFromScan() {
  if (activeRole !== "business") return;
  if (!lastScannedPayload) return alert("No QR scanned yet.");

  if (lastScannedPayload.type === "LEGACY") {
    alert("Legacy QR payload cannot be confirmed automatically. Please confirm manually from Active Reservations.");
    return;
  }

  if (!lastMatchedOrderIds || lastMatchedOrderIds.length === 0) {
    alert("No active matching order found for this business.");
    return;
  }

  const ok = confirm(`Confirm delivery for order(s): ${lastMatchedOrderIds.map(id => "#" + id).join(", ")} ?`);
  if (!ok) return;

  lastMatchedOrderIds.forEach((id) => {
    const o = orders.find(x => x.orderId === id && x.businessUsername === activeUser);
    if (o && o.status === "ACTIVE") {
      o.status = "DELIVERED";
      o.deliveredAt = new Date().toISOString();
    }
  });

  alert("Delivery confirmed!");
  closeScanModal();

  renderActiveReservations();
  renderBusinessHistory();

  // user history update if user is currently logged in (unlikely simultaneously), but safe:
  renderUserHistory?.();
}

/* =========================
   User: Cancel order (restore stock)
   ========================= */
function cancelOrderByUser(orderId) {
  if (activeRole !== "user") return;

  const o = orders.find((x) => x.orderId === orderId && x.userUsername === activeUser);
  if (!o) return alert("Order not found.");
  if (o.status !== "ACTIVE") return alert("Only ACTIVE orders can be cancelled.");

  const ok = confirm(`Cancel Order #${orderId}? Stock will be restored.`);
  if (!ok) return;

  o.status = "CANCELLED_USER";
  o.cancelledAt = new Date().toISOString();

  restoreStockForOrder(o);

  alert(`Order #${orderId} cancelled. Stock restored.`);
  renderProducts();
  renderCart();
  renderUserHistory?.();
  renderActiveReservations?.();
  renderBusinessHistory?.();
}

/* =========================
   Init
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  showPage("authSection");
  renderAuthForm();
  setMode("login");
  setRole("user");
  fillFilterCities();

  const typeSelect = document.getElementById("newProductType");
  if (typeSelect) typeSelect.value = "Donation";
});
