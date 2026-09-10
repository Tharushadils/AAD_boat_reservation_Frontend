/* =====================================================
   AQUAVENTURE REVIEWS MANAGEMENT JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/reviews";

const reviewsGrid = document.getElementById("reviewsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const ratingFilter = document.getElementById("ratingFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addReviewBtn = document.getElementById("addReviewBtn");

const reviewModal = document.getElementById("reviewModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const reviewForm = document.getElementById("reviewForm");
const modalTitle = document.getElementById("modalTitle");

const reviewIdInput = document.getElementById("reviewId");
const customerNameInput = document.getElementById("customerName");
const boatNameInput = document.getElementById("boatName");
const ratingSelect = document.getElementById("rating");
const reviewDateInput = document.getElementById("reviewDate");
const commentInput = document.getElementById("comment");

// Stats
const avgRatingScoreEl = document.getElementById("avgRatingScore");
const totalReviewCountEl = document.getElementById("totalReviewCount");
const fiveStarCountEl = document.getElementById("fiveStarCount");
const reviewedBoatsCountEl = document.getElementById("reviewedBoatsCount");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

let reviews = [];

document.addEventListener("DOMContentLoaded", () => {
    loadReviews();
    setupEventListeners();
});

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener("input", filterAndRenderReviews);
    if (ratingFilter) ratingFilter.addEventListener("change", filterAndRenderReviews);
    if (refreshBtn) refreshBtn.addEventListener("click", loadReviews);
    if (addReviewBtn) addReviewBtn.addEventListener("click", openAddModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (reviewForm) reviewForm.addEventListener("submit", handleFormSubmit);

    if (reviewsGrid) {
        reviewsGrid.addEventListener("click", (e) => {
            const actionBtn = e.target.closest(".action-btn");
            if (!actionBtn) return;
            const id = Number(actionBtn.dataset.id);
            const action = actionBtn.dataset.action;

            if (action === "edit") openEditModal(id);
            else if (action === "delete") deleteReview(id);
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

async function loadReviews() {
    showLoading(true);
    try {
        const res = await fetch(`${API_URL}/all`);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        reviews = extractData(data);
    } catch (e) {
        console.warn("Backend offline:", e);
        reviews = [];
    } finally {
        showLoading(false);
        filterAndRenderReviews();
    }
}

function extractData(res) {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.result)) return res.result;
    return [];
}

function filterAndRenderReviews() {
    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const ratingVal = ratingFilter ? ratingFilter.value : "ALL";

    const filtered = reviews.filter(r => {
        const cust = (r.customerName || r.userName || "").toLowerCase();
        const boat = (r.boatName || "").toLowerCase();
        const comment = (r.comment || r.reviewText || "").toLowerCase();
        const rating = Number(r.rating || 5);

        const matchesTerm = cust.includes(term) || boat.includes(term) || comment.includes(term);
        const matchesRating = ratingVal === "ALL" || rating === Number(ratingVal);
        return matchesTerm && matchesRating;
    });

    renderReviews(filtered);
    updateStats(reviews);
}

function renderReviews(data) {
    reviewsGrid.innerHTML = "";

    if (data.length === 0) {
        emptyState.style.display = "flex";
        return;
    }
    emptyState.style.display = "none";

    data.forEach(r => {
        const card = document.createElement("div");
        card.className = "review-card";
        const name = r.customerName || r.userName || "Anonymous";
        const initials = getInitials(name);
        const stars = renderStarIcons(r.rating || 5);

        card.innerHTML = `
            <div>
                <div class="review-header">
                    <div class="reviewer-profile">
                        <div class="reviewer-avatar">${initials}</div>
                        <div>
                            <span class="reviewer-name">${escapeHtml(name)}</span>
                            <span class="review-date">${escapeHtml(r.reviewDate || "2026-08-15")}</span>
                        </div>
                    </div>
                </div>

                <div class="star-rating">${stars}</div>

                <div class="review-boat-badge">
                    <i class="fa-solid fa-ship"></i> ${escapeHtml(r.boatName || "Boat Trip")}
                </div>

                <p class="review-comment">"${escapeHtml(r.comment || r.reviewText || "Great experience!")}"</p>
            </div>

            <div class="review-actions">
                <button class="action-btn edit" data-id="${r.reviewId}" data-action="edit">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="action-btn delete" data-id="${r.reviewId}" data-action="delete">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </div>
        `;
        reviewsGrid.appendChild(card);
    });
}

function renderStarIcons(rating) {
    const r = Math.min(Math.max(Number(rating) || 5, 1), 5);
    let html = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= r) html += `<i class="fa-solid fa-star"></i>`;
        else html += `<i class="fa-regular fa-star" style="color: #cbd5e1;"></i>`;
    }
    return html;
}

function updateStats(list) {
    let totalStars = 0;
    let fiveStarCount = 0;
    const boatsSet = new Set();

    list.forEach(r => {
        const rate = Number(r.rating || 5);
        totalStars += rate;
        if (rate === 5) fiveStarCount++;
        if (r.boatName) boatsSet.add(r.boatName);
    });

    const avgScore = list.length > 0 ? (totalStars / list.length).toFixed(1) : "0.0";

    if (avgRatingScoreEl) avgRatingScoreEl.textContent = `${avgScore} ★`;
    if (totalReviewCountEl) totalReviewCountEl.textContent = list.length;
    if (fiveStarCountEl) fiveStarCountEl.textContent = fiveStarCount;
    if (reviewedBoatsCountEl) reviewedBoatsCountEl.textContent = boatsSet.size || list.length;
}

function openAddModal() {
    reviewIdInput.value = "";
    reviewForm.reset();
    reviewDateInput.value = new Date().toISOString().split("T")[0];
    modalTitle.textContent = "Add Customer Review";
    reviewModal.classList.add("active");
}

function openEditModal(id) {
    const r = reviews.find(item => item.reviewId === id);
    if (!r) return;

    reviewIdInput.value = r.reviewId;
    customerNameInput.value = r.customerName || r.userName || "";
    boatNameInput.value = r.boatName || "";
    ratingSelect.value = r.rating || 5;
    reviewDateInput.value = r.reviewDate || "";
    commentInput.value = r.comment || r.reviewText || "";

    modalTitle.textContent = "Edit Review";
    reviewModal.classList.add("active");
}

function closeModal() {
    reviewModal.classList.remove("active");
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = reviewIdInput.value ? Number(reviewIdInput.value) : null;

    const payload = {
        reviewId: id || Date.now(),
        customerName: customerNameInput.value.trim(),
        boatName: boatNameInput.value.trim(),
        rating: Number(ratingSelect.value),
        reviewDate: reviewDateInput.value,
        comment: commentInput.value.trim()
    };

    if (id) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        const idx = reviews.findIndex(r => r.reviewId === id);
        if (idx !== -1) reviews[idx] = payload;
        showToast("Review Updated", "Review saved.");
    } else {
        try {
            await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (err) { console.warn("Backend sync failed:", err); }

        reviews.unshift(payload);
        showToast("Review Added", "Customer feedback published.");
    }

    closeModal();
    filterAndRenderReviews();
}

async function deleteReview(id) {
    if (!confirm("Are you sure you want to remove this review?")) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (err) { console.warn("Backend request failed:", err); }

    reviews = reviews.filter(r => r.reviewId !== id);
    filterAndRenderReviews();
    showToast("Review Deleted", "Customer feedback removed.");
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

function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}