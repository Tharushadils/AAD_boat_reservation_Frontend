const API_BASE_URL = "http://localhost:8080/api/boat-categories";

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    setupEventListeners();
});








/**
 * 1. GET ALL CATEGORIES
 * Path: GET /api/boat-categories/all
 */
async function loadCategories() {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const categoryGrid = document.getElementById("categoryGrid");

    if (loadingState) loadingState.style.display = "flex";
    if (emptyState) emptyState.style.display = "none";

    try {
        const token = localStorage.getItem("JWT");

        const response = await fetch(`${API_BASE_URL}/all`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });

        if (!response.ok) throw new Error("Failed to fetch categories");

        const result = await response.json();

        // Controller එකෙන් එන CommonResponse object එකෙන් data array එක ගැනීම
        const categories = result.data || result.body || result || [];
        renderCategories(categories);

    } catch (error) {
        console.error("Error loading categories:", error);
        if (categoryGrid) categoryGrid.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
    } finally {
        if (loadingState) loadingState.style.display = "none";
    }
}







/**
 * 2. RENDER CATEGORIES TO UI
 */
function renderCategories(categories) {
    const categoryGrid = document.getElementById("categoryGrid");
    const emptyState = document.getElementById("emptyState");
    const totalCategories = document.getElementById("totalCategories");

    if (!categoryGrid) return;
    categoryGrid.innerHTML = "";

    if (totalCategories) totalCategories.innerText = categories.length;

    if (!categories || categories.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    categories.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin:0; font-size: 1.1rem;">${cat.categoryName || 'Unnamed Category'}</h3>
                <span class="badge">ID: #${cat.categoryId}</span>
            </div>
            <p class="card-desc" style="margin-top: 10px; color: #64748b;">${cat.description || 'No description provided.'}</p>
            <div class="card-footer" style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 8px;">
                <button class="icon-btn edit-btn" onclick="editCategory(${cat.categoryId}, '${escapeHtml(cat.categoryName)}', '${escapeHtml(cat.description)}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteCategory(${cat.categoryId})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        categoryGrid.appendChild(card);
    });
}








function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}








/**
 * 3. SAVE AND UPDATE EVENT LISTENERS
 * Save: POST /api/boat-categories
 * Update: PUT /api/boat-categories
 */
function setupEventListeners() {
    const categoryForm = document.getElementById("categoryForm");
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const refreshBtn = document.getElementById("refreshBtn");

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener("click", () => {
            document.getElementById("categoryForm").reset();
            document.getElementById("categoryId").value = "";
            document.getElementById("modalTitle").innerText = "New Boat Category";
            document.getElementById("submitBtnText").innerText = "Save Category";
            openModal();
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
    if (refreshBtn) refreshBtn.addEventListener("click", loadCategories);

    if (categoryForm) {
        categoryForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const categoryId = document.getElementById("categoryId").value;
            const categoryName = document.getElementById("categoryName").value;
            const description = document.getElementById("description").value;

            const isUpdate = Boolean(categoryId);

            // DTO Object Payload
            const payload = {
                categoryName: categoryName,
                description: description
            };

            if (isUpdate) {
                payload.categoryId = parseInt(categoryId, 10);
            }

            // Controller Mapping අනුව Direct Base URL එක භාවිතා වේ
            const url = API_BASE_URL;
            const method = isUpdate ? "PUT" : "POST";

            try {
                const token = localStorage.getItem("token") || localStorage.getItem("JWT");

                const res = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token ? `Bearer ${token}` : ""
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await res.json().catch(() => null);

                if (res.ok) {
                    closeModal();
                    loadCategories();
                    showToast("Success", `Category ${isUpdate ? 'updated' : 'saved'} successfully!`);
                } else {
                    const errorMsg = responseData?.message || "Failed to save category details.";
                    showToast("Error", errorMsg);
                }
            } catch (err) {
                console.error("Save/Update Error:", err);
                showToast("Error", "Server connection failed.");
            }
        });
    }
}








/**
 * 4. DELETE CATEGORY
 * Path: DELETE /api/boat-categories/{categoryId}
 */
async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
        const token = localStorage.getItem("token") || localStorage.getItem("JWT");
        const res = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });

        if (res.ok) {
            loadCategories();
            showToast("Success", "Category deleted successfully!");
        } else {
            showToast("Error", "Failed to delete category.");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        showToast("Error", "Server connection failed.");
    }
}










/**
 * 5. MODAL & TOAST HELPERS
 */
function openModal() {
    const modal = document.getElementById("modalOverlay");
    if (modal) modal.classList.add("active");
}








function closeModal() {
    const modal = document.getElementById("modalOverlay");
    if (modal) modal.classList.remove("active");
}











function editCategory(id, name, desc) {
    document.getElementById("categoryId").value = id;
    document.getElementById("categoryName").value = name;
    document.getElementById("description").value = desc;
    document.getElementById("modalTitle").innerText = "Edit Boat Category";
    document.getElementById("submitBtnText").innerText = "Update Category";
    openModal();
}











function showToast(title, msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    const toastTitle = document.getElementById("toastTitle");
    const toastMsg = document.getElementById("toastMessage");

    if (toastTitle) toastTitle.innerText = title;
    if (toastMsg) toastMsg.innerText = msg;

    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}