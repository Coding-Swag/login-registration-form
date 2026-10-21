/* ============================================================
   LUMORA — Auth System JavaScript
   API: dummyjson.com
   Features: Login (GET user validation), Register (POST),
             Full real-time validation, password strength,
             show/hide toggles, page switching.
   ============================================================ */

"use strict";

// ============================================================
// UTILITY HELPERS
// ============================================================

/**
 * Show an inline field error with animation.
 * @param {HTMLElement} errorEl - The <p class="field-error"> element
 * @param {string} message
 */
function showError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.add("show");
  // Mark parent as error state
  const group = errorEl.closest(".field-group");
  if (group) {
    group.classList.add("has-error");
    group.classList.remove("has-success");
  }
}

/**
 * Clear a field error.
 * @param {HTMLElement} errorEl
 */
function clearError(errorEl) {
  errorEl.textContent = "";
  errorEl.classList.remove("show");
  const group = errorEl.closest(".field-group");
  if (group) {
    group.classList.remove("has-error");
  }
}

/**
 * Mark field as valid (green border).
 * @param {HTMLElement} errorEl
 */
function markSuccess(errorEl) {
  clearError(errorEl);
  const group = errorEl.closest(".field-group");
  if (group) {
    group.classList.add("has-success");
  }
}

/**
 * Show API banner.
 * @param {HTMLElement} el - Message banner element
 * @param {string} message
 * @param {"success"|"error"} type
 */
function showBanner(el, message, type) {
  el.textContent = message;
  el.className = `message-banner ${type}`;
  el.classList.remove("hidden");
}

/** Hide API banner */
function hideBanner(el) {
  el.classList.add("hidden");
  el.className = "message-banner hidden";
}

/**
 * Toggle show/hide password input.
 * @param {HTMLInputElement} inputEl
 * @param {HTMLButtonElement} btnEl
 */
function togglePasswordVisibility(inputEl, btnEl) {
  const isHidden = inputEl.type === "password";
  inputEl.type = isHidden ? "text" : "password";

  const svg = btnEl.querySelector("svg");
  if (svg) {
    // Swap eye icon appearance
    if (isHidden) {
      // Crossed eye (password visible)
      svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>`;
    } else {
      // Open eye (password hidden)
      svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  }
}

// ============================================================
// PAGE SWITCHING
// ============================================================

const loginPage    = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");

function showPage(page) {
  loginPage.classList.remove("active");
  registerPage.classList.remove("active");
  page.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("goToRegister").addEventListener("click", () => {
  showPage(registerPage);
});

document.getElementById("goToLogin").addEventListener("click", () => {
  showPage(loginPage);
});

// ============================================================
// PASSWORD SHOW/HIDE TOGGLES
// ============================================================

// Login form
togglePasswordVisibility.setup = function (inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (input && btn) {
    btn.addEventListener("click", () => togglePasswordVisibility(input, btn));
  }
};

togglePasswordVisibility.setup("password", "togglePassword");
togglePasswordVisibility.setup("regPassword", "toggleRegPassword");
togglePasswordVisibility.setup("confirmPassword", "toggleConfirmPassword");

// ============================================================
// PASSWORD STRENGTH METER
// ============================================================

const regPasswordInput = document.getElementById("regPassword");
const segments         = [
  document.getElementById("seg1"),
  document.getElementById("seg2"),
  document.getElementById("seg3"),
  document.getElementById("seg4"),
];
const strengthLabel = document.getElementById("strengthLabel");

// Checklist items
const chkLength  = document.getElementById("chkLength");
const chkUpper   = document.getElementById("chkUpper");
const chkNumber  = document.getElementById("chkNumber");
const chkSpecial = document.getElementById("chkSpecial");

/**
 * Calculate password strength (0-4).
 * @param {string} password
 * @returns {{ score: number, label: string, cls: string }}
 */
function getPasswordStrength(password) {
  let score = 0;

  const hasLength  = password.length >= 8;
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength)  score++;
  if (hasUpper)   score++;
  if (hasNumber)  score++;
  if (hasSpecial) score++;

  // Extra bonus for length
  if (password.length >= 14) score = Math.min(score + 1, 4);

  const map = [
    { label: "",        cls: ""       },
    { label: "Weak",    cls: "weak"   },
    { label: "Fair",    cls: "fair"   },
    { label: "Good",    cls: "good"   },
    { label: "Strong",  cls: "strong" },
  ];

  return {
    score,
    label: map[score]?.label || "",
    cls:   map[score]?.cls   || "",
    hasLength,
    hasUpper,
    hasNumber,
    hasSpecial,
  };
}

function updateStrengthUI(password) {
  const checklist = document.getElementById("pwdChecklist");

  if (!password) {
    // Reset all — hide checklist when field is empty
    segments.forEach(s => { s.className = "strength-segment"; });
    strengthLabel.textContent = "";
    strengthLabel.className = "strength-label";
    checklist.classList.remove("visible");
    [chkLength, chkUpper, chkNumber, chkSpecial].forEach(el => {
      el.classList.remove("pass");
    });
    return;
  }

  // Show checklist as soon as user starts typing
  checklist.classList.add("visible");

  const result = getPasswordStrength(password);

  // Update segments
  const colorCls = result.cls;
  segments.forEach((seg, i) => {
    seg.className = "strength-segment" + (i < result.score ? ` ${colorCls}` : "");
  });

  // Update label
  strengthLabel.textContent = result.label ? `Password strength: ${result.label}` : "";
  strengthLabel.className = `strength-label ${colorCls}`;

  // Update checklist — pass = green ✓, not pass = red ✕
  chkLength.classList.toggle("pass",  result.hasLength);
  chkUpper.classList.toggle("pass",   result.hasUpper);
  chkNumber.classList.toggle("pass",  result.hasNumber);
  chkSpecial.classList.toggle("pass", result.hasSpecial);
}

regPasswordInput.addEventListener("input", () => {
  updateStrengthUI(regPasswordInput.value);
  // Also re-validate confirm password if user has started typing there
  const confirm = document.getElementById("confirmPassword");
  if (confirm.value) {
    validateConfirmPassword(regPasswordInput.value, confirm.value);
  }
});

// ============================================================
// VALIDATION RULES
// ============================================================

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

/**
 * Validates phone numbers:
 * - Must contain at least 10 digits (mobile / international standard)
 * - Must not exceed 15 digits (ITU-T E.164 standard)
 * - Allows optional +, spaces, dashes, parentheses
 */
function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return "Phone number is required.";
  }
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, "");

  if (digits.length < 10) {
    return `Phone number is too short (${digits.length} digits). Please enter at least 10 digits (e.g. 03001234567 or +92 300 1234567).`;
  }
  if (digits.length > 15) {
    return `Phone number is too long (${digits.length} digits). Maximum 15 digits allowed.`;
  }
  if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{2,6}[-\s.]?[0-9]{2,6}$/.test(clean)) {
    return "Please enter a valid phone number (digits, optional +, -, () only).";
  }
  return null;
}

function validateConfirmPassword(password, confirm) {
  const errEl = document.getElementById("confirmPasswordError");
  if (!confirm) {
    showError(errEl, "Please confirm your password.");
    return false;
  }
  if (confirm !== password) {
    showError(errEl, "Passwords do not match.");
    return false;
  }
  markSuccess(errEl);
  return true;
}

// ============================================================
// REAL-TIME VALIDATION (on blur)
// ============================================================

// --- Login form real-time ---
function attachLoginRealtime() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");

  usernameInput.addEventListener("blur", () => {
    const val = usernameInput.value.trim();
    if (!val) {
      showError(usernameError, "Username is required.");
    } else if (val.length < 3) {
      showError(usernameError, "Username must be at least 3 characters.");
    } else {
      markSuccess(usernameError);
    }
  });

  usernameInput.addEventListener("input", () => {
    if (document.getElementById("usernameGroup").classList.contains("has-error")) {
      const val = usernameInput.value.trim();
      if (val.length >= 3) markSuccess(usernameError);
    }
  });

  passwordInput.addEventListener("blur", () => {
    const val = passwordInput.value;
    if (!val) {
      showError(passwordError, "Password is required.");
    } else if (val.length < 6) {
      showError(passwordError, "Password must be at least 6 characters.");
    } else {
      markSuccess(passwordError);
    }
  });

  passwordInput.addEventListener("input", () => {
    if (document.getElementById("passwordGroup").classList.contains("has-error")) {
      if (passwordInput.value.length >= 6) markSuccess(passwordError);
    }
  });
}
attachLoginRealtime();

// --- Registration form real-time ---
function attachRegisterRealtime() {
  const fields = [
    { id: "firstName",       errorId: "firstNameError",   validate: (v) => {
        if (!v) return "First name is required.";
        if (v.length < 2) return "First name must be at least 2 characters.";
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return "First name can only contain letters.";
        return null;
      }
    },
    { id: "lastName",        errorId: "lastNameError",    validate: (v) => {
        if (!v) return "Last name is required.";
        if (v.length < 2) return "Last name must be at least 2 characters.";
        return null;
      }
    },
    { id: "regEmail",        errorId: "regEmailError",    validate: (v) => {
        if (!v) return "Email address is required.";
        if (!EMAIL_REGEX.test(v)) return "Please enter a valid email address.";
        return null;
      }
    },
    { id: "regUsername",     errorId: "regUsernameError", validate: (v) => {
        if (!v) return "Username is required.";
        if (!USERNAME_REGEX.test(v)) return "Username must be 3–30 chars, letters, numbers, '.', '_', '-' only.";
        return null;
      }
    },
    { id: "phone",           errorId: "phoneError",       validate: (v) => validatePhone(v) },
    { id: "dob",             errorId: "dobError",         validate: (v) => {
        if (!v) return "Date of birth is required.";
        const dob = new Date(v);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (dob > today) return "Date of birth cannot be in the future.";
        if (age < 13) return "You must be at least 13 years old.";
        if (age > 120) return "Please enter a valid date of birth.";
        return null;
      }
    },
    { id: "regPassword",     errorId: "regPasswordError", validate: (v) => {
        if (!v) return "Password is required.";
        if (v.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter.";
        if (!/[0-9]/.test(v)) return "Password must contain at least one number.";
        if (!/[^A-Za-z0-9]/.test(v)) return "Password must contain at least one special character.";
        return null;
      }
    },
    { id: "confirmPassword", errorId: "confirmPasswordError", validate: (v) => {
        if (!v) return "Please confirm your password.";
        if (v !== document.getElementById("regPassword").value) return "Passwords do not match.";
        return null;
      }
    },
  ];

  fields.forEach(({ id, errorId, validate }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errorId);
    if (!input || !errEl) return;

    input.addEventListener("blur", () => {
      const err = validate(input.value.trim?.() ?? input.value);
      if (err) showError(errEl, err);
      else markSuccess(errEl);
    });

    input.addEventListener("input", () => {
      const group = input.closest(".field-group");
      if (group && group.classList.contains("has-error")) {
        const err = validate(input.value.trim?.() ?? input.value);
        if (!err) markSuccess(errEl);
      }
    });
  });

  // Gender card visual update
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      clearError(document.getElementById("genderError"));
    });
  });

  // Terms checkbox
  document.getElementById("terms").addEventListener("change", () => {
    clearError(document.getElementById("termsError"));
  });
}
attachRegisterRealtime();

// ============================================================
// LOCAL USER STORE (localStorage)
// ============================================================

/**
 * Get all locally registered users from localStorage.
 * @returns {Array} array of user objects
 */
function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem("lumora_users") || "[]");
  } catch {
    return [];
  }
}

/**
 * Save a new user to localStorage.
 * @param {Object} user
 */
function saveLocalUser(user) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem("lumora_users", JSON.stringify(users));
}

/**
 * Find a locally registered user by username OR email (case-insensitive).
 * @param {string} identifier (username or email)
 * @returns {Object|null}
 */
function findLocalUser(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  return getLocalUsers().find(
    (u) => (u.username && u.username.toLowerCase() === clean) ||
           (u.email && u.email.toLowerCase() === clean)
  ) || null;
}

/**
 * Check if a username already exists locally.
 * @param {string} username
 * @returns {boolean}
 */
function localUsernameExists(username) {
  if (!username) return false;
  const clean = username.trim().toLowerCase();
  return getLocalUsers().some(
    (u) => u.username && u.username.toLowerCase() === clean
  );
}

/**
 * Check if an email already exists locally.
 * @param {string} email
 * @returns {boolean}
 */
function localEmailExists(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getLocalUsers().some(
    (u) => u.email && u.email.toLowerCase() === clean
  );
}

// ============================================================
// LOGIN FORM SUBMIT  (localStorage → dummyjson fallback)
// ============================================================

const loginForm    = document.getElementById("loginForm");
const loginButton  = document.getElementById("loginButton");
const loginBtnText = document.getElementById("loginBtnText");
const loginSpinner = document.getElementById("loginSpinner");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideBanner(loginMessage);

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;

  // --- Username validation ---
  if (!username) {
    showError(usernameError, "Username is required.");
    isValid = false;
  } else if (username.length < 3) {
    showError(usernameError, "Username must be at least 3 characters.");
    isValid = false;
  } else {
    markSuccess(usernameError);
  }

  // --- Password validation ---
  if (!password) {
    showError(passwordError, "Password is required.");
    isValid = false;
  } else if (password.length < 6) {
    showError(passwordError, "Password must be at least 6 characters.");
    isValid = false;
  } else {
    markSuccess(passwordError);
  }

  if (!isValid) return;

  // --- Loading state ---
  loginButton.disabled = true;
  loginBtnText.textContent = "Signing in…";
  loginSpinner.classList.remove("hidden");

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Check localStorage first
    //         (users who registered via our form)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const localUser = findLocalUser(username);

    if (localUser) {
      // Found locally — verify password
      if (localUser.password !== password) {
        throw new Error("Incorrect password. Please try again.");
      }

      // ✅ Local login success
      sessionStorage.setItem("lumora_token", "local_" + Date.now());
      sessionStorage.setItem("lumora_user", JSON.stringify(localUser));

      console.group("✅ Local Login Successful");
      console.log("%c👤 User Profile (from localStorage)", "color:#4f46e5; font-weight:700;");
      console.table({
        ID:         localUser.id,
        Name:       `${localUser.firstName} ${localUser.lastName}`,
        Email:      localUser.email,
        Username:   localUser.username,
        Phone:      localUser.phone,
        Gender:     localUser.gender,
        DOB:        localUser.birthDate,
        "Source":   "localStorage (registered via form)"
      });
      console.groupEnd();

      showBanner(
        loginMessage,
        `✅ Welcome back, ${localUser.firstName}! Logged in successfully.`,
        "success"
      );
      return; // Done — no need to call API
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Fallback → dummyjson API
    //         (for pre-existing test accounts)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const loginResponse = await fetch("https://dummyjson.com/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      // Neither local nor API found this user
      throw new Error(
        loginData.message ||
        "Invalid credentials. If you registered, please check your username/password."
      );
    }

    // Store session token
    sessionStorage.setItem("lumora_token", loginData.accessToken || "api_demo");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: GET full user profile by ID
    //         from dummyjson (real API fetch)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let fullProfile = null;
    try {
      const profileResponse = await fetch(
        `https://dummyjson.com/users/${loginData.id}`,
        {
          headers: {
            "Authorization": `Bearer ${loginData.accessToken}`,
          },
        }
      );
      fullProfile = await profileResponse.json();
    } catch (_) {
      // Profile fetch failed — use login response data as fallback
      fullProfile = loginData;
    }

    // Store profile
    sessionStorage.setItem("lumora_user", JSON.stringify(fullProfile));

    // ✅ API login success — log full profile
    console.group("✅ API Login Successful (dummyjson.com)");
    console.log("%c👤 Full User Profile (fetched via GET /users/:id)", "color:#4f46e5; font-weight:700;");
    console.table({
      ID:          fullProfile.id,
      Name:        `${fullProfile.firstName} ${fullProfile.lastName}`,
      Email:       fullProfile.email,
      Username:    fullProfile.username,
      Phone:       fullProfile.phone,
      Gender:      fullProfile.gender,
      DOB:         fullProfile.birthDate,
      Age:         fullProfile.age,
      Role:        fullProfile.role,
      Company:     fullProfile.company?.name || "—",
      "Source":    "dummyjson.com API"
    });
    console.log("%c🔑 Access Token:", "color:#16a34a;", loginData.accessToken);
    console.groupEnd();

    showBanner(
      loginMessage,
      `✅ Welcome back, ${fullProfile.firstName}! Logged in successfully.`,
      "success"
    );

  } catch (error) {
    showBanner(
      loginMessage,
      `❌ ${error.message || "Something went wrong. Please try again."}`,
      "error"
    );
    console.error("❌ Login error:", error.message);

  } finally {
    loginButton.disabled = false;
    loginBtnText.textContent = "Sign in";
    loginSpinner.classList.add("hidden");
  }
});

// ============================================================
// REGISTER FORM SUBMIT
// ============================================================

const registerForm    = document.getElementById("registerForm");
const registerButton  = document.getElementById("registerButton");
const registerBtnText = document.getElementById("registerBtnText");
const registerSpinner = document.getElementById("registerSpinner");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideBanner(registerMessage);

  // Collect values
  const firstName       = document.getElementById("firstName").value.trim();
  const lastName        = document.getElementById("lastName").value.trim();
  const email           = document.getElementById("regEmail").value.trim();
  const username        = document.getElementById("regUsername").value.trim();
  const phone           = document.getElementById("phone").value.trim();
  const dob             = document.getElementById("dob").value;
  const genderEl        = document.querySelector('input[name="gender"]:checked');
  const gender          = genderEl ? genderEl.value : "";
  const password        = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const termsChecked    = document.getElementById("terms").checked;

  let isValid = true;

  // --- First Name ---
  const firstNameError = document.getElementById("firstNameError");
  if (!firstName) {
    showError(firstNameError, "First name is required.");
    isValid = false;
  } else if (firstName.length < 2) {
    showError(firstNameError, "First name must be at least 2 characters.");
    isValid = false;
  } else if (!/^[a-zA-Z\s'-]+$/.test(firstName)) {
    showError(firstNameError, "First name can only contain letters.");
    isValid = false;
  } else {
    markSuccess(firstNameError);
  }

  // --- Last Name ---
  const lastNameError = document.getElementById("lastNameError");
  if (!lastName) {
    showError(lastNameError, "Last name is required.");
    isValid = false;
  } else if (lastName.length < 2) {
    showError(lastNameError, "Last name must be at least 2 characters.");
    isValid = false;
  } else {
    markSuccess(lastNameError);
  }

  // --- Email ---
  const regEmailError = document.getElementById("regEmailError");
  if (!email) {
    showError(regEmailError, "Email address is required.");
    isValid = false;
  } else if (!EMAIL_REGEX.test(email)) {
    showError(regEmailError, "Please enter a valid email address.");
    isValid = false;
  } else if (localEmailExists(email)) {
    showError(regEmailError, `Email "${email}" is already registered. Please login instead.`);
    isValid = false;
  } else {
    markSuccess(regEmailError);
  }

  // --- Username (also check duplicate in localStorage) ---
  const regUsernameError = document.getElementById("regUsernameError");
  if (!username) {
    showError(regUsernameError, "Username is required.");
    isValid = false;
  } else if (!USERNAME_REGEX.test(username)) {
    showError(regUsernameError, "Username must be 3–30 chars, using only letters, numbers, '.', '_', '-'.");
    isValid = false;
  } else if (localUsernameExists(username)) {
    showError(regUsernameError, `Username "${username}" is already taken. Please choose another.`);
    isValid = false;
  } else {
    markSuccess(regUsernameError);
  }

  // --- Phone ---
  const phoneError = document.getElementById("phoneError");
  const phoneValidationMsg = validatePhone(phone);
  if (phoneValidationMsg) {
    showError(phoneError, phoneValidationMsg);
    isValid = false;
  } else {
    markSuccess(phoneError);
  }

  // --- Date of Birth ---
  const dobError = document.getElementById("dobError");
  if (!dob) {
    showError(dobError, "Date of birth is required.");
    isValid = false;
  } else {
    const dobDate = new Date(dob);
    const today   = new Date();
    const age     = today.getFullYear() - dobDate.getFullYear();
    if (dobDate > today) {
      showError(dobError, "Date of birth cannot be in the future.");
      isValid = false;
    } else if (age < 13) {
      showError(dobError, "You must be at least 13 years old to register.");
      isValid = false;
    } else if (age > 120) {
      showError(dobError, "Please enter a valid date of birth.");
      isValid = false;
    } else {
      markSuccess(dobError);
    }
  }

  // --- Gender ---
  const genderError = document.getElementById("genderError");
  if (!gender) {
    showError(genderError, "Please select a gender.");
    isValid = false;
  } else {
    clearError(genderError);
  }

  // --- Password ---
  const regPasswordError = document.getElementById("regPasswordError");
  if (!password) {
    showError(regPasswordError, "Password is required.");
    isValid = false;
  } else if (password.length < 8) {
    showError(regPasswordError, "Password must be at least 8 characters.");
    isValid = false;
  } else if (!/[A-Z]/.test(password)) {
    showError(regPasswordError, "Password must contain at least one uppercase letter.");
    isValid = false;
  } else if (!/[0-9]/.test(password)) {
    showError(regPasswordError, "Password must contain at least one number.");
    isValid = false;
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    showError(regPasswordError, "Password must contain at least one special character.");
    isValid = false;
  } else {
    markSuccess(regPasswordError);
  }

  // --- Confirm Password ---
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  if (!confirmPassword) {
    showError(confirmPasswordError, "Please confirm your password.");
    isValid = false;
  } else if (confirmPassword !== password) {
    showError(confirmPasswordError, "Passwords do not match.");
    isValid = false;
  } else {
    markSuccess(confirmPasswordError);
  }

  // --- Terms ---
  const termsError = document.getElementById("termsError");
  if (!termsChecked) {
    showError(termsError, "You must agree to the Terms of Service to continue.");
    isValid = false;
  } else {
    clearError(termsError);
  }

  if (!isValid) {
    const firstError = registerForm.querySelector(".field-group.has-error");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // --- Loading state ---
  registerButton.disabled = true;
  registerBtnText.textContent = "Creating account…";
  registerSpinner.classList.remove("hidden");

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: POST to dummyjson (simulation)
    //         dummyjson /users/add returns a
    //         fake ID but doesn't persist data.
    //         We use the response to confirm
    //         the API acknowledged our request.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const apiResponse = await fetch("https://dummyjson.com/users/add", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email, username,
        phone, birthDate: dob, gender, password,
      }),
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(apiData.message || "Registration failed. Please try again.");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Save user to localStorage
    //         This makes login actually work!
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const newUser = {
      id:         "local_" + Date.now(),
      firstName,
      lastName,
      email,
      username,
      phone,
      birthDate:  dob,
      gender,
      password,               // stored for local auth check
      registeredAt: new Date().toISOString(),
      source: "local",
    };

    saveLocalUser(newUser);

    console.group("🎉 Registration Successful");
    console.log("%c✅ User saved to localStorage", "color:#16a34a; font-weight:700;");
    console.table({
      ID:          newUser.id,
      Name:        `${newUser.firstName} ${newUser.lastName}`,
      Email:       newUser.email,
      Username:    newUser.username,
      Phone:       newUser.phone,
      Gender:      newUser.gender,
      DOB:         newUser.birthDate,
      "API Response ID": apiData.id,
      "Can login?": "✅ YES — use your username + password",
    });
    console.log("%c📦 All registered users:", "color:#4f46e5;", getLocalUsers());
    console.groupEnd();

    showBanner(
      registerMessage,
      `🎉 Account created, ${firstName}! Redirecting to login in 2 seconds…`,
      "success"
    );

    // Reset form
    registerForm.reset();
    updateStrengthUI("");
    document.querySelectorAll(".field-group").forEach((g) => {
      g.classList.remove("has-error", "has-success");
    });
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show");
    });

    // Auto-switch to login and pre-fill username
    setTimeout(() => {
      showPage(loginPage);
      document.getElementById("username").value = username;
      hideBanner(registerMessage);
    }, 2000);

  } catch (error) {
    showBanner(
      registerMessage,
      `❌ ${error.message || "Something went wrong. Please try again."}`,
      "error"
    );
    console.error("❌ Registration error:", error.message);

  } finally {
    registerButton.disabled = false;
    registerBtnText.textContent = "Create Account";
    registerSpinner.classList.add("hidden");
  }
});

// ============================================================
// FETCH USERS (GET) — Demo helper for viewing existing users
// ============================================================

/**
 * GET all users from dummyjson
 * (You can call this function from console: fetchAllUsers())
 */
async function fetchAllUsers() {
  try {
    const response = await fetch("https://dummyjson.com/users");
    const data     = await response.json();
    console.log("📋 All users:", data.users);
    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

/**
 * DELETE a user by ID from dummyjson (demo)
 * @param {number} userId
 */
async function deleteUser(userId) {
  try {
    const response = await fetch(`https://dummyjson.com/users/${userId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    console.log(`🗑️ Deleted user ${userId}:`, data);
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

/**
 * UPDATE a user by ID from dummyjson (demo)
 * @param {number} userId
 * @param {Object} updates - key/value pairs to update
 */
async function updateUser(userId, updates) {
  try {
    const response = await fetch(`https://dummyjson.com/users/${userId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    console.log(`✏️ Updated user ${userId}:`, data);
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
  }
}

// Expose helpers to console for demo purposes
window.lumora = { fetchAllUsers, deleteUser, updateUser };

// ============================================================
// FORGOT PASSWORD (Demo)
// ============================================================

document.getElementById("forgotPassword").addEventListener("click", (e) => {
  e.preventDefault();
  showBanner(
    loginMessage,
    "📧 Password reset link will be sent to your email. (Demo feature)",
    "success"
  );
  setTimeout(() => hideBanner(loginMessage), 3500);
});

// ============================================================
// INIT
// ============================================================
console.log(
  "%c🚀 Lumora Auth System loaded!\n%cAPI helpers available via: window.lumora.fetchAllUsers(), .deleteUser(id), .updateUser(id, data)",
  "color:#4f46e5; font-weight:700; font-size:14px;",
  "color:#6b7280; font-size:12px;"
);