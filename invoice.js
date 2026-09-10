/* =====================================================
   AQUAVENTURE INVOICE MANAGEMENT JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/invoices";

const tableBody = document.getElementById("invoiceTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const generateInvoiceBtn = document.getElementById("generateInvoiceBtn");

const generateModal = document.getElementById("generateModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const generateForm = document.getElementById("generateForm");
const modalTitle = document.getElementById("modalTitle");

const invoiceIdInput = document.getElementById("invoiceId");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const customerNameInput = document.getElementById("customerName");
const issueDateInput = document.getElementById("issueDate");
const dueDateInput = document.getElementById("dueDate");
const totalAmountInput = document.getElementById("totalAmount");
const paymentStatusSelect = document.getElementById("paymentStatus");

// Stats
const totalInvoicesEl = document.getElementById("totalInvoices");
const totalRevenueEl = document.getElementById("totalRevenue");
const paidInvoicesEl = document.getElementById("paidInvoices");
const pendingInvoicesEl = document.getElementById("pendingInvoices");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

let invoices = [];

document.addEventListener("DOMContentLoaded", () => {
    loadInvoices();
    setupEventListeners();
});

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener("input", filterAndRenderInvoices);
    if (statusFilter) statusFilter.addEventListener("change", filterAndRenderInvoices);
    if (refreshBtn) refreshBtn.addEventListener("click", loadInvoices);
    if (generateInvoiceBtn) generateInvoiceBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (generateForm) generateForm.addEventListener("submit", handleFormSubmit);

    if (tableBody) {
        tableBody.addEventListener("click", (e) => {
            const actionBtn = e.target.closest(".action-btn");
            if (!actionBtn) return;
            const id = Number(actionBtn.dataset.id);
            const action = actionBtn.dataset.action;

            if (action === "edit") openEditModal(id);
            else if (action === "delete") deleteInvoice(id);
            else if (action === "view") viewInvoiceDetails(id);
        });
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

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            showToast("Logged Out", "Redirecting...");
            setTimeout(() => window.location.href = "index.html", 1000);
        });
    }
}

async function loadInvoices() {
    showLoading(true);
    try {
        const res = await fetch(`${API_URL}/all`);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        invoices = extractData(data);
    } catch (e) {
        console.warn("Backend offline:", e);
        invoices = [];
    } finally {
        showLoading(false);
        filterAndRenderInvoices();
    }
}

function extractData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.result)) return res.result;
    return [];
}

function filterAndRenderInvoices() {
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusVal = statusFilter ? statusFilter.value : "ALL";

    const filtered = invoices.filter(inv => {
        const code = (inv.invoiceNumber || inv.invoiceCode || "").toLowerCase();
        const cust = (inv.customerName || "").toLowerCase();
        const status = (inv.paymentStatus || inv.status || "UNPAID").toUpperCase();

        const matchesTerm = code.includes(term) || cust.includes(term);
        const matchesStatus = statusVal === "ALL" || status === statusVal;
        return matchesTerm && matchesStatus;
    });

    renderInvoices(filtered);
    updateStats(invoices);
}

function renderInvoices(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
        emptyState.style.display = "flex";
        return;
    }
    emptyState.style.display = "none";

    data.forEach(inv => {
        const row = document.createElement("tr");
        const status = (inv.paymentStatus || inv.status || "UNPAID").toUpperCase();
        const code = inv.invoiceNumber || inv.invoiceCode || `INV-${inv.invoiceId}`;
        const amt = Number(inv.totalAmount || inv.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

        row.innerHTML = `
            <td>
                <div>
                    <span class="invoice-code-badge">${escapeHtml(code)}</span>
                    <span class="invoice-sub-id">ID #${inv.invoiceId}</span>
                </div>
            </td>
            <td><strong>${escapeHtml(inv.customerName || "Customer")}</strong></td>
            <td>${escapeHtml(inv.issueDate || "2026-08-01")}</td>
            <td>${escapeHtml(inv.dueDate || "2026-08-15")}</td>
            <td><strong>Rs. ${amt}</strong></td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">
                    <i class="fa-solid ${getStatusIcon(status)}"></i>
                    ${status}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" data-id="${inv.invoiceId}" data-action="view" title="Print/View Invoice">
                        <i class="fa-solid fa-file-pdf"></i>
                    </button>
                    <button class="action-btn view" data-id="${inv.invoiceId}" data-action="edit" title="Edit Invoice">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete" data-id="${inv.invoiceId}" data-action="delete" title="Delete Invoice">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getStatusIcon(status) {
    switch (status) {
        case "PAID": return "fa-check";
        case "OVERDUE": return "fa-triangle-exclamation";
        default: return "fa-clock";
    }
}

function updateStats(list) {
    let totalAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;

    list.forEach(inv => {
        const amt = Number(inv.totalAmount || inv.amount || 0);
        const status = (inv.paymentStatus || inv.status || "").toUpperCase();
        totalAmt += amt;
        if (status === "PAID") paidCount++;
        else pendingCount++;
    });

    if (totalInvoicesEl) totalInvoicesEl.textContent = list.length;
    if (totalRevenueEl) totalRevenueEl.textContent = `Rs. ${totalAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    if (paidInvoicesEl) paidInvoicesEl.textContent = paidCount;
    if (pendingInvoicesEl) pendingInvoicesEl.textContent = pendingCount;
}

function openAddModal() {
    invoiceIdInput.value = "";
    generateForm.reset();
    issueDateInput.value = new Date().toISOString().split("T")[0];
    modalTitle.textContent = "Generate Invoice";
    generateModal.classList.add("active");
}

function openEditModal(id) {
    const inv = invoices.find(item => item.invoiceId === id);
    if (!inv) return;

    invoiceIdInput.value = inv.invoiceId;
    invoiceNumberInput.value = inv.invoiceNumber || inv.invoiceCode || "";
    customerNameInput.value = inv.customerName || "";
    issueDateInput.value = inv.issueDate || "";
    dueDateInput.value = inv.dueDate || "";
    totalAmountInput.value = inv.totalAmount || inv.amount || "";
    paymentStatusSelect.value = (inv.paymentStatus || inv.status || "UNPAID").toUpperCase();

    modalTitle.textContent = "Edit Invoice";
    generateModal.classList.add("active");
}

function closeModal() {
    generateModal.classList.remove("active");
}

function viewInvoiceDetails(id) {
    const inv = invoices.find(item => item.invoiceId === id);
    if (!inv) return;
    showToast("Invoice Summary", `Ref: ${inv.invoiceNumber || inv.invoiceId} - Rs. ${inv.totalAmount} (${inv.paymentStatus})`);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = invoiceIdInput.value ? Number(invoiceIdInput.value) : null;

    const payload = {
        invoiceId: id || Date.now(),
        invoiceNumber: invoiceNumberInput.value.trim(),
        customerName: customerNameInput.value.trim(),
        issueDate: issueDateInput.value,
        dueDate: dueDateInput.value,
        totalAmount: Number(totalAmountInput.value),
        paymentStatus: paymentStatusSelect.value
    };

    if (id) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        const idx = invoices.findIndex(i => i.invoiceId === id);
        if (idx !== -1) invoices[idx] = payload;
        showToast("Invoice Updated", `Invoice ${payload.invoiceNumber} saved.`);
    } else {
        try {
            await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        invoices.unshift(payload);
        showToast("Invoice Issued", `Invoice ${payload.invoiceNumber} generated successfully.`);
    }

    closeModal();
    filterAndRenderInvoices();
}

async function deleteInvoice(id) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (err) { console.warn("Backend request failed:", err); }

    invoices = invoices.filter(i => i.invoiceId !== id);
    filterAndRenderInvoices();
    showToast("Invoice Deleted", "Invoice record removed.");
}

function showLoading(isLoading) {
    if (loadingState) loadingState.style.display = isLoading ? "flex" : "none";
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