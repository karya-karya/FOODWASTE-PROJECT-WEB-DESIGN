/* =========================
   UI Navigation
   ========================= */
function showPage(pageId) {
  ["authSection", "userSection", "businessSection", "businessProfileSection"].forEach(
    (id) => document.getElementById(id).classList.add("hidden")
  );
  document.getElementById(pageId).classList.remove("hidden");
}

/* =========================
   Mode + Role switches
   ========================= */
function setMode(mode) {
  authMode = mode;

  const tabButtons = document.querySelectorAll(".tabs .tab-button");
  tabButtons.forEach((b) => b.classList.remove("active"));
  if (mode === "login") tabButtons[0].classList.add("active");
  else tabButtons[1].classList.add("active");

  document.getElementById("authTitle").innerText = mode === "login" ? "Login" : "Register";
  document.getElementById("errorMessage").innerText = "";

  renderAuthForm();
}

function setRole(role) {
  authRole = role;

  const roleButtons = document.querySelectorAll(".role-buttons .role-btn");
  roleButtons.forEach((b) => b.classList.remove("active"));
  if (role === "user") roleButtons[0].classList.add("active");
  else roleButtons[1].classList.add("active");

  document.getElementById("errorMessage").innerText = "";
  renderAuthForm();
}

/* =========================
   Business register location selects
   ========================= */
function fillRegisterCities() {
  const citySel = document.getElementById("cityInput");
  const distSel = document.getElementById("districtInput");
  const neighSel = document.getElementById("neighborhoodInput");
  if (!citySel || !distSel || !neighSel) return;

  citySel.innerHTML = `<option value="">Select City</option>`;
  Object.keys(TR_LOCATIONS).sort().forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.innerText = city;
    citySel.appendChild(opt);
  });

  distSel.innerHTML = `<option value="">Select District</option>`;
  neighSel.innerHTML = `<option value="">Select Neighborhood</option>`;

  citySel.onchange = () => {
    const city = citySel.value;
    distSel.innerHTML = `<option value="">Select District</option>`;
    neighSel.innerHTML = `<option value="">Select Neighborhood</option>`;
    if (!city || !TR_LOCATIONS[city]) return;

    Object.keys(TR_LOCATIONS[city]).sort().forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.innerText = d;
      distSel.appendChild(opt);
    });
  };

  distSel.onchange = () => {
    const city = citySel.value;
    const dist = distSel.value;
    neighSel.innerHTML = `<option value="">Select Neighborhood</option>`;
    if (!city || !dist) return;

    const neighs = TR_LOCATIONS?.[city]?.[dist];
    if (!neighs) return;

    neighs.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.innerText = n;
      neighSel.appendChild(opt);
    });
  };
}

/* =========================
   Build auth form dynamically
   ========================= */
function renderAuthForm() {
  const formDiv = document.getElementById("authForm");
  formDiv.innerHTML = "";

  let html = "";

  if (authMode === "register") {
    if (authRole === "user") {
      html += `
        <input type="text" id="nameInput" placeholder="Full Name">
        <input type="email" id="emailInput" placeholder="Gmail Address (must be @gmail.com)">
      `;
    } else {
      html += `
        <input type="text" id="nameInput" placeholder="Business Name">

        <div class="address-group address-3">
          <select id="cityInput">
            <option value="">Select City</option>
          </select>

          <select id="districtInput">
            <option value="">Select District</option>
          </select>

          <select id="neighborhoodInput">
            <option value="">Select Neighborhood</option>
          </select>
        </div>

        <input type="text" id="addressDetailInput" placeholder="Street / Building No (e.g. Ataturk St. No:12)">
        <input
          type="tel"
          id="phoneInput"
          placeholder="Phone (e.g. 05xxxxxxxxx)"
          inputmode="numeric"
          autocomplete="tel"
          maxlength="11"
        >
      `;
    }
  }

  html += `
    <input type="text" id="usernameInput" placeholder="Username">
    <input type="password" id="passwordInput" placeholder="Password">
  `;

  formDiv.innerHTML = html;

  if (authMode === "register" && authRole === "business") {
    fillRegisterCities();
  }

  attachAuthLiveValidation();
}

/* =========================
   Live Validation
   ========================= */
function attachAuthLiveValidation() {
  const errorDiv = document.getElementById("errorMessage");

  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");

  const phoneInput = document.getElementById("phoneInput");
  const citySel = document.getElementById("cityInput");
  const distSel = document.getElementById("districtInput");
  const neighSel = document.getElementById("neighborhoodInput");
  const addressDetailInput = document.getElementById("addressDetailInput");

  [
    usernameInput, passwordInput, nameInput, emailInput,
    phoneInput, citySel, distSel, neighSel, addressDetailInput
  ].filter(Boolean).forEach((inp) => {
    inp.addEventListener("input", () => {
      if (errorDiv && errorDiv.innerText) errorDiv.innerText = "";
      setInputState(inp, "");
    });
    inp.addEventListener("change", () => {
      if (errorDiv && errorDiv.innerText) errorDiv.innerText = "";
      setInputState(inp, "");
    });
  });

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      const email = emailInput.value.trim();
      if (!email) return;
      if (!isValidGmail(email)) {
        showFieldError(emailInput, "Please enter a valid Gmail address (@gmail.com).", errorDiv);
      } else {
        setInputState(emailInput, "ok");
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const digits = normalizePhone(phoneInput.value);
      phoneInput.value = digits;

      if (!digits) return;
      if (digits.length >= 10) {
        if (isValidTRPhoneDigits(digits)) setInputState(phoneInput, "ok");
        else setInputState(phoneInput, "error");
      }
    });

    phoneInput.addEventListener("keypress", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ch = String.fromCharCode(e.which);
      if (!/[0-9]/.test(ch)) e.preventDefault();
    });

    // paste safety
    phoneInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData("text");
      phoneInput.value = normalizePhone(pasted);
    });

    phoneInput.addEventListener("blur", () => {
      const digits = normalizePhone(phoneInput.value);
      if (!digits) return;
      if (!isValidTRPhoneDigits(digits)) {
        showFieldError(phoneInput, "Phone must be 10-11 digits (e.g. 05xxxxxxxxx).", errorDiv);
      } else {
        setInputState(phoneInput, "ok");
      }
    });
  }
}

/* =========================
   Auth handler
   ========================= */
function handleAuth() {
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const nameInput = document.getElementById("nameInput");

  const emailInput = document.getElementById("emailInput");

  const citySel = document.getElementById("cityInput");
  const distSel = document.getElementById("districtInput");
  const neighSel = document.getElementById("neighborhoodInput");
  const addressDetailInput = document.getElementById("addressDetailInput");
  const phoneInput = document.getElementById("phoneInput");

  const username = usernameInput?.value.trim();
  const password = passwordInput?.value.trim();
  const name = nameInput?.value.trim();

  const email = emailInput?.value.trim();

  const city = citySel?.value;
  const district = distSel?.value;
  const neighborhood = neighSel?.value;

  const addressDetail = addressDetailInput?.value.trim();
  const phoneDigits = normalizePhone(phoneInput?.value.trim() || "");

  const errorDiv = document.getElementById("errorMessage");
  errorDiv.innerText = "";

  const isRegister = authMode === "register";

  if (!username) return showFieldError(usernameInput, "Username is required.", errorDiv);
  if (!password) return showFieldError(passwordInput, "Password is required.", errorDiv);
  if (username && username.length < 3) return showFieldError(usernameInput, "Username must be at least 3 characters.", errorDiv);
  if (password && password.length < 6) return showFieldError(passwordInput, "Password must be at least 6 characters.", errorDiv);
  if (isRegister && !name) return showFieldError(nameInput, "Name is required.", errorDiv);

  // USER
  if (authRole === "user") {
    if (authMode === "register") {
      if (!email) return showFieldError(emailInput, "Gmail is required.", errorDiv);
      if (!isValidGmail(email)) return showFieldError(emailInput, "Please enter a valid Gmail address (@gmail.com).", errorDiv);

      if (users[username]) {
        return showFieldError(usernameInput, "This username already exists!", errorDiv);
      }

      const emailExists = Object.values(users).some(u => u.email === email);
      if (emailExists) {
        return showFieldError(emailInput, "This Gmail address is already registered!", errorDiv);
      }

      users[username] = { password, name, email };
      activeUser = username;
      activeRole = "user";
      alert("Registration successful!");

      showUserSection(users[username].name);
      return;
    }

    // login
    if (users[username]?.password !== password) {
      return showFieldError(passwordInput, "Incorrect username or password!", errorDiv);
    }
    activeUser = username;
    activeRole = "user";
    showUserSection(users[username].name);
    return;
  }

  // BUSINESS
  if (authRole === "business") {
    if (authMode === "register") {
      if (!city || !TR_LOCATIONS[city]) {
        return showFieldError(citySel, "Please select a valid city.", errorDiv);
      }
      if (!district || !TR_LOCATIONS[city][district]) {
        return showFieldError(distSel, "Please select a valid district.", errorDiv);
      }
      if (!neighborhood || !TR_LOCATIONS[city][district].includes(neighborhood)) {
        return showFieldError(neighSel, "Please select a valid neighborhood.", errorDiv);
      }

      if (!addressDetail || addressDetail.length < 5) {
        return showFieldError(addressDetailInput, "Please enter street and building number (min 5 chars).", errorDiv);
      }

      if (!phoneDigits) return showFieldError(phoneInput, "Phone is required.", errorDiv);
      if (!isValidTRPhoneDigits(phoneDigits)) return showFieldError(phoneInput, "Phone must be 10-11 digits (e.g. 05xxxxxxxxx).", errorDiv);

      if (businesses[username]) {
        return showFieldError(usernameInput, "This business username already exists!", errorDiv);
      }

      businesses[username] = {
        password,
        businessName: name,
        city: city.toUpperCase(),
        district: district.toUpperCase(),
        neighborhood: neighborhood.toUpperCase(),
        addressDetail,
        phone: phoneDigits,
      };

      activeUser = username;
      activeRole = "business";
      showBusinessSection(businesses[username].businessName);
      return;
    }

    // login
    if (businesses[username]?.password !== password) {
      return showFieldError(passwordInput, "Incorrect business username or password!", errorDiv);
    }
    activeUser = username;
    activeRole = "business";
    showBusinessSection(businesses[username].businessName);
  }
}

function showUserSection(name) {
  document.getElementById("userWelcome").innerText = `Welcome, ${name}!`;

  const av = document.getElementById("userAvatar");
  if (av) av.innerText = getInitialLetter(name);

  const sub = document.getElementById("userSubtitle");
  if (sub) sub.innerText =
    "Reserve surplus food, reduce waste, and support local businesses.";

  const badge = document.getElementById("userRoleBadge");
  if (badge) badge.innerText = "USER";

  showPage("userSection");
  fillFilterCities();
  renderProducts();
  renderCart();
  renderUserHistory();
}

function showBusinessSection(businessName) {
  document.getElementById("businessWelcome").innerText =
    `Welcome, ${businessName}!`;

  const av = document.getElementById("businessAvatar");
  if (av) av.innerText = getInitialLetter(businessName);

  const sub = document.getElementById("businessSubtitle");
  if (sub) sub.innerText =
    "Add products, manage reservations, and confirm deliveries faster.";

  const badge = document.getElementById("businessRoleBadge");
  if (badge) badge.innerText = "BUSINESS";

  showPage("businessSection");
  togglePriceInputs();
  renderBusinessProducts();
  renderActiveReservations();
  renderBusinessHistory();
}

function logout() {
  activeUser = null;
  activeRole = null;
  cart = [];

  // Reset business success/error message on logout
  const businessError = document.getElementById("businessError");
  if (businessError) businessError.innerText = "";

  closeScanModal(); // safe
  showPage("authSection");
  setMode("login");
  setRole("user");
}
