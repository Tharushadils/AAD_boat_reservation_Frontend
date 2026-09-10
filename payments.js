const API_URL = "http://localhost:8080/api/payments";

// ===============================
// GLOBAL VARIABLES
// ===============================
let payments = [];
let editingPaymentId = null;


// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    loadPayments();

    // ===============================
    // BUTTONS
    // ===============================
    const addPaymentBtn = document.getElementById("addPaymentBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");

    if (addPaymentBtn) {
        addPaymentBtn.addEventListener("click", openAddPaymentModal);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadPayments);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closePaymentModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener("click", closePaymentModal);
    }


    // ===============================
    // FORM
    // ===============================
    const paymentForm = document.getElementById("paymentForm");

    if (paymentForm) {
        paymentForm.addEventListener("submit", handlePaymentSubmit);
    }


    // ===============================
    // SEARCH
    // ===============================
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }


    // ===============================
    // METHOD FILTER
    // ===============================
    const methodFilter = document.getElementById("methodFilter");

    if (methodFilter) {
        methodFilter.addEventListener("change", applyFilters);
    }


    // ===============================
    // STATUS FILTER
    // ===============================
    const statusFilter = document.getElementById("statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }


    // ===============================
    // MODAL OUTSIDE CLICK
    // ===============================
    const paymentModal = document.getElementById("paymentModal");

    if (paymentModal) {
        paymentModal.addEventListener("click", (event) => {
            if (event.target === paymentModal) {
                closePaymentModal();
            }
        });
    }


    // ===============================
    // MOBILE MENU
    // ===============================
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            const sidebar = document.querySelector(".sidebar");
            if (sidebar) {
                sidebar.classList.toggle("active");
            }
        });
    }


    // ===============================
    // LOGOUT
    // ===============================
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("jwtToken");
            window.location.href = "login.html";
        });
    }

});


// =====================================================
// LOAD ALL PAYMENTS
// =====================================================
async function loadPayments() {

    showLoading(true);

    try {
        console.log("LOADING PAYMENTS...");

        const response = await fetch(`${API_URL}/all`, {
            method: "GET",
            headers: getHeaders()
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();

        console.log("API RESPONSE:", result);

        payments = extractResponseData(result);

        console.log("PAYMENTS:", payments);

        renderPayments(payments);
        updateStatistics(payments);

    } catch (error) {
        console.error("Failed to load payments:", error);
        payments = [];
        renderPayments([]);
        updateStatistics([]);

        showToast("Failed to load payments. Please check the backend.", "error");

    } finally {
        showLoading(false);
    }
}


// =====================================================
// EXTRACT RESPONSE DATA
// =====================================================
function extractResponseData(result) {
    if (Array.isArray(result)) {
        return result;
    }
    if (result && Array.isArray(result.body)) {
        return result.body;
    }
    if (result && Array.isArray(result.data)) {
        return result.data;
    }
    if (result && Array.isArray(result.result)) {
        return result.result;
    }
    return [];
}


// =====================================================
// RENDER PAYMENTS
// =====================================================
function renderPayments(data) {

    const tableBody = document.getElementById("paymentTableBody");
    const emptyState = document.getElementById("emptyState");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!data || data.length === 0) {
        if (emptyState) {
            emptyState.style.display = "block";
        }
        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    data.forEach(payment => {

        console.log(
            "PAYMENT:", payment.paymentId,
            "| TRANSACTION:", payment.transactionId,
            "| STATUS:", payment.paymentStatus
        );

        const row = document.createElement("tr");

        const paymentId = payment.paymentId ?? "-";
        const transactionId = payment.transactionId ?? "-";
        const reservationId = getReservationId(payment);
        const paymentMethod = payment.paymentMethod ?? "-";
        const paymentDate = payment.paymentDate ? formatDateTime(payment.paymentDate) : "-";
        const amountPaid = Number(payment.amountPaid ?? 0);
        const paymentStatus = payment.paymentStatus ?? "-";

        row.innerHTML = `
            <td>${paymentId}</td>
            <td><strong>${escapeHtml(transactionId)}</strong></td>
            <td>${escapeHtml(reservationId)}</td>
            <td>${escapeHtml(paymentMethod)}</td>
            <td>${paymentDate}</td>
            <td>
                Rs. ${amountPaid.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </td>
            <td>
                <span class="status-badge ${getStatusClass(paymentStatus)}">
                    ${escapeHtml(paymentStatus)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="action-btn view-btn" title="View" onclick="viewPaymentDetails(${paymentId})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="action-btn edit-btn" title="Edit" onclick="editPayment(${paymentId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="action-btn delete-btn" title="Delete" onclick="deletePayment(${paymentId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// =====================================================
// GET RESERVATION ID
// =====================================================
function getReservationId(payment) {
    if (!payment) return "-";

    if (payment.reservation) {
        if (typeof payment.reservation === "object") {
            return payment.reservation.reservationId ?? "-";
        }
        return payment.reservation;
    }

    if (payment.reservationId !== null && payment.reservationId !== undefined) {
        return payment.reservationId;
    }

    return "-";
}


// =====================================================
// OPEN ADD PAYMENT MODAL
// =====================================================
function openAddPaymentModal() {

    editingPaymentId = null;

    const modal = document.getElementById("paymentModal");
    const form = document.getElementById("paymentForm");
    const modalTitle = document.getElementById("modalTitle");

    if (form) {
        form.reset();
    }

    if (modalTitle) {
        modalTitle.textContent = "Add Payment";
    }

    const transactionInput = document.getElementById("transactionId");
    if (transactionInput) {
        transactionInput.value = "TXN-" + Math.floor(100000 + Math.random() * 900000);
    }

    const paymentDateInput = document.getElementById("paymentDate");
    if (paymentDateInput) {
        paymentDateInput.value = getCurrentDateTimeLocal();
    }

    const paymentMethod = document.getElementById("paymentMethod");
    if (paymentMethod) {
        paymentMethod.value = "CREDIT_CARD";
    }

    const paymentStatus = document.getElementById("paymentStatus");
    if (paymentStatus) {
        paymentStatus.value = "PENDING";
    }

    if (modal) {
        modal.classList.add("active");
    }
}


// =====================================================
// EDIT PAYMENT
// =====================================================
async function editPayment(paymentId) {

    try {
        console.log("EDIT PAYMENT:", paymentId);

        const response = await fetch(`${API_URL}/${paymentId}`, {
            method: "GET",
            headers: getHeaders()
        });

        console.log("EDIT RESPONSE STATUS:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();
        console.log("EDIT PAYMENT RESPONSE:", result);

        const payment = extractSingleResponseData(result);

        if (!payment) {
            throw new Error("Payment not found");
        }

        editingPaymentId = payment.paymentId ?? paymentId;

        const modal = document.getElementById("paymentModal");
        const modalTitle = document.getElementById("modalTitle");

        if (modalTitle) {
            modalTitle.textContent = "Edit Payment";
        }

        setInputValue("paymentId", payment.paymentId);
        setInputValue("transactionId", payment.transactionId);
        setInputValue("reservationId", getReservationId(payment));
        setInputValue("amountPaid", payment.amountPaid);
        setInputValue("paymentMethod", payment.paymentMethod);
        setInputValue("paymentStatus", payment.paymentStatus);

        const paymentDate = document.getElementById("paymentDate");
        if (paymentDate && payment.paymentDate) {
            paymentDate.value = convertToDateTimeLocal(payment.paymentDate);
        }

        if (modal) {
            modal.classList.add("active");
        }

    } catch (error) {
        console.error("Failed to load payment:", error);
        showToast("Failed to load payment details.", "error");
    }
}


// =====================================================
// HANDLE PAYMENT SUBMIT (ADD & EDIT)
// =====================================================
async function handlePaymentSubmit(event) {

    event.preventDefault();

    const transactionId = getInputValue("transactionId").trim();
    const reservationId = getInputValue("reservationId").trim();
    const amountPaid = getInputValue("amountPaid").trim();
    const paymentDate = getInputValue("paymentDate");
    const paymentMethod = getInputValue("paymentMethod");
    const paymentStatus = getInputValue("paymentStatus");

    if (!transactionId) {
        showToast("Please enter Transaction ID.", "error");
        return;
    }

    if (!reservationId) {
        showToast("Please enter Reservation ID.", "error");
        return;
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
        showToast("Please enter a valid amount.", "error");
        return;
    }

    if (!paymentDate) {
        showToast("Please select Payment Date.", "error");
        return;
    }

    if (!paymentMethod) {
        showToast("Please select Payment Method.", "error");
        return;
    }

    if (!paymentStatus) {
        showToast("Please select Payment Status.", "error");
        return;
    }

    // Payload includes flat reservationId and nested reservation object for compatibility
    const paymentData = {
        transactionId: transactionId,
        amountPaid: Number(amountPaid),
        paymentDate: paymentDate.length === 16 ? paymentDate + ":00" : paymentDate,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        reservationId: Number(reservationId),
        reservation: {
            reservationId: Number(reservationId)
        }
    };

    console.log("PAYMENT DATA:", paymentData);

    try {
        let response;

        if (!editingPaymentId) {
            console.log("CREATING NEW PAYMENT...");
            response = await fetch(API_URL, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(paymentData)
            });
        } else {
            console.log("UPDATING PAYMENT:", editingPaymentId);
            response = await fetch(`${API_URL}/${editingPaymentId}`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify(paymentData)
            });
        }

        console.log("SAVE RESPONSE STATUS:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("SAVE ERROR:", errorText);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();
        console.log("SAVE RESPONSE:", result);

        showToast(
            editingPaymentId ? "Payment updated successfully!" : "Payment saved successfully!",
            "success"
        );

        closePaymentModal();
        await loadPayments();

    } catch (error) {
        console.error("Failed to save payment:", error);
        showToast(
            editingPaymentId ? "Failed to update payment." : "Failed to save payment.",
            "error"
        );
    }
}


// =====================================================
// DELETE PAYMENT
// =====================================================
async function deletePayment(paymentId) {

    if (!confirm(`Are you sure you want to delete payment ID ${paymentId}?`)) {
        return;
    }

    try {
        console.log("DELETING PAYMENT:", paymentId);

        const response = await fetch(`${API_URL}/${paymentId}`, {
            method: "DELETE",
            headers: getHeaders()
        });

        console.log("DELETE RESPONSE STATUS:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        showToast("Payment deleted successfully!", "success");
        await loadPayments();

    } catch (error) {
        console.error("Failed to delete payment:", error);
        showToast("Failed to delete payment.", "error");
    }
}


// =====================================================
// EXTRACT SINGLE RESPONSE DATA
// =====================================================
function extractSingleResponseData(result) {
    if (!result) return null;

    if (result.body && !Array.isArray(result.body)) {
        return result.body;
    }
    if (result.data && !Array.isArray(result.data)) {
        return result.data;
    }
    if (result.result && !Array.isArray(result.result)) {
        return result.result;
    }
    if (result.paymentId !== undefined) {
        return result;
    }

    return null;
}


// =====================================================
// VIEW PAYMENT DETAILS
// =====================================================
function viewPaymentDetails(paymentId) {
    const payment = payments.find(p => Number(p.paymentId) === Number(paymentId));

    if (!payment) {
        showToast("Payment not found.", "error");
        return;
    }

    const reservationId = getReservationId(payment);
    const amount = Number(payment.amountPaid ?? 0).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const message = `
Payment ID: ${payment.paymentId}
Transaction ID: ${payment.transactionId ?? "-"}
Reservation ID: ${reservationId}
Amount Paid: Rs. ${amount}
Payment Method: ${payment.paymentMethod ?? "-"}
Payment Date: ${payment.paymentDate ? formatDateTime(payment.paymentDate) : "-"}
Payment Status: ${payment.paymentStatus ?? "-"}
`.trim();

    alert(message);
}


// =====================================================
// FILTERS
// =====================================================
function applyFilters() {

    const searchInput = document.getElementById("searchInput");
    const methodFilter = document.getElementById("methodFilter");
    const statusFilter = document.getElementById("statusFilter");

    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const method = methodFilter ? methodFilter.value : "";
    const status = statusFilter ? statusFilter.value : "";

    const filtered = payments.filter(payment => {
        const transactionId = String(payment.transactionId ?? "").toLowerCase();
        const reservationId = String(getReservationId(payment)).toLowerCase();
        const paymentMethod = String(payment.paymentMethod ?? "");
        const paymentStatus = String(payment.paymentStatus ?? "");

        const matchesSearch = !search || transactionId.includes(search) || reservationId.includes(search);
        const matchesMethod = !method || paymentMethod === method;
        const matchesStatus = !status || paymentStatus === status;

        return matchesSearch && matchesMethod && matchesStatus;
    });

    renderPayments(filtered);
}


// =====================================================
// UPDATE STATISTICS
// =====================================================
function updateStatistics(data) {

    const totalPayments = document.getElementById("totalPayments");
    const totalAmount = document.getElementById("totalAmount");
    const successfulPayments = document.getElementById("successfulPayments");
    const pendingPayments = document.getElementById("pendingPayments");

    let total = 0;
    let successful = 0;
    let pending = 0;

    data.forEach(payment => {
        total += Number(payment.amountPaid ?? 0);
        const status = String(payment.paymentStatus ?? "").toUpperCase();

        if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") {
            successful++;
        }

        if (status === "PENDING") {
            pending++;
        }
    });

    if (totalPayments) {
        totalPayments.textContent = data.length;
    }

    if (totalAmount) {
        totalAmount.textContent = "Rs. " + total.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    if (successfulPayments) {
        successfulPayments.textContent = successful;
    }

    if (pendingPayments) {
        pendingPayments.textContent = pending;
    }
}


// =====================================================
// CLOSE MODAL
// =====================================================
function closePaymentModal() {
    const modal = document.getElementById("paymentModal");
    if (modal) {
        modal.classList.remove("active");
    }
    editingPaymentId = null;
}


// =====================================================
// LOADING STATE
// =====================================================
function showLoading(show) {
    const loadingState = document.getElementById("loadingState");
    const tableBody = document.getElementById("paymentTableBody");

    if (show) {
        if (loadingState) loadingState.style.display = "block";
        if (tableBody) tableBody.style.display = "none";
    } else {
        if (loadingState) loadingState.style.display = "none";
        if (tableBody) tableBody.style.display = "";
    }
}


// =====================================================
// DATE / TIME UTILS
// =====================================================
function getCurrentDateTimeLocal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function convertToDateTimeLocal(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return String(dateString).substring(0, 16);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return String(dateString);
    }

    return date.toLocaleString("en-LK", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =====================================================
// STATUS CLASS
// =====================================================
function getStatusClass(status) {
    const value = String(status).toLowerCase();

    switch (value) {
        case "success":
        case "completed":
        case "paid":
            return "status-success";
        case "pending":
            return "status-pending";
        case "failed":
        case "cancelled":
        case "canceled":
            return "status-danger";
        default:
            return "status-default";
    }
}


// =====================================================
// DOM HELPERS
// =====================================================
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value ?? "";
    }
}

function getInputValue(id) {
    const element = document.getElementById(id);
    if (!element) return "";
    return element.value ?? "";
}


// =====================================================
// GET HEADERS
// =====================================================
function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };

    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}


// =====================================================
// ESCAPE HTML
// =====================================================
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// TOAST
// =====================================================
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");

    if (!toast) {
        console.log(`[${type}] ${message}`);
        return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}