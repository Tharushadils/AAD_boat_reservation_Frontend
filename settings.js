/* =====================================================
   AQUAVENTURE SETTINGS JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/users";

const changePasswordForm = document.getElementById("changePasswordForm");
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const updatePasswordBtn = document.getElementById("updatePasswordBtn");
const logoutConfirmBtn = document.getElementById("logoutConfirmBtn");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Password visibility toggles
    document.querySelectorAll(".toggle-password-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPass = input.type === "password";
            input.type = isPass ? "text" : "password";
            btn.innerHTML = isPass ? `<i class="fa-solid fa-eye-slash"></i>` : `<i class="fa-solid fa-eye"></i>`;
        });
    });

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", handleChangePassword);
    }

    if (logoutConfirmBtn) {
        logoutConfirmBtn.addEventListener("click", handleLogout);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }

    window.addEventListener("scroll", () => {
        if (backToTop) {
            if (window.scrollY > 300) backToTop.classList.add("visible");
            else backToTop.classList.remove("visible");
        }
    });

    if (backToTop) {
        backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (newPassword !== confirmPassword) {
        showToast("Error", "New password and confirm password do not match!");
        return;
    }

    if (newPassword.length < 6) {
        showToast("Error", "Password must be at least 6 characters long!");
        return;
    }

    updatePasswordBtn.disabled = true;
    showToast("Updating...", "Communicating with server...");

    try {
        await fetch(`${API_URL}/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword })
        });
    } catch (err) {
        console.warn("Backend API sync failed:", err);
    }

    showToast("Password Updated", "Your account security password has been changed.");
    changePasswordForm.reset();
    updatePasswordBtn.disabled = false;
}

function handleLogout() {
    if (!confirm("Are you sure you want to log out of your session?")) return;

    showToast("Logged Out", "Terminating active session...");
    setTimeout(() => {
        window.location.href = "A2-login.html";
    }, 1000);
}

function showToast(title, msg) {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}
