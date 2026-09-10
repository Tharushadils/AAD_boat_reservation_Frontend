/* =====================================================
   AQUAVENTURE RESERVATION MANAGEMENT
   ===================================================== */

const API_BASE_URL = "http://localhost:8080/api/reservations";

let reservations = [];
let editingReservationId = null;
let toastTimeout = null;

/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const tableBody = document.getElementById("reservationTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const addReservationBtn = document.getElementById("addReservationBtn");
const reservationModal = document.getElementById("reservationModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const reservationForm = document.getElementById("reservationForm");
const modalTitle = document.getElementById("modalTitle");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

/* Form Inputs */
const reservationIdInput = document.getElementById("reservationId");
const userIdInput = document.getElementById("userId");
const boatIdInput = document.getElementById("boatId");
const slotIdInput = document.getElementById("slotId");
const reservationDateInput = document.getElementById("reservationDate");
const startDockIdInput = document.getElementById("startDockId");
const endDockIdInput = document.getElementById("endDockId");
const noOfSeatsInput = document.getElementById("noOfSeats"); // Input element
const reservationStatusInput = document.getElementById("reservationStatus");

/* =====================================================
   AUTH HEADER HELPER
   ===================================================== */
function getAuthHeaders() {
    const token = localStorage.getItem("JWT") || localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

/* =====================================================
   INITIALIZATION
   ===================================================== */

function init() {
    setupEventListeners();
    loadReservations();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

/* =====================================================
   EVENT LISTENERS SETUP
   ===================================================== */

function setupEventListeners() {
    if (addReservationBtn) addReservationBtn.addEventListener("click", openCreateModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    
    if (reservationModal) {
        reservationModal.addEventListener("click", (e) => {
            if (e.target === reservationModal) closeModal();
        });
    }

    if (reservationForm) reservationForm.addEventListener("submit", handleFormSubmit);
    if (searchInput) searchInput.addEventListener("input", () => renderReservations(reservations));
    if (statusFilter) statusFilter.addEventListener("change", () => renderReservations(reservations));
    if (refreshBtn) refreshBtn.addEventListener("click", loadReservations);
    if (tableBody) tableBody.addEventListener("click", handleTableClick);

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            sidebar.classList.toggle("open");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("JWT");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        });
    }

    if (backToTop) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) backToTop.classList.add("show");
            else backToTop.classList.remove("show");
        });

        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

/* =====================================================
   TABLE ACTION DELEGATION
   ===================================================== */

function handleTableClick(event) {
    const actionBtn = event.target.closest(".action-btn");
    if (!actionBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const id = Number(actionBtn.dataset.id);
    const action = actionBtn.dataset.action;

    if (!id || isNaN(id)) return;

    if (action === "view") viewReservation(id);
    else if (action === "edit") editReservation(id);
    else if (action === "delete") deleteReservation(id);
}

/* =====================================================
   MODAL CONTROLS
   ===================================================== */

function openModal() {
    if (!reservationModal) return;
    reservationModal.classList.add("active", "show");
    reservationModal.style.display = "flex";
}

function closeModal() {
    if (!reservationModal) return;
    reservationModal.classList.remove("active", "show");
    reservationModal.style.display = "none";
    editingReservationId = null;

    if (reservationForm) reservationForm.reset();
}

/* NEW RESERVATION (CREATE) */
function openCreateModal() {
    editingReservationId = null;
    if (modalTitle) modalTitle.textContent = "New Reservation";
    if (reservationForm) reservationForm.reset();
    if (reservationIdInput) reservationIdInput.value = "";

    if (reservationDateInput) {
        reservationDateInput.value = new Date().toISOString().split("T")[0];
    }
    // Default value for Create
    if (noOfSeatsInput) {
        noOfSeatsInput.value = 1;
    }
    if (reservationStatusInput) {
        reservationStatusInput.value = "PENDING";
    }

    openModal();
}

/* EDIT RESERVATION (UPDATE) */
async function editReservation(id) {
    try {
        const reservation = await getReservationById(id);
        if (!reservation) {
            showToast("Error", "Reservation details not found.", true);
            return;
        }

        editingReservationId = id;

        if (modalTitle) modalTitle.textContent = `Edit Reservation #${id}`;
        if (reservationIdInput) reservationIdInput.value = reservation.reservationId || reservation.id || id;
        if (userIdInput) userIdInput.value = reservation.userId ?? "";
        if (boatIdInput) boatIdInput.value = reservation.boatId ?? "";
        if (slotIdInput) slotIdInput.value = reservation.slotId ?? "";
        if (reservationDateInput) reservationDateInput.value = reservation.reservationDate ?? "";
        if (startDockIdInput) startDockIdInput.value = reservation.startDockId ?? "";
        if (endDockIdInput) endDockIdInput.value = reservation.endDockId ?? "";
        
        // Load existing seats count for Update
        if (noOfSeatsInput) {
            noOfSeatsInput.value = reservation.noOfSeats ?? 1;
        }
        
        if (reservationStatusInput) {
            reservationStatusInput.value = String(reservation.status || "PENDING").toUpperCase();
        }

        openModal();
    } catch (error) {
        console.error("Edit reservation error:", error);
        showToast("Error", "Unable to load reservation for editing.", true);
    }
}

/* =====================================================
   LOAD ALL RESERVATIONS
   ===================================================== */

async function loadReservations() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/all`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to load reservations: HTTP ${response.status}`);
        }

        const result = await response.json();
        reservations = extractReservationData(result);

        renderReservations(reservations);
        updateStatistics(reservations);

    } catch (error) {
        console.error("Failed to load reservations:", error);
        showToast("Notice", "Unable to reach server. Please ensure backend is running.", true);
        reservations = [];
        renderReservations([]);
        updateStatistics([]);
    } finally {
        showLoading(false);
    }
}

function extractReservationData(result) {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.body)) return result.body;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.result)) return result.result;
    if (Array.isArray(result.payload)) return result.payload;
    return [];
}

/* =====================================================
   RENDER TABLE
   ===================================================== */

function renderReservations(data) {
    const tBody = document.getElementById("reservationTableBody") || tableBody;
    const emptyEl = document.getElementById("emptyState") || emptyState;
    if (!tBody) return;

    tBody.innerHTML = "";

    const list = Array.isArray(data) ? data : [];
    const filtered = applyFilters(list);

    if (filtered.length === 0) {
        if (emptyEl) emptyEl.style.display = "flex";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    filtered.forEach(reservation => {
        const row = createReservationRow(reservation);
        tBody.appendChild(row);
    });
}

function createReservationRow(reservation) {
    const row = document.createElement("tr");

    const id = reservation.reservationId ?? reservation.id ?? "-";
    const status = String(reservation.status || "PENDING").toUpperCase();

    const startDock = reservation.startDockName || (reservation.startDockId ? `Dock #${reservation.startDockId}` : "-");
    const endDock = reservation.endDockName || (reservation.endDockId ? `Dock #${reservation.endDockId}` : "-");
    const routeDisplay = `${escapeHtml(startDock)} → ${escapeHtml(endDock)}`;

    const dateDisplay = reservation.reservationDate || "-";
    const userName = reservation.userName || (reservation.userId ? `User #${reservation.userId}` : "-");
    const boatName = reservation.boatName || (reservation.boatId ? `Boat #${reservation.boatId}` : "-");
    const slotText = reservation.slotTime ? `${reservation.slotTime}` : (reservation.slotId ? `Slot #${reservation.slotId}` : "-");
    const seats = reservation.noOfSeats || 1;

    row.innerHTML = `
        <td><span class="reservation-id">#${id}</span></td>
        <td>
            <div class="customer-info">
                <div class="customer-avatar">${getInitials(userName)}</div>
                <span class="customer-name">${escapeHtml(userName)}</span>
            </div>
        </td>
        <td><span class="boat-name">${escapeHtml(boatName)}</span></td>
        <td><span class="slot-id">${escapeHtml(slotText)}</span></td>
        <td><span class="seats-count">${seats}</span></td>
        <td><span class="schedule-date">${escapeHtml(dateDisplay)}</span></td>
        <td><span class="route-name">${routeDisplay}</span></td>
        <td><span class="status-badge ${status.toLowerCase()}">${formatStatus(status)}</span></td>
        <td>
            <div class="action-btns">
                <button class="action-btn view" title="View Details" data-action="view" data-id="${id}"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn edit" title="Edit Reservation" data-action="edit" data-id="${id}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" title="Cancel Reservation" data-action="delete" data-id="${id}"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </td>
    `;

    return row;
}

function applyFilters(data) {
    if (!Array.isArray(data)) return [];

    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedStatus = statusFilter ? statusFilter.value.toUpperCase() : "ALL";

    return data.filter(reservation => {
        const searchableText = `
            ${reservation.reservationId || ""} ${reservation.id || ""} ${reservation.userId || ""}
            ${reservation.userName || ""} ${reservation.boatId || ""} ${reservation.boatName || ""}
            ${reservation.startDockName || ""} ${reservation.endDockName || ""}
            ${reservation.reservationDate || ""} ${reservation.status || ""}
        `.toLowerCase();

        const matchesSearch = !search || searchableText.includes(search);
        const resStatus = String(reservation.status || "").toUpperCase();
        const matchesStatus = (selectedStatus === "ALL") || (resStatus === selectedStatus);

        return matchesSearch && matchesStatus;
    });
}

function updateStatistics(data) {
    const list = Array.isArray(data) ? data : [];
    const totalElement = document.getElementById("totalReservations");
    const confirmedElement = document.getElementById("confirmedCount");
    const pendingElement = document.getElementById("pendingCount");
    const cancelledElement = document.getElementById("cancelledCount");

    if (totalElement) totalElement.textContent = list.length;

    if (confirmedElement) confirmedElement.textContent = list.filter(r => String(r.status || "").toUpperCase() === "CONFIRMED").length;
    if (pendingElement) pendingElement.textContent = list.filter(r => String(r.status || "").toUpperCase() === "PENDING").length;
    if (cancelledElement) cancelledElement.textContent = list.filter(r => String(r.status || "").toUpperCase() === "CANCELLED").length;
}

async function getReservationById(id) {
    const found = reservations.find(r => Number(r.reservationId || r.id) === Number(id));
    if (found) return found;

    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error(`Failed to get reservation: ${response.status}`);
    const result = await response.json();
    return result.body || result.data || result.result || result;
}

async function viewReservation(id) {
    try {
        const reservation = await getReservationById(id);
        if (!reservation) {
            showToast("Error", "Reservation not found.", true);
            return;
        }

        const startDock = reservation.startDockName || (reservation.startDockId ? `Dock #${reservation.startDockId}` : "N/A");
        const endDock = reservation.endDockName || (reservation.endDockId ? `Dock #${reservation.endDockId}` : "N/A");
        const user = reservation.userName || (reservation.userId ? `User #${reservation.userId}` : "N/A");
        const boat = reservation.boatName || (reservation.boatId ? `Boat #${reservation.boatId}` : "N/A");
        const slot = reservation.slotTime ? `${reservation.slotTime}` : (reservation.slotId ? `Slot #${reservation.slotId}` : "N/A");

        alert(
            `=== RESERVATION DETAILS ===\n\n` +
            `Reservation ID: #${reservation.reservationId || reservation.id || id}\n` +
            `Customer: ${user}\n` +
            `Boat: ${boat}\n` +
            `Slot: ${slot}\n` +
            `Seats: ${reservation.noOfSeats || 1}\n` +
            `Date: ${reservation.reservationDate || "N/A"}\n` +
            `Route: ${startDock} → ${endDock}\n` +
            `Status: ${formatStatus(reservation.status || "PENDING")}`
        );
    } catch (error) {
        console.error("View reservation error:", error);
        showToast("Error", "Unable to view reservation details.", true);
    }
}

/* =====================================================
   SAVE / UPDATE RESERVATION
   ===================================================== */

async function handleFormSubmit(event) {
    event.preventDefault();

    const uId = Number(userIdInput.value);
    const bId = Number(boatIdInput.value);
    const sDockId = Number(startDockIdInput.value);
    const eDockId = Number(endDockIdInput.value);
    const seats = noOfSeatsInput && noOfSeatsInput.value ? Number(noOfSeatsInput.value) : 1;
    const sId = slotIdInput && slotIdInput.value ? Number(slotIdInput.value) : null;
    const resDate = reservationDateInput ? reservationDateInput.value.trim() : null;
    const status = reservationStatusInput ? reservationStatusInput.value : "PENDING";

    if (!uId || uId <= 0) return showToast("Validation Error", "Please enter a valid User ID.", true);
    if (!bId || bId <= 0) return showToast("Validation Error", "Please enter a valid Boat ID.", true);
    if (!sDockId || sDockId <= 0) return showToast("Validation Error", "Please enter a valid Start Dock ID.", true);
    if (!eDockId || eDockId <= 0) return showToast("Validation Error", "Please enter a valid End Dock ID.", true);
    if (!seats || seats <= 0) return showToast("Validation Error", "Please enter a valid number of seats.", true);
    if (!resDate) return showToast("Validation Error", "Please select a reservation date.", true);

    const payload = {
        reservationId: editingReservationId ? Number(editingReservationId) : null,
        userId: uId,
        boatId: bId,
        slotId: sId,
        reservationDate: resDate,
        startDockId: sDockId,
        endDockId: eDockId,
        noOfSeats: seats, // Sending updated/created seats value
        status: status
    };

    const isEdit = Boolean(editingReservationId);
    const method = isEdit ? "PUT" : "POST";

    try {
        const response = await fetch(API_BASE_URL, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMsg = `Server returned ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.message) errorMsg = errData.message;
            } catch (_) {}
            throw new Error(errorMsg);
        }

        closeModal();
        showToast("Success", isEdit ? "Reservation updated successfully." : "Reservation created successfully.");
        await loadReservations();

    } catch (error) {
        console.error("Save reservation error:", error);
        showToast("Save Failed", error.message || "Unable to save reservation.", true);
    }
}

/* =====================================================
   DELETE RESERVATION
   ===================================================== */

async function deleteReservation(id) {
    if (!id || isNaN(id)) return showToast("Error", "Invalid Reservation ID.", true);
    if (!confirm(`Are you sure you want to cancel Reservation #${id}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            let errorMsg = `Server returned ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.message) errorMsg = errData.message;
            } catch (_) {}
            throw new Error(errorMsg);
        }

        showToast("Success", `Reservation #${id} has been cancelled.`);
        await loadReservations();

    } catch (error) {
        console.error("Delete reservation error:", error);
        showToast("Cancellation Failed", error.message || "Unable to cancel reservation.", true);
    }
}

/* =====================================================
   UTILITY FUNCTIONS
   ===================================================== */

function showToast(title, message, isError = false) {
    const toastEl = document.getElementById("toast") || toast;
    if (!toastEl) return;

    const titleEl = document.getElementById("toastTitle") || toastTitle;
    const msgEl = document.getElementById("toastMessage") || toastMessage;
    const iconEl = document.getElementById("toastIcon") || toastIcon;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (iconEl) iconEl.innerHTML = isError ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-check"></i>';

    if (isError) toastEl.classList.add("error");
    else toastEl.classList.remove("error");

    toastEl.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

function showLoading(show) {
    const loadingEl = document.getElementById("loadingState") || loadingState;
    if (loadingEl) loadingEl.style.display = show ? "flex" : "none";
}

function formatStatus(status) {
    if (!status) return "Pending";
    return String(status).toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function getInitials(name) {
    if (!name) return "U";
    return String(name).trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join("").toUpperCase() || "U";
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.openCreateModal = openCreateModal;
window.editReservation = editReservation;
window.deleteReservation = deleteReservation;
window.viewReservation = viewReservation;
window.closeModal = closeModal;