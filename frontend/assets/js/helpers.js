// --- UI Helpers ---
function shakeError(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function setInputState(input, state) {
  if (!input) return;
  input.classList.remove("input-error", "input-ok");
  if (state === "error") input.classList.add("input-error");
  if (state === "ok") input.classList.add("input-ok");
}

function showFieldError(input, message, errorDiv) {
  setInputState(input, "error");
  if (errorDiv) {
    errorDiv.innerText = message || "Please check the form.";
    shakeError(errorDiv);
  }
}

function clearFieldError(input, errorDiv) {
  setInputState(input, "");
  if (errorDiv) errorDiv.innerText = "";
}

// --- Validation helpers ---
function isValidGmail(email) {
  if (!email) return false;
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

function normalizePhone(raw) {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

function isValidTRPhoneDigits(digits) {
  if (!digits) return false;
  if (digits.length === 11) return digits.startsWith("0") && digits[1] === "5";
  if (digits.length === 10) return digits.startsWith("5");
  return false;
}

// --- Date formatting ---
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "-";
  }
}

function getInitialLetter(name) {
  const s = (name || "").trim();
  if (!s) return "?";
  return s[0].toUpperCase();
}

// --- Stock restore (used when cancelling/rejecting orders) ---
function restoreStockForOrder(order) {
  if (!order || !Array.isArray(order.items)) return;

  order.items.forEach((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (p) p.stock += it.quantity;
  });
}
