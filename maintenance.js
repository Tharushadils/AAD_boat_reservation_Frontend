/* =====================================================
   AQUAVENTURE MAINTENANCE LOGS MANAGEMENT JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/maintenance";

const tableBody = document.getElementById("maintenanceTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addMaintenanceBtn = document.getElementById("addMaintenanceBtn");

const maintenanceModal = document.getElementById("maintenanceModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const maintenanceForm = document.getElementById("maintenanceForm");
const modalTitle = document.getElementById("modalTitle");

const logIdInput = document.getElementById("logId");
const boatNameInput = document.getElementById("boatName");
const technicianInput = document.getElementById("technician");
const serviceDateInput = document.getElementById("serviceDate");
const costInput = document.getElementById("cost");
const logStatusSelect = document.getElementById("logStatus");
const issueDescriptionInput = document.getElementById("issueDescription");

// Stats
const totalLogsEl = document.getElementById("totalLogs");
const inProgressLogsEl = document.getElementById("inProgressLogs");
const scheduledLogsEl = document.getElementById("scheduledLogs");
const totalExpenseEl = document.getElementById("totalExpense");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

let maintenanceLogs = [];

document.addEventListener("DOMContentLoaded", () => {
    loadMaintenanceLogs();
    setupEventListeners();
});

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener("input", filterAndRenderLogs);
    if (statusFilter) statusFilter.addEventListener("change", filterAndRenderLogs);
    if (refreshBtn) refreshBtn.addEventListener("click", loadMaintenanceLogs);
    if (addMaintenanceBtn) addMaintenanceBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (maintenanceForm) maintenanceForm.addEventListener("submit", handleFormSubmit);

    if (tableBody) {
        tableBody.addEventListener("click", (e) => {
            const actionBtn = e.target.closest(".action-btn");
            if (!actionBtn) return;
            const id = Number(actionBtn.dataset.id);
            const action = actionBtn.dataset.action;

            if (action === "edit") openEditModal(id);
            else if (action === "delete") deleteLog(id);
            else if (action === "view") viewLogDetails(id);
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

async function loadMaintenanceLogs() {
    showLoading(true);
    try {
        const res = await fetch(`${API_URL}/all`);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        maintenanceLogs = extractData(data);
    } catch (e) {
        console.warn("Backend offline:", e);
        maintenanceLogs = [];
    } finally {
        showLoading(false);
        filterAndRenderLogs();
    }
}

function extractData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.result)) return res.result;
    return [];
}

function filterAndRenderLogs() {
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusVal = statusFilter ? statusFilter.value : "ALL";

    const filtered = maintenanceLogs.filter(log => {
        const boat = (log.boatName || "").toLowerCase();
        const tech = (log.technician || log.performedBy || "").toLowerCase();
        const desc = (log.issueDescription || log.description || "").toLowerCase();
        const status = (log.status || "IN_PROGRESS").toUpperCase();

        const matchesTerm = boat.includes(term) || tech.includes(term) || desc.includes(term);
        const matchesStatus = statusVal === "ALL" || status === statusVal;
        return matchesTerm && matchesStatus;
    });

    renderLogs(filtered);
    updateStats(maintenanceLogs);
}

function renderLogs(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
        emptyState.style.display = "flex";
        return;
    }
    emptyState.style.display = "none";

    data.forEach(log => {
        const row = document.createElement("tr");
        const status = (log.status || "IN_PROGRESS").toUpperCase();
        const cost = Number(log.cost || log.costAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

        row.innerHTML = `
            <td>
                <div>
                    <span class="log-boat-title">${escapeHtml(log.boatName || "Vessel")}</span>
                    <span class="log-sub-id">LOG #${log.logId}</span>
                </div>
            </td>
            <td>${escapeHtml(log.issueDescription || log.description || "Routine maintenance")}</td>
            <td><strong>${escapeHtml(log.technician || log.performedBy || "Technician")}</strong></td>
            <td>${escapeHtml(log.serviceDate || "2026-08-15")}</td>
            <td><strong>Rs. ${cost}</strong></td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">
                    <i class="fa-solid ${getStatusIcon(status)}"></i>
                    ${status.replace("_", " ")}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" data-id="${log.logId}" data-action="view" title="View Log">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn edit" data-id="${log.logId}" data-action="edit" title="Edit Log">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete" data-id="${log.logId}" data-action="delete" title="Delete Log">
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
        case "COMPLETED": return "fa-check";
        case "SCHEDULED": return "fa-calendar";
        default: return "fa-rotate";
    }
}

function updateStats(list) {
    let inProgress = 0;
    let scheduled = 0;
    let totalExpense = 0;

    list.forEach(log => {
        const s = (log.status || "").toUpperCase();
        const c = Number(log.cost || log.costAmount || 0);
        totalExpense += c;
        if (s === "IN_PROGRESS") inProgress++;
        else if (s === "SCHEDULED") scheduled++;
    });

    if (totalLogsEl) totalLogsEl.textContent = list.length;
    if (inProgressLogsEl) inProgressLogsEl.textContent = inProgress;
    if (scheduledLogsEl) scheduledLogsEl.textContent = scheduled;
    if (totalExpenseEl) totalExpenseEl.textContent = `Rs. ${totalExpense.toLocaleString()}`;
}

function openAddModal() {
    logIdInput.value = "";
    maintenanceForm.reset();
    serviceDateInput.value = new Date().toISOString().split("T")[0];
    modalTitle.textContent = "New Service Log";
    maintenanceModal.classList.add("active");
}

function openEditModal(id) {
    const log = maintenanceLogs.find(item => item.logId === id);
    if (!log) return;

    logIdInput.value = log.logId;
    boatNameInput.value = log.boatName || "";
    technicianInput.value = log.technician || log.performedBy || "";
    serviceDateInput.value = log.serviceDate || "";
    costInput.value = log.cost || log.costAmount || "";
    logStatusSelect.value = (log.status || "IN_PROGRESS").toUpperCase();
    issueDescriptionInput.value = log.issueDescription || log.description || "";

    modalTitle.textContent = "Edit Service Log";
    maintenanceModal.classList.add("active");
}

function closeModal() {
    maintenanceModal.classList.remove("active");
}

function viewLogDetails(id) {
    const log = maintenanceLogs.find(item => item.logId === id);
    if (!log) return;
    showToast("Maintenance Log", `${log.boatName}: ${log.issueDescription}`);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = logIdInput.value ? Number(logIdInput.value) : null;

    const payload = {
        logId: id || Date.now(),
        boatName: boatNameInput.value.trim(),
        technician: technicianInput.value.trim(),
        serviceDate: serviceDateInput.value,
        cost: Number(costInput.value),
        status: logStatusSelect.value,
        issueDescription: issueDescriptionInput.value.trim()
    };

    if (id) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        const idx = maintenanceLogs.findIndex(m => m.logId === id);
        if (idx !== -1) maintenanceLogs[idx] = payload;
        showToast("Log Updated", `Updated maintenance log for ${payload.boatName}.`);
    } else {
        try {
            await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        maintenanceLogs.unshift(payload);
        showToast("Log Recorded", `Maintenance log recorded for ${payload.boatName}.`);
    }

    closeModal();
    filterAndRenderLogs();
}

async function deleteLog(id) {
    if (!confirm("Are you sure you want to remove this service log?")) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (err) { console.warn("Backend request failed:", err); }

    maintenanceLogs = maintenanceLogs.filter(m => m.logId !== id);
    filterAndRenderLogs();
    showToast("Log Removed", "Service record removed.");
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