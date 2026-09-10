/* =====================================================
   AQUAVENTURE USER MANAGEMENT JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/users";

// DOM Elements
const userTableBody = document.getElementById("userTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addUserBtn = document.getElementById("addUserBtn");
const userModal = document.getElementById("userModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const userForm = document.getElementById("userForm");
const modalTitle = document.getElementById("modalTitle");

const deleteModal = document.getElementById("deleteModal");
const deleteUserName = document.getElementById("deleteUserName");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

// Stat Elements
const totalUsersEl = document.getElementById("totalUsers");
const customerCountEl = document.getElementById("customerCount");
const staffCountEl = document.getElementById("staffCount");
const adminCountEl = document.getElementById("adminCount");

// Form Elements
const userIdInput = document.getElementById("userId");
const usernameInput = document.getElementById("username");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const contactNumberInput = document.getElementById("contactNumber");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");

let users = [];
let deleteUserId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Search & Filters
    if (searchInput) searchInput.addEventListener("input", filterAndRenderUsers);
    if (roleFilter) roleFilter.addEventListener("change", filterAndRenderUsers);
    if (refreshBtn) refreshBtn.addEventListener("click", loadUsers);

    // Modal controls
    if (addUserBtn) addUserBtn.addEventListener("click", openAddUserModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeUserModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeUserModal);
    if (userForm) userForm.addEventListener("submit", handleFormSubmit);

    // Delete modal controls
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", executeDeleteUser);

    // Table click delegation
    if (userTableBody) {
        userTableBody.addEventListener("click", (e) => {
            const actionBtn = e.target.closest(".action-btn");
            if (!actionBtn) return;
            const id = Number(actionBtn.dataset.id);
            const action = actionBtn.dataset.action;

            if (action === "edit") openEditUserModal(id);
            else if (action === "delete") openDeleteConfirmModal(id);
            else if (action === "view") viewUserDetails(id);
        });
    }

    // Mobile sidebar toggle
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    // Back to top
    window.addEventListener("scroll", () => {
        if (backToTop) {
            if (window.scrollY > 300) backToTop.classList.add("visible");
            else backToTop.classList.remove("visible");
        }
    });

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            showToast("Logged Out", "You have been logged out.");
            setTimeout(() => { window.location.href = "index.html"; }, 1000);
        });
    }
}














// load users to the table 
async function loadUsers() {

    showLoading(true);

    try {

        const token = localStorage.getItem("JWT");

        console.log("JWT:", token);

        if (!token) {
            console.error("JWT token not found!");
            window.location.href = "A2-login.html";
            return;
        }

        const response = await fetch(`${API_URL}/all`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        console.log("HTTP Status:", response.status);

        const result = await response.json();

        console.log("FULL USER RESPONSE:", result);


        if (response.status === 401 || response.status === 403) {

            alert("Session expired or access denied.");

            localStorage.removeItem("JWT");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "A2-login.html";
            return;
        }


        if (!response.ok) {
            throw new Error(
                result.message || `HTTP Error ${response.status}`
            );
        }


        // Try different possible response structures
        if (Array.isArray(result)) {

            users = result;

        } else if (Array.isArray(result.data)) {

            users = result.data;

        } else if (Array.isArray(result.body)) {

            users = result.body;

        } else if (Array.isArray(result.result)) {

            users = result.result;

        } else if (result.data && Array.isArray(result.data.content)) {

            users = result.data.content;

        } else if (result.body && Array.isArray(result.body.content)) {

            users = result.body.content;

        } else {

            console.error("Could not find user array in response.");

            users = [];
        }


        console.log("USERS LOADED:", users);

    } catch (error) {

        console.error("LOAD USERS ERROR:", error);

        users = [];

    } finally {

        showLoading(false);

        filterAndRenderUsers();

    }
}






//best practice(ek ek widiyt enna puluwn data array ekk washyen hadala denw)
function extractUserData(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.result)) return result.result;
    return [];
}









//search
function filterAndRenderUsers() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const roleVal = roleFilter ? roleFilter.value : "ALL";

    const filtered = users.filter(user => {
        const name = (user.fullName || user.username || "").toLowerCase();
        const uname = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const role = extractRole(user);

        const matchesSearch = name.includes(searchTerm) || uname.includes(searchTerm) || email.includes(searchTerm);
        const matchesRole = roleVal === "ALL" || role.toUpperCase() === roleVal.toUpperCase();

        return matchesSearch && matchesRole;
    });

    renderUsers(filtered);
    updateStats(users);
}









//table clean and upload data to table
function renderUsers(data) {
    userTableBody.innerHTML = "";

    if (data.length === 0) {
        emptyState.style.display = "flex";
        return;
    }

    emptyState.style.display = "none";

    data.forEach(user => {
        const row = document.createElement("tr");
        const role = extractRole(user);
        const initials = getInitials(user.fullName || user.username || "U");

        row.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar-badge">${initials}</div>
                    <div>
                        <span class="user-name-title">${escapeHtml(user.fullName || user.username)}</span>
                        <span class="user-sub-id">@${escapeHtml(user.username || "user")} • ID #${user.userId}</span>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(user.email || "N/A")}</td>
            <td>${escapeHtml(user.contactNumber || user.phone || "N/A")}</td>
            <td>
                <span class="role-badge ${role.toLowerCase()}">
                    <i class="fa-solid ${getRoleIcon(role)}"></i>
                    ${role}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" data-id="${user.userId}" data-action="view" title="View details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn edit" data-id="${user.userId}" data-action="edit" title="Edit user">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete" data-id="${user.userId}" data-action="delete" title="Delete user">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}









//if role not availble default customer

function extractRole(user) {
    if (typeof user.role === "string") return user.role;
    if (Array.isArray(user.roles) && user.roles.length > 0) {
        const r = user.roles[0];
        return typeof r === "string" ? r : (r.name || "CUSTOMER");
    }
    return "CUSTOMER";
}





//role icon according to role name (switch case)
function getRoleIcon(role) {
    switch (role.toUpperCase()) {
        case "ADMIN": return "fa-user-shield";
        case "CUSTOMER": return "fa-user-gear";
        default: return "fa-user-tag";
    }
}






//count total users and show    by role
function updateStats(dataList) {
    let total = dataList.length;
    let customers = 0;
    let admins = 0;

    dataList.forEach(u => {
        const r = extractRole(u).toUpperCase();
        if (r === "ADMIN") admins++;
        else customers++;
    });

    if (totalUsersEl) totalUsersEl.textContent = total;
    if (customerCountEl) customerCountEl.textContent = customers;
    if (adminCountEl) adminCountEl.textContent = admins;
}











//new user add krddi form ek clean krnw
function openAddUserModal() {
    userIdInput.value = "";
    userForm.reset();
    modalTitle.textContent = "Add New User";
    userModal.classList.add("active");
}










//edit krna box ek open krnw
function openEditUserModal(id) {
    const user = users.find(u => u.userId === id);
    if (!user) return;

    userIdInput.value = user.userId;
    usernameInput.value = user.username || "";
    fullNameInput.value = user.fullName || "";
    emailInput.value = user.email || "";
    contactNumberInput.value = user.contactNumber || user.phone || "";
    passwordInput.value = "";
    roleSelect.value = extractRole(user).toUpperCase();

    modalTitle.textContent = "Edit User Profile";
    userModal.classList.add("active");
}








//edit box ek close krnww
function closeUserModal() {
    userModal.classList.remove("active");
}








//alert ekk vidiyt penwa details
function viewUserDetails(id) {
    const user = users.find(u => u.userId === id);
    if (!user) return;
    showToast("User Profile", `${user.fullName || user.username} (${extractRole(user)}) - ${user.email}`);
}










//delete confirm box open krnww
function openDeleteConfirmModal(id) {
    const user = users.find(u => u.userId === id);
    if (!user) return;
    deleteUserId = id;
    deleteUserName.textContent = user.fullName || user.username;
    deleteModal.classList.add("active");
}







//delete box ek close krnww
function closeDeleteModal() {
    deleteUserId = null;
    deleteModal.classList.remove("active");
}














//delete button click krddi wena execute ek
async function executeDeleteUser() {
    console.log("DELETE BUTTON CLICKED");
    console.log("DELETE USER ID:", deleteUserId);

    if (deleteUserId === null || deleteUserId === undefined) {
        showToast("Delete Failed", "User not selected.");
        return;
    }

    const token = localStorage.getItem("JWT");

    if (!token) {
        showToast("Authentication Error", "Please login again.");
        window.location.href = "A2-login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${deleteUserId}`, {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        console.log("DELETE STATUS:", response.status);

        const result = await response.json();

        console.log("DELETE RESPONSE:", result);

        if (response.status === 401 || response.status === 403) {
            showToast(
                "Access Denied",
                "You are not authorized to delete users."
            );
            return;
        }

        if (!response.ok) {
            throw new Error(
                result.message || `HTTP Error ${response.status}`
            );
        }

        // DB delete success
        users = users.filter(
            u => Number(u.userId) !== Number(deleteUserId)
        );

        closeDeleteModal();
        filterAndRenderUsers();

        showToast(
            "User Deleted",
            "User record has been permanently removed."
        );

    } catch (error) {
        console.error("DELETE USER ERROR:", error);

        showToast(
            "Delete Failed",
            error.message || "User could not be deleted."
        );
    }
}







async function handleFormSubmit(e) {
    e.preventDefault();

    const id = userIdInput.value ? Number(userIdInput.value) : null;

    const token = localStorage.getItem("JWT");

    if (!token) {
        showToast("Authentication Error", "Please login again.");
        window.location.href = "A2-login.html";
        return;
    }

    // ================= UPDATE =================
    if (id) {

        const userData = {
            userId: id,
            username: usernameInput.value.trim(),
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            contactNumber: contactNumberInput.value.trim(),
            password: passwordInput.value,
            roles: [roleSelect.value]
        };

        console.log("UPDATE ID:", id);
        console.log("UPDATE DATA:", userData);

        try {

            const response = await fetch(API_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(userData)
            });

            console.log("UPDATE HTTP STATUS:", response.status);

            const result = await response.json();

            console.log("UPDATE RESPONSE:", result);

            if (!response.ok) {
                throw new Error(
                    result.message || `HTTP Error ${response.status}`
                );
            }

            showToast(
                "User Updated",
                `${userData.fullName} updated successfully.`
            );

            closeUserModal();

            // Database එකෙන් fresh data ගන්න
            await loadUsers();

        } catch (error) {

            console.error("UPDATE USER ERROR:", error);

            showToast(
                "Update Failed",
                error.message || "User could not be updated."
            );
        }

        return;
    }

    // ================= CREATE =================

    const userData = {
        username: usernameInput.value.trim(),
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        contactNumber: contactNumberInput.value.trim(),
        password: passwordInput.value,
        role: roleSelect.value
    };

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        console.log("CREATE USER RESPONSE:", result);

        if (!response.ok) {
            throw new Error(
                result.message || `HTTP Error ${response.status}`
            );
        }

        showToast(
            "User Created",
            `${userData.fullName} registered successfully.`
        );

        closeUserModal();

        await loadUsers();

    } catch (error) {

        console.error("CREATE USER ERROR:", error);

        showToast(
            "Save Failed",
            error.message || "User could not be saved."
        );
    }
}










function showLoading(isLoading) {
    if (loadingState) loadingState.style.display = isLoading ? "flex" : "none";
}









function showToast(title, message) {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;

    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}










function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}











function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}