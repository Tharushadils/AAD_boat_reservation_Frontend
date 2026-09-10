/* =====================================================
   AQUAVENTURE ADMIN DASHBOARD JS
   ===================================================== */

const API_BASE = "http://localhost:8080/api";

const dashTotalRevenue = document.getElementById("dashTotalRevenue");
const dashTotalReservations = document.getElementById("dashTotalReservations");
const dashTotalUsers = document.getElementById("dashTotalUsers");
const dashTotalDocks = document.getElementById("dashTotalDocks");
const dashReservationBody = document.getElementById("dashReservationBody");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardMetrics();
    setupEventListeners();
});

function setupEventListeners() {
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

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            showToast("Logged Out", "Redirecting...");
            setTimeout(() => window.location.href = "index.html", 1000);
        });
    }
}

async function loadDashboardMetrics() {
    // Fetch Reservations
    try {
        const res = await fetch(`${API_BASE}/reservations/all`);
        if (res.ok) {
            const data = await res.json();
            const list = extractArray(data);
            if (dashTotalReservations) dashTotalReservations.textContent = list.length;
            renderRecentReservations(list);

            let rev = 0;
            list.forEach(r => rev += Number(r.totalPrice || r.price || 0));
            if (dashTotalRevenue) dashTotalRevenue.textContent = `Rs. ${rev.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        }
    } catch (e) {
        console.warn("Reservations API offline:", e);
        if (dashTotalReservations) dashTotalReservations.textContent = "0";
        if (dashTotalRevenue) dashTotalRevenue.textContent = "Rs. 0.00";
        renderRecentReservations([]);
    }

    // Fetch Users
    try {
        const res = await fetch(`${API_BASE}/users/all`);
        if (res.ok) {
            const data = await res.json();
            const list = extractArray(data);
            if (dashTotalUsers) dashTotalUsers.textContent = list.length;
        }
    } catch (e) {
        console.warn("Users API offline:", e);
        if (dashTotalUsers) dashTotalUsers.textContent = "0";
    }

    // Fetch Docks
    try {
        const res = await fetch(`${API_BASE}/docks/all`);
        if (res.ok) {
            const data = await res.json();
            const list = extractArray(data);
            if (dashTotalDocks) dashTotalDocks.textContent = list.length;
        }
    } catch (e) {
        console.warn("Docks API offline:", e);
        if (dashTotalDocks) dashTotalDocks.textContent = "0";
    }
}

function extractArray(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.result)) return res.result;
    return [];
}

function renderRecentReservations(list) {
    if (!dashReservationBody) return;
    dashReservationBody.innerHTML = "";

    if (!list || list.length === 0) {
        dashReservationBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--muted); padding: 30px;">
                    No recent reservations found
                </td>
            </tr>
        `;
        return;
    }

    const recent = list.slice(0, 5);
    recent.forEach(r => {
        const row = document.createElement("tr");
        const code = r.reservationCode || `AV-${r.reservationId}`;
        const cust = r.userName || `User #${r.userId || "-"}`;
        const boat = r.boatName || `Boat #${r.boatId || "-"}`;
        const price = Number(r.totalPrice || r.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
        const status = (r.status || "PENDING").toUpperCase();

        row.innerHTML = `
            <td><strong>${escapeHtml(code)}</strong></td>
            <td>${escapeHtml(cust)}</td>
            <td>${escapeHtml(boat)}</td>
            <td><strong>Rs. ${price}</strong></td>
            <td>
                <span class="status-tag ${status.toLowerCase()}">${status}</span>
            </td>
        `;
        dashReservationBody.appendChild(row);
    });
}

function showToast(title, msg) {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
