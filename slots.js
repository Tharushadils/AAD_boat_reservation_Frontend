const API_URL = "http://localhost:8080/api/slots";

let slots = [];
let editingId = null;

/* =========================
   ELEMENTS
========================= */
const tableBody = document.getElementById("slotTableBody");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");

const filterDate = document.getElementById("filterDate");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const statusFilter = document.getElementById("statusFilter");

const totalSlots = document.getElementById("totalSlots");
const availableSlots = document.getElementById("availableSlots");
const totalSeats = document.getElementById("totalSeats");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const slotForm = document.getElementById("slotForm");

const slotId = document.getElementById("slotId");
const slotDate = document.getElementById("slotDate");
const slotTime = document.getElementById("slotTime");
const noOfSeats = document.getElementById("noOfSeats");
const slotStatus = document.getElementById("slotStatus");
const statusGroup = document.getElementById("statusGroup");
const submitBtn = document.getElementById("submitBtn");

const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

/* =========================
   LOAD DATA
========================= */
async function loadSlots() {
    showLoading(true);
    try {
        let url = `${API_URL}/all`;

        if (filterDate.value) {
            url = `${API_URL}/available?date=${filterDate.value}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();
        console.log("Backend Raw Response:", result);

        // Data Extraction Handling (result.body / result.data / result)
        if (Array.isArray(result.body)) {
            slots = result.body;
        } else if (Array.isArray(result.data)) {
            slots = result.data;
        } else if (Array.isArray(result)) {
            slots = result;
        } else {
            slots = [];
        }

        console.log("Parsed Slots Array:", slots);

        updateStats();
        renderSlots();
    } catch (error) {
        console.error("Error loading slots:", error);
        showToast("Error", "Unable to fetch slot schedule.", true);
    } finally {
        showLoading(false);
    }
}

/* =========================
   RENDER TABLE
========================= */
function renderSlots() {
    const selectedStatus = statusFilter.value;

    const filtered = slots.filter(slot => {
        const status = slot.status || "AVAILABLE";
        return selectedStatus === "ALL" || status === selectedStatus;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableBody.style.display = "none";
        emptyState.style.display = "flex";
        return;
    }

    tableBody.style.display = "";
    emptyState.style.display = "none";

    filtered.forEach(slot => {
        const id = slot.id || slot.slotId;
        const row = document.createElement("tr");
        const statusValue = slot.status || "AVAILABLE";
        const statusClass = statusValue.toLowerCase();

        // Dropdown menu එක වෙනුවට Direct Edit/Delete Icons
        row.innerHTML = `
            <td><strong>#${id}</strong></td>
            <td>${escapeHtml(slot.date)}</td>
            <td><strong>${formatTime(slot.time)}</strong></td>
            <td><span class="seat-badge">${slot.noOfSeats} Seats</span></td>
            <td><span class="status ${statusClass}">${escapeHtml(statusValue)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn edit-btn" onclick="editSlot(${id})" title="Edit Slot">✏️</button>
                    <button class="icon-btn delete-btn" onclick="deleteSlot(${id})" title="Delete Slot">🗑️</button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

/* =========================
   CREATE & UPDATE
========================= */
async function saveSlot() {
    const dto = {
        date: slotDate.value,
        time: formatTimeForBackend(slotTime.value),
        noOfSeats: Number(noOfSeats.value)
    };

    if (editingId) {
        dto.id = Number(slotId.value);
        dto.status = slotStatus.value;
    }

    if (!dto.date || !dto.time || !dto.noOfSeats) {
        showToast("Validation", "Please fill all required fields correctly.", true);
        return;
    }

    try {
        setSubmitLoading(true);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${API_URL}/${editingId}` : API_URL;

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        closeModal();
        showToast(
            editingId ? "Slot Updated" : "Slot Saved",
            editingId ? "Slot updated successfully." : "New slot added successfully."
        );

        await loadSlots();

    } catch (error) {
        console.error("Save slot error:", error);
        showToast("Error", "Failed to save slot details.", true);
    } finally {
        setSubmitLoading(false);
    }
}

/* =========================
   EDIT & DELETE
========================= */
function editSlot(id) {
    const slot = slots.find(item => Number(item.id || item.slotId) === Number(id));
    if (!slot) return;

    editingId = id;
    modalTitle.textContent = "Edit Time Slot";
    submitBtn.textContent = "Save Changes";
    statusGroup.style.display = "block";

    slotId.value = slot.id || slot.slotId;
    slotDate.value = slot.date || "";
    
    // Time formatting handling (String හෝ Array ලෙස එන විට)
    if (typeof slot.time === "string") {
        slotTime.value = slot.time.substring(0, 5);
    } else if (Array.isArray(slot.time)) {
        const h = String(slot.time[0]).padStart(2, '0');
        const m = String(slot.time[1]).padStart(2, '0');
        slotTime.value = `${h}:${m}`;
    } else {
        slotTime.value = "";
    }

    noOfSeats.value = slot.noOfSeats || "";
    slotStatus.value = slot.status || "AVAILABLE";

    modalOverlay.classList.add("show");
}

async function deleteSlot(id) {
    if (!confirm(`Are you sure you want to delete Slot #${id}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        showToast("Slot Deleted", "The time slot was marked as deleted.");
        await loadSlots();
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Error", "Could not delete the slot.", true);
    }
}

/* =========================
   MODAL CONTROLS
========================= */
function openAddModal() {
    editingId = null;
    slotForm.reset();
    slotId.value = "";
    statusGroup.style.display = "none";

    modalTitle.textContent = "Add New Time Slot";
    submitBtn.textContent = "Save Slot";

    modalOverlay.classList.add("show");
}

function closeModal() {
    modalOverlay.classList.remove("show");
    slotForm.reset();
    editingId = null;
}

/* =========================
   EVENT LISTENERS
========================= */
document.getElementById("openAddModal").addEventListener("click", openAddModal);
document.getElementById("emptyAddBtn").addEventListener("click", openAddModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});

slotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSlot();
});

filterDate.addEventListener("change", loadSlots);

clearFilterBtn.addEventListener("click", () => {
    filterDate.value = "";
    loadSlots();
});

statusFilter.addEventListener("change", renderSlots);

/* =========================
   STATS & HELPERS
========================= */
function updateStats() {
    totalSlots.textContent = slots.length;

    const available = slots.filter(s => (s.status || "AVAILABLE") === "AVAILABLE");
    availableSlots.textContent = available.length;

    const seats = available.reduce((sum, s) => sum + Number(s.noOfSeats || 0), 0);
    totalSeats.textContent = seats;
}

document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

function showLoading(show) {
    loading.style.display = show ? "flex" : "none";
    if (show) {
        tableBody.style.display = "none";
        emptyState.style.display = "none";
    }
}

function setSubmitLoading(loadingState) {
    submitBtn.disabled = loadingState;
    submitBtn.textContent = loadingState ? "Saving..." : (editingId ? "Save Changes" : "Save Slot");
}

function showToast(title, message, error = false) {
    toastTitle.textContent = title;
    toastMessage.textContent = message;

    const icon = toast.querySelector(".toast-icon");
    icon.textContent = error ? "!" : "✓";
    icon.style.background = error ? "#fff0f0" : "#e6f8ef";
    icon.style.color = error ? "#e25555" : "#18a66a";

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function formatTime(timeVal) {
    if (!timeVal) return "--:--";
    let hours, minutes;

    if (Array.isArray(timeVal)) {
        hours = timeVal[0];
        minutes = timeVal[1];
    } else if (typeof timeVal === "string") {
        const parts = timeVal.split(":");
        hours = parseInt(parts[0], 10);
        minutes = parts[1];
    } else {
        return "--:--";
    }

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${hours}:${formattedMinutes} ${ampm}`;
}

function formatTimeForBackend(timeStr) {
    if (!timeStr) return null;
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
}

function escapeHtml(val) {
    if (!val) return "";
    return String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", loadSlots);